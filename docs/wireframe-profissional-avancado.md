# Wireframe Profissional Avançado — Marketplace Rubi

Data: 2026-04-14
Objetivo: maximizar descoberta, confiança e retenção sem aumentar fricção de navegação.

## 1) Wireframe em nível de componente (implementação orientada)

### 1.1 Home (`/`)

**A. Header sticky**
- `BrandLogo`
- `LocationTrigger` (cidade/país atual)
- `SearchInput` (nome, bairro, serviço)
- `FavoritesTrigger`
- `AuthTrigger`
- `PrimaryCTA`: **Publicar anúncio**

**B. Hero**
- `HeroTitle`
- `HeroSubtitle`
- `PrimarySearchBar`
- `QuickFilterChips`
- `PrimaryCTA`: **Buscar agora**

**C. Bloco de intenção rápida (Quick Actions)**
- `SectionLabel`: “Acesso rápido”
- `QuickActionButton`: Buscar agora
- `QuickActionButton`: Ver planos
- `QuickActionButton`: Publicar anúncio
- `TrustBadgesInline`: Verificado, Privacidade, Suporte

**D. Área de listagem com filtros**
- `MobileFilterBar` (mobile)
- `FilterBar` (desktop)
- `ActiveFilterChips`
- `ProfileGrid`
- `InfiniteScrollSentinel`
- `EmptyState`

**E. Engajamento pós-listagem**
- `VideoSection`
- `CTASection`
- `SeoNavigationBlocks`

---

### 1.2 Página de listagem (`/buscar`, cidade/categoria)

**A. Topo funcional**
- Breadcrumb
- Total de resultados
- Ordenação: Relevância / Recentes / Mais avaliados / Menor preço

**B. Corpo em duas colunas (desktop)**
- Coluna esquerda: `StickyFilterPanel`
- Coluna direita: `ProfileGrid`

**C. Card de resultado (padrão)**
- `ProfileImage`
- `TierBadge` / `VerifiedBadge`
- `ProfileMeta` (nome, idade, localização)
- `ResponseInfo` (online/agora)
- `PriceHint` (se aplicável)
- CTA 1: Ver perfil
- CTA 2: Favoritar
- CTA 3: Contato rápido

---

### 1.3 Perfil detalhado (`/perfil/:slug`)

**A. Acima da dobra**
- `ImageCarousel`
- `ProfileInfo`
- `TrustSignals` (verificado, resposta média)
- CTA fixo: Contato
- CTA secundário: Favoritar

**B. Abaixo da dobra**
- `Description`
- `ServicesPicker` (somente leitura no público)
- `Availability`
- `SafetyActions` (denúncia)
- `RelatedProfiles`

---

### 1.4 Planos e subidas (`/planos` + dashboard)

**A. Grid de planos**
- `PlanCard` com destaque no recomendado
- Lista de benefícios clara por plano
- CTA por card

**B. Blocos de confiança comercial**
- Cancelamento flexível
- Ativação rápida
- Programa de indicação

**C. Dashboard anunciante**
- KPIs: visualizações, contatos, favoritos
- Botão de ação primária: **Subir anúncio**
- Alertas: queda de posicionamento

---

## 2) Copy exata (títulos, botões e microcopy)

### 2.1 Home
- H1: **Encontre perfis verificados na sua região**
- Subtítulo: **Busca rápida por cidade, serviço e disponibilidade em tempo real.**
- Botão primário: **Buscar agora**
- Botão secundário: **Ver planos**
- Botão terciário: **Publicar anúncio**
- Selo 1: **Perfis verificados**
- Selo 2: **Privacidade protegida**
- Selo 3: **Suporte dedicado**

### 2.2 Listagem
- Título: **Resultados para sua busca**
- Ordenação: **Mais relevantes** | **Mais recentes** | **Mais avaliados** | **Menor preço**
- CTA card: **Ver perfil**
- CTA card secundário: **Favoritar**
- CTA card terciário: **Contato rápido**
- Estado vazio: **Nenhum resultado com esses filtros. Ajuste os filtros ou amplie a localização.**

### 2.3 Perfil
- CTA principal: **Entrar em contato**
- CTA secundário: **Salvar nos favoritos**
- Bloco confiança: **Perfil verificado**
- Ação de segurança: **Denunciar perfil**

### 2.4 Planos
- H1: **Escolha o plano ideal para ganhar mais visibilidade**
- Badge destaque: **Mais popular**
- CTA card: **Começar agora**
- Rodapé de segurança: **Sem fidelidade. Cancele quando quiser.**

---

## 3) Fluxo completo do usuário (visitante → cadastro → contato → retorno)

### Fase 1 — Descoberta (Visitante)
1. Usuário entra na home.
2. Define cidade e serviço nos filtros rápidos.
3. Vê cards com sinais de confiança e abre um perfil.

**Métrica foco:** tempo até primeiro clique no card.

### Fase 2 — Consideração (Visitante engajado)
1. Usuário compara 2–4 perfis.
2. Favorita os melhores.
3. Executa contato rápido.

**Métrica foco:** taxa de favoritar e de clique em contato.

### Fase 3 — Conversão (Anunciante)
1. Profissional acessa planos.
2. Seleciona plano recomendado.
3. Conclui cadastro/check-out.

**Métrica foco:** conversão plano por origem de tráfego.

### Fase 4 — Retenção
1. Usuário retorna para “favoritos recentes”.
2. Recebe novidades por cidade/interesse.
3. Repete sessão com menor fricção.

**Métrica foco:** retenção D7/D30 e sessões recorrentes.

---

## 4) Ajustes já aplicados no código nesta entrega

1. Inserido bloco “Acesso rápido” na home com CTAs de alta intenção (buscar, planos, publicar).
2. Inseridos sinais de confiança acima da listagem para reduzir fricção percebida.
3. Mantida compatibilidade i18n com fallback textual para não quebrar traduções existentes.
