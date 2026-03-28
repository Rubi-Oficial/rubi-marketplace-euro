# Plano Técnico — Sistema de Destaque Pago (Tiers)

> **Status:** Plano — nenhuma implementação realizada ainda.  
> **Data:** 2026-03-28  
> **Repositório:** rubi-marketplace-euro

---

## 1. Visão Geral da Arquitetura Atual

### Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript 5, Vite 5, TailwindCSS, ShadcnUI, React Router 6, TanStack Query 5, Framer Motion |
| Backend/DB | Supabase (PostgreSQL 14, Auth, Storage, RLS) |
| Funções serverless | Deno (TypeScript) — Edge Functions |
| Pagamentos | Stripe API `2025-08-27.basil`, modo `subscription` |
| Estado | React Context + hooks (`useAuth`, `useProfileFilters`) |
| i18n | Context manual (pt, en, es, fr, de) |
| Testes | Vitest 3.2 + Playwright 1.57 |

### Fluxo de dados atual (simplificado)

```
Browser → React (SPA)
  → supabase-js → eligible_profiles (VIEW, security_barrier)
  → Edge Function: create-checkout → Stripe Checkout
  ← Stripe Webhook → Edge Function: stripe-webhook → subscriptions table
```

### Mecanismo de destaque existente

A tabela `profiles` já possui dois campos relevantes:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `is_featured` | `boolean DEFAULT false` | Liga/desliga destaque |
| `featured_until` | `timestamptz` | Validade do destaque |

A view `eligible_profiles` expõe esses campos e a ordenação atual em `profileApi.ts` é:

```typescript
.order("is_featured", { ascending: false })   // 1º critério
.order("created_at",  { ascending: false })   // 2º critério
.order("id",          { ascending: false })   // 3º critério (tiebreaker)
```

> **Conclusão:** a fundação já existe. O sistema de tiers é uma **extensão** natural, não uma reescrita.

---

## 2. Arquivos e Tabelas a Reaproveitar

### Tabelas existentes que serão estendidas

| Tabela | Ação | Motivo |
|--------|------|--------|
| `profiles` | `ALTER TABLE` (adicionar colunas) | Armazena tier ativo e `sort_key` |
| `plans` | `ALTER TABLE` (adicionar coluna `tier`) | Marcar qual plano concede qual tier |
| `subscriptions` | Sem mudança de schema | Já cobre validade via `expires_at` |
| `stripe_webhook_event_dedup` | Sem mudança | Idempotência já implementada |
| `admin_actions` | Sem mudança | Audit log já pronto |

### Tabela nova necessária

| Tabela | Motivo |
|--------|--------|
| `highlight_events` | Log imutável de cada ativação/subida; permite recalcular `sort_key` e auditoria |

### Edge Functions existentes a modificar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/create-checkout/index.ts` | Aceitar `highlight_type: 'plan' \| 'boost'` no payload |
| `supabase/functions/stripe-webhook/index.ts` | Detectar tier do plano e despachar lógica de posicionamento |

### Arquivos frontend existentes a modificar

| Arquivo | Mudança |
|---------|---------|
| `src/lib/profileApi.ts` | Ordenação por tier + `sort_key`; expor `highlight_tier` |
| `src/components/public/ProfileCard.tsx` | Badge visual por tier |
| `src/pages/dashboard/escort/EscortSubscription.tsx` | UI para comprar boost |
| `src/pages/dashboard/escort/EscortDashboard.tsx` | Status do tier e botão de subida |
| `src/pages/dashboard/admin/AdminPlans.tsx` | Campo `tier` no CRUD de planos |
| `src/integrations/supabase/types.ts` | Regenerar após cada migração |

---

## 3. Modelo de Dados Mínimo

### 3.1 Enum de tiers (PostgreSQL)

```sql
CREATE TYPE public.highlight_tier AS ENUM ('standard', 'premium', 'exclusive');
```

> **Mapeamento de negócio:**
> - `standard` = plano base (sem prioridade extra)
> - `premium`  = 2.º bloco de prioridade
> - `exclusive` = 1.º bloco (topo absoluto)

