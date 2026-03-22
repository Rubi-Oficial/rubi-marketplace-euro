

## Plano: Sistema de Analytics de Acessos ao Site

### Contexto
Atualmente o sistema não possui nenhuma tabela de tracking de visitas ao site. Apenas `referral_clicks` rastreia cliques de afiliados e `leads` rastreia contatos com perfis. Precisamos criar uma infraestrutura completa de analytics.

### O que será implementado

**1. Nova tabela `site_visits`** (migração)
Campos capturados por visita:
- `id`, `created_at`
- `session_id` (UUID gerado no browser para agrupar pageviews da mesma sessão)
- `page_path` (URL visitada)
- `referrer_url` (de onde veio o visitante — Google, redes sociais, direto)
- `utm_source`, `utm_medium`, `utm_campaign` (parâmetros de marketing)
- `ip_hash` (hash SHA-256 do IP — privacidade preservada, mas permite detectar padrões)
- `country_code`, `city_name` (geolocalização do IP)
- `user_agent` (browser/device)
- `device_type` (mobile/desktop/tablet — extraído do user_agent)
- `user_id` (nullable — preenchido se estiver autenticado)
- `is_bot` (flag booleana para acessos suspeitos)

RLS: INSERT aberto para `anon`/`authenticated`; SELECT apenas para admins.

**2. Edge Function `track-visit`**
Recebe dados do frontend e captura informações server-side:
- Extrai o IP real do header `x-forwarded-for`
- Gera hash SHA-256 do IP (não armazena IP raw)
- Faz geo-lookup do IP via API gratuita para obter país/cidade
- Detecta bots via user_agent (padrões conhecidos: Googlebot, curl, etc.)
- Classifica device_type a partir do user_agent
- Insere na tabela `site_visits`

**3. Hook `usePageTracking`** (frontend)
- Gera `session_id` no sessionStorage (persiste na sessão)
- A cada navegação de rota, invoca a edge function `track-visit`
- Envia: `page_path`, `referrer_url`, `utm_*`, `user_agent`
- Integrado no `App.tsx` para tracking global automático

**4. Nova aba "Access Analytics" no AdminReports**
Dashboard analítico com:
- **KPIs**: Total de visitas (24h, 7d, 30d), visitantes únicos, taxa de bots
- **Gráfico de linha**: Visitas por dia (últimos 30 dias)
- **Gráfico de barras**: Top 10 páginas mais visitadas
- **Gráfico de pizza**: Distribuição por device (mobile/desktop/tablet)
- **Tabela de origens**: Top referrers e UTM sources
- **Tabela de geolocalização**: Top países e cidades
- **Painel de segurança**: Acessos suspeitos — IPs com volume anormal (>100 hits/hora), bots detectados, user_agents incomuns

**5. RPC `get_access_analytics`** (função no banco)
Consulta agregada com segurança (`security definer`, verifica admin) que retorna todos os dados necessários para o dashboard em uma única chamada.

### Arquivos criados/modificados
- **Nova migração**: Cria tabela `site_visits` + função `get_access_analytics` + RLS
- **Novo**: `supabase/functions/track-visit/index.ts`
- **Novo**: `src/hooks/usePageTracking.ts`
- **Modificado**: `src/App.tsx` — adiciona hook `usePageTracking`
- **Modificado**: `src/pages/dashboard/admin/AdminReports.tsx` — nova aba "Acessos"

### Detecção de acessos maliciosos
O painel de segurança identifica:
- IPs (hashed) com >100 requisições/hora
- User agents de bots/scrapers conhecidos
- Acessos com padrões repetitivos (mesmo path em loop)
- Sessões com >50 pageviews (comportamento não humano)