### 3.2 Colunas novas em `profiles`

```sql
ALTER TABLE public.profiles
  ADD COLUMN highlight_tier    public.highlight_tier NOT NULL DEFAULT 'standard',
  ADD COLUMN highlight_expires_at TIMESTAMPTZ,
  ADD COLUMN sort_key          BIGINT NOT NULL DEFAULT 0;

-- Índice composto para a query de listagem
CREATE INDEX idx_profiles_listing
  ON public.profiles (highlight_tier DESC, sort_key DESC)
  WHERE status = 'approved';
```

**Por que `sort_key` como `BIGINT`?**  
Permite ordenação monotônica sem depender de timestamps (que colidem em inserções rápidas). Cada evento de ativação ou boost gera um novo `sort_key = nextval('highlight_sort_seq')`.

```sql
CREATE SEQUENCE public.highlight_sort_seq START 1 INCREMENT 1;
```

### 3.3 Coluna nova em `plans`

```sql
ALTER TABLE public.plans
  ADD COLUMN tier              public.highlight_tier NOT NULL DEFAULT 'standard',
  ADD COLUMN is_boost          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN highlight_days    INTEGER NOT NULL DEFAULT 30;
```

| Campo | Descrição |
|-------|-----------|
| `tier` | Qual tier este plano concede ao ativar |
| `is_boost` | Se `true`, este é um produto de "subida" (não renova validade) |
| `highlight_days` | Quantos dias de validade do tier (ignorado para `is_boost`) |

### 3.4 Tabela `highlight_events` (nova, imutável)

```sql
CREATE TABLE public.highlight_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  event_type      TEXT NOT NULL,          -- 'plan_activated' | 'boost_applied' | 'plan_renewed' | 'expired'
  tier            public.highlight_tier NOT NULL,
  sort_key        BIGINT NOT NULL,        -- valor atribuído ao profile neste evento
  valid_until     TIMESTAMPTZ,           -- null para boosts (sem prazo fixo)
  stripe_session_id TEXT,
  idempotency_key   TEXT UNIQUE,         -- ex: stripe_event_id
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_highlight_events_profile ON public.highlight_events(profile_id);
```

> **Regra de negócio codificada no schema:**
> - `plan_renewed` → **não** gera novo `sort_key` no profile (apenas estende `highlight_expires_at`)
> - `boost_applied` → gera **novo** `sort_key = nextval(...)` no profile (sobe para o topo do tier)
> - `plan_activated` → gera novo `sort_key` (entra no fim do bloco do tier, mas na prática é o valor mais recente da sequência, que cresce para novos entrantes)

**Nota sobre "fim do bloco":**  
Ao ativar um novo plano, atribui-se `sort_key = nextval(...)`. Como a listagem ordena `sort_key DESC`, perfis ativados depois têm sort_key maior e ficam na frente dentro do tier. Isso significa que "entrar no fim do bloco" é o comportamento natural — o administrador pode ajustar via reset do `sort_key` se necessário.  
Para implementar estritamente "no fim do bloco" (entrar atrás dos existentes), use `sort_key = MIN(sort_key) - 1` dentro do tier atual ou gere a sequência de forma reversa. **Decisão a confirmar com o produto.**

---

## 4. Queries de Listagem e Busca

### 4.1 View `eligible_profiles` atualizada

```sql
DROP VIEW IF EXISTS public.eligible_profiles;

CREATE VIEW public.eligible_profiles
WITH (security_barrier = true, security_invoker = false)
AS
SELECT
  p.id,
  p.display_name,
  p.age,
  p.city,
  p.city_slug,
  p.country,
  p.category,
  p.gender,
  p.slug,
  p.bio,
  p.languages,
  p.pricing_from,
  p.is_featured,
  p.featured_until,
  p.highlight_tier,
  p.highlight_expires_at,
  p.sort_key,
  p.created_at,
  p.updated_at,
  (p.whatsapp IS NOT NULL AND p.whatsapp <> '') AS has_whatsapp,
  (p.telegram IS NOT NULL AND p.telegram <> '') AS has_telegram
FROM profiles p
WHERE p.status = 'approved'::profile_status
  AND (
    -- standard: visível se tiver assinatura ativa
    (p.highlight_tier = 'standard' AND EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = p.user_id AND s.status = 'active'
    ))
    OR
    -- premium/exclusive: visível se tier não expirou
    (p.highlight_tier IN ('premium', 'exclusive')
      AND (p.highlight_expires_at IS NULL OR p.highlight_expires_at > now()))
  );

GRANT SELECT ON public.eligible_profiles TO anon, authenticated;
```

### 4.2 Query de listagem em `profileApi.ts`

```typescript
let query = supabase
  .from("eligible_profiles")
  .select("id, display_name, age, city, city_slug, category, gender, slug, " +
          "pricing_from, is_featured, highlight_tier, sort_key, bio, has_whatsapp")
  // Bloco 1: exclusive no topo
  // Bloco 2: premium
  // Bloco 3: standard
  .order("highlight_tier", { ascending: false })   // 'standard' < 'premium' < 'exclusive' alfabeticamente NÃO funciona
  // → usar CASE na view ou coluna numérica
  .order("sort_key", { ascending: false })
  .order("created_at", { ascending: false });
```

**Atenção:** `highlight_tier` é um enum de texto. A ordenação `DESC` resultaria em `standard > premium > exclusive` (alfabética). Soluções:

**Opção A — Coluna `tier_rank` na view (recomendada):**
```sql
CASE p.highlight_tier
  WHEN 'exclusive' THEN 3
  WHEN 'premium'   THEN 2
  ELSE 1
END AS tier_rank
```
Então: `.order("tier_rank", { ascending: false }).order("sort_key", { ascending: false })`

**Opção B — Ordem do enum no PostgreSQL:**
```sql
ALTER TYPE public.highlight_tier RENAME TO _old_highlight_tier;
CREATE TYPE public.highlight_tier AS ENUM ('standard', 'premium', 'exclusive');
-- Enum ordena por posição de declaração: standard=0, premium=1, exclusive=2
```
Então `ORDER BY highlight_tier DESC` funciona nativamente.

> **Recomendação:** Opção B (enum com ordem correta de declaração). Simples e idiomática no PostgreSQL.

### 4.3 Busca com filtros (sem mudança na lógica de filtro)

Os filtros existentes (`country`, `city_slug`, `category`, `gender`, `search`, `service_slug`) **não precisam mudar**. A ordenação simplesmente passa a usar `tier_rank DESC, sort_key DESC` em vez de `is_featured DESC, created_at DESC`.

---

## 5. Integração com Pagamentos e Webhooks

### 5.1 Dois tipos de produto Stripe

| Tipo | `plans.is_boost` | Comportamento no webhook |
|------|-----------------|--------------------------|
| Plano de tier | `false` | Ativa tier + define `highlight_expires_at` + atribui `sort_key` (nova ativação) ou apenas estende `highlight_expires_at` (renovação) |
| Boost (subida) | `true` | Atribui novo `sort_key = nextval(...)` sem alterar `highlight_expires_at` |

### 5.2 Idempotência (já garantida)

A tabela `stripe_webhook_event_dedup` já previne reprocessamento. Adicionalmente, a coluna `highlight_events.idempotency_key` (com `UNIQUE`) garante que o mesmo evento Stripe não gere dois registros.

### 5.3 Lógica no `stripe-webhook` (pseudocódigo)

```typescript
case "checkout.session.completed": {
  const { user_id, plan_id, highlight_type } = session.metadata;
  // highlight_type: 'plan' | 'boost'

  const plan = await supabase.from("plans").select("*").eq("id", plan_id).single();

  if (plan.is_boost) {
    // BOOST: subida manual
    const newSortKey = await nextval("highlight_sort_seq");
    await supabase.from("profiles")
      .update({ sort_key: newSortKey })
      .eq("user_id", user_id);

    await supabase.from("highlight_events").insert({
      profile_id, user_id, event_type: "boost_applied",
      tier: currentTier, sort_key: newSortKey,
      valid_until: null,
      idempotency_key: session.id,
    });

  } else {
    // PLANO: verificar se já tem tier ativo (renovação vs. ativação nova)
    const { data: profile } = await supabase.from("profiles")
      .select("highlight_tier, highlight_expires_at, sort_key")
      .eq("user_id", user_id).single();

    const isRenewal = profile.highlight_tier === plan.tier
      && profile.highlight_expires_at
      && new Date(profile.highlight_expires_at) > new Date();

    const newExpiry = new Date(
      isRenewal
        ? new Date(profile.highlight_expires_at).getTime()
        : Date.now()
    );
    newExpiry.setDate(newExpiry.getDate() + plan.highlight_days);

    const newSortKey = isRenewal ? profile.sort_key : await nextval("highlight_sort_seq");

    await supabase.from("profiles").update({
      highlight_tier: plan.tier,
      highlight_expires_at: newExpiry.toISOString(),
      sort_key: isRenewal ? undefined : newSortKey,  // não reposiciona na renovação
    }).eq("user_id", user_id);

    await supabase.from("highlight_events").insert({
      profile_id, user_id,
      event_type: isRenewal ? "plan_renewed" : "plan_activated",
      tier: plan.tier, sort_key: newSortKey,
      valid_until: newExpiry.toISOString(),
      idempotency_key: session.id,
    });
  }
}
```

### 5.4 Checkout (`create-checkout`)

Passar metadados adicionais na criação da sessão Stripe:

```typescript
metadata: {
  user_id: user.id,
  plan_id: plan.id,
  highlight_type: plan.is_boost ? "boost" : "plan",  // novo
}
```

### 5.5 Expiração automática (cron job via pg_cron ou Supabase Scheduled Functions)

```sql
-- Executar a cada hora (ou via pg_cron)
UPDATE public.profiles
SET
  highlight_tier = 'standard',
  sort_key = 0
WHERE highlight_tier IN ('premium', 'exclusive')
  AND highlight_expires_at < now();
```

---

## 6. Plano de Implementação em 7 Etapas

### Etapa 1 — Schema do banco (base de tudo)
- Criar enum `highlight_tier`
- `ALTER TABLE profiles` (adicionar `highlight_tier`, `highlight_expires_at`, `sort_key`)
- `ALTER TABLE plans` (adicionar `tier`, `is_boost`, `highlight_days`)
- Criar sequência `highlight_sort_seq`
- Criar tabela `highlight_events`
- Recriar view `eligible_profiles` com novos campos e `tier_rank`
- Adicionar índices
- Regenerar `src/integrations/supabase/types.ts`

### Etapa 2 — Backend: webhook e checkout
- Modificar `stripe-webhook/index.ts`: detectar tipo de plano, ativar tier, registrar evento
- Modificar `create-checkout/index.ts`: repassar `highlight_type` no metadata
- Implementar função auxiliar `nextval` via `supabase.rpc("next_sort_key")`
- Implementar lógica de expiração (função SQL ou scheduled function)

### Etapa 3 — API de listagem frontend
- Atualizar `EligibleProfile` interface em `profileApi.ts`
- Trocar ordenação para `tier_rank DESC, sort_key DESC`
- Expor `highlight_tier` e `sort_key` nos resultados

### Etapa 4 — Admin: gestão de planos
- Atualizar `AdminPlans.tsx`: adicionar campos `tier`, `is_boost`, `highlight_days` no CRUD
- Criar planos de exemplo: Standard, Premium, Exclusive, Boost Premium, Boost Exclusive

### Etapa 5 — Dashboard escort: compra e status
- `EscortDashboard.tsx`: mostrar tier ativo, validade, CTA de boost se tier ≥ premium
- `EscortSubscription.tsx`: separar seção de planos base e boosts
- Conectar botão "Subir ao topo" ao fluxo `create-checkout` com plano `is_boost = true`

### Etapa 6 — Frontend público: badges e ordenação
- `ProfileCard.tsx`: badge visual por tier (`standard` sem badge, `premium` badge prata, `exclusive` badge dourado/diamante)
- Garantir que a grade já exibe na ordem correta (vem da API)

### Etapa 7 — Validação e QA
- Testes E2E Playwright: fluxo de compra → tier ativo → badge visível → subida
- Verificar idempotência: reenviar mesmo evento Stripe → sem duplicação
- Verificar renovação: não reposiciona perfil
- Verificar expiração automática: tier volta para `standard`
- Testes de carga na query de listagem com índice composto

---

## 7. Riscos de Compatibilidade

### 7.1 View `eligible_profiles` — Risco: ALTO

A view é o único canal de acesso público aos perfis e tem `security_barrier`. Qualquer alteração na sua definição precisa:
- Recriar com `DROP VIEW … CASCADE` (pode quebrar policies dependentes)
- Testar grants após recriação (`GRANT SELECT TO anon, authenticated`)
- **Ação:** sempre finalizar a migração com o `GRANT` explícito (padrão já adotado)

### 7.2 Tipos gerados (`types.ts`) — Risco: MÉDIO

`src/integrations/supabase/types.ts` é auto-gerado. Toda migração exige rodar `supabase gen types typescript` para mantê-lo sincronizado. Se o deploy de migração e o deploy do frontend não forem atômicos, pode haver divergência temporária de tipos.

- **Ação:** incluir regeneração dos tipos no CI/CD como pré-requisito do build.

### 7.3 Ordenação do enum — Risco: MÉDIO

PostgreSQL ordena enums pela posição de declaração. Se o enum `highlight_tier` for criado na ordem errada, `ORDER BY highlight_tier DESC` produzirá resultado incorreto.

- **Ação:** criar o enum estritamente como `('standard', 'premium', 'exclusive')` e validar com `SELECT ENUM_RANGE(NULL::highlight_tier)`.

### 7.4 Planos existentes sem `tier` — Risco: BAIXO

Planos já cadastrados receberão `DEFAULT 'standard'` na migração. Isso é seguro, mas o admin precisará editar manualmente os planos existentes para atribuir o tier correto.

- **Ação:** incluir `UPDATE plans SET tier = 'premium' WHERE name ILIKE '%premium%'` na migração como sugestão (reversível via admin UI).

### 7.5 Perfis existentes com `is_featured = true` — Risco: BAIXO

Os perfis já featured precisam ser migrados para `highlight_tier = 'premium'` ou `'exclusive'` conforme decisão de produto.

```sql
-- Migração de dados sugerida (a confirmar com produto)
UPDATE profiles
SET highlight_tier = 'premium', highlight_expires_at = featured_until
WHERE is_featured = true AND featured_until > now();
```

- **Ação:** incluir na migração como script opcional, executado manualmente após validação.

### 7.6 `sort_key = 0` para perfis antigos — Risco: BAIXO

Perfis existentes terão `sort_key = 0`. Perfis novos receberão valores crescentes. Isso significa que perfis antigos com tier premium/exclusive (migrados) ficarão atrás dos novos. Corrigir aplicando `nextval` a todos os migrados.

```sql
UPDATE profiles
SET sort_key = nextval('highlight_sort_seq')
WHERE highlight_tier IN ('premium', 'exclusive');
```

### 7.7 Stripe: produtos de "boost" sem assinatura recorrente — Risco: MÉDIO

O fluxo atual do `create-checkout` cria sessões no modo `subscription`. Boosts (pagamento único) precisam usar `mode: "payment"` ao invés de `mode: "subscription"` na sessão Stripe.

- **Ação:** passar `highlight_type` no corpo do request para `create-checkout` e bifurcar a criação da sessão Stripe (`mode: "payment"` para boosts, `mode: "subscription"` para planos).
- O webhook correspondente para pagamentos únicos é `payment_intent.succeeded` (não `checkout.session.completed` com subscription).

### 7.8 RLS em `highlight_events` — Risco: BAIXO

A nova tabela precisa de políticas RLS:
- `SELECT`: dono do perfil + admin
- `INSERT`: apenas service role (via Edge Function)
- `UPDATE/DELETE`: apenas admin (audit log não deve ser editado pelo usuário)

---

## Decisões de Schema (Resumo)

| Decisão | Escolha | Alternativa descartada |
|---------|---------|------------------------|
| Tipo do tier | Enum PostgreSQL (`standard`, `premium`, `exclusive`) | Coluna `text` com CHECK |
| Ordenação por tier | Posição do enum + `ORDER BY … DESC` | Coluna `tier_rank INT` na view |
| Sort key | Sequência monotônica `BIGINT` | `updated_at` timestamp (colisões) |
| Log de eventos | Tabela imutável `highlight_events` | Apenas campos na tabela `profiles` |
| Boosts sem prazo | `valid_until = NULL` em `highlight_events` | Campo `boost_expires_at` separado |
| Stripe boost | `mode: "payment"` (pagamento único) | `mode: "subscription"` (assinatura) |

---

## Decisões de Backend (Resumo)

| Decisão | Escolha |
|---------|---------|
| Idempotência | `stripe_webhook_event_dedup` (existente) + `highlight_events.idempotency_key UNIQUE` |
| Expiração automática | Supabase Scheduled Function ou `pg_cron` com UPDATE |
| Próximo sort_key | `supabase.rpc("next_sort_key")` → `SELECT nextval('highlight_sort_seq')` |
| Renovação sem reposicionamento | Condição `isRenewal` no webhook; não chama `nextval` |

---

## Decisões de Frontend (Resumo)

| Decisão | Escolha |
|---------|---------|
| Badge visual | `standard` = sem badge; `premium` = borda/ícone prata; `exclusive` = borda/ícone dourado |
| Estado do tier no dashboard | Hook `useHighlightStatus(userId)` consumindo `profiles` via Supabase |
| Compra de boost | Botão "Subir ao topo" → mesmo fluxo `create-checkout` com `plan_id` de plano boost |
| Tipos sincronizados | `supabase gen types typescript` após cada migração |

---

## Checklist de Validação

### Schema
- [ ] Enum `highlight_tier` criado com ordem correta (`standard < premium < exclusive`)
- [ ] Colunas adicionadas em `profiles` sem quebrar RLS existente
- [ ] View `eligible_profiles` recriada com grants corretos
- [ ] Índice composto `(highlight_tier, sort_key)` criado
- [ ] Tabela `highlight_events` com RLS configurada
- [ ] `types.ts` regenerado após migração

### Backend
- [ ] Webhook trata `plan_activated` sem reposicionar em renovação
- [ ] Webhook trata `boost_applied` atribuindo novo `sort_key`
- [ ] Webhook é idempotente (mesmo evento → sem duplicação)
- [ ] `create-checkout` bifurca modo Stripe (`payment` vs `subscription`)
- [ ] Expiração automática executando e revertendo tier para `standard`
- [ ] Boosts de tier inferior não sobrescrevem tier superior ativo

### Frontend
- [ ] `EligibleProfile` interface inclui `highlight_tier`, `sort_key`
- [ ] Listagem ordenada corretamente: `exclusive → premium → standard`
- [ ] Badge visual correto por tier no `ProfileCard`
- [ ] Dashboard do escort mostra tier ativo e validade
- [ ] Botão "Subir ao topo" só aparece para perfis premium/exclusive ativos
- [ ] Fluxo de compra de boost redireciona para Stripe e retorna com sucesso

### QA
- [ ] Perfil novo `premium` aparece atrás de `premium` mais antigo (sem boost)
- [ ] Boost move perfil para frente dos outros premium
- [ ] Renovação de plano não reposiciona perfil
- [ ] Expiração do tier retira badge e reordena na listagem
- [ ] Reenvio do mesmo evento Stripe não duplica `highlight_events`
- [ ] Admin consegue criar plano de boost via `AdminPlans`
- [ ] Perfis `standard` continuam visíveis e funcionais
