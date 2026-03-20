

# Plano: Traduzir 100% do site com seletor de idiomas

## Resumo

O seletor de idiomas já funciona nas páginas públicas principais, mas **~20 componentes e páginas** ainda contêm textos fixos em português ou inglês que não respondem à troca de idioma. Este plano corrige isso adicionando ~200 novas chaves de tradução nos 5 idiomas e substituindo todos os textos hardcoded por chamadas `t()`.

## Áreas com textos não traduzidos (diagnóstico)

### Componentes públicos compartilhados
- **FilterModal**: "Filters", "Services", "Category", "Search filters...", "Clear all", "Show N results"
- **LocationModal**: "Location", "All cities", "Based on your location", "Clear location filter"
- **ActiveFilterChips**: "Clear all"
- **ProfileCard**: "Featured"
- **ProfileInfo**: "Featured", "years", "From €", "Services"
- **VideoSection**: "Latest Videos", "Exclusive content...", "Details"
- **ServiceSlugBar**: "Todos"
- **CategoryBar**: "All" (hardcoded, não usa `t()`)
- **NotFound**: todos os textos

### Páginas de autenticação
- **LoginPage**: "Acesse sua conta", "Email", "Senha", "Entrar", "Entrando...", "ou continue com", "Não tem conta?", "Cadastre-se", toast messages
- **RegisterPage**: "Crie sua conta", "Nome completo", "Tipo de conta", "Cliente", "Profissional", "Criar conta", "Criando conta...", "ou continue com", "Já tem conta?", "Código de afiliado"

### Dashboard Layout e painéis internos
- **DashboardLayout**: todos os labels de navegação lateral ("Painel", "Meu Perfil", "Fotos & Vídeos", etc.), labels de role ("Administrador", "Acompanhante", "Cliente"), botão "Sair"
- **EscortSettings**: "Configurações", "Dados pessoais", "Alterar senha", "Salvar", etc.
- **ClientSettings**: mesmos textos de settings
- **EscortDashboard**: labels de status ("Rascunho", "Em análise"), textos de banners, estatísticas, links rápidos
- **AdminDashboard**: "Painel Administrativo", seções de métricas, labels de sanidade
- **AdminSettings**: "Configurações", "Histórico de Ações", formatAction labels
- **AdminPayments**: labels de status, filtros
- Toasts em múltiplos arquivos ("Dados atualizados!", "Erro ao salvar", etc.)

## Plano de implementação

### Passo 1 — Expandir `translations.ts` (~200 novas chaves)
Adicionar chaves organizadas por seção nos 5 idiomas:
- `filter.*` — FilterModal, ActiveFilterChips
- `location.*` — LocationModal
- `profile_info.*` — ProfileInfo labels
- `video.*` — VideoSection
- `auth.*` — LoginPage, RegisterPage (expandir as existentes)
- `dashboard.*` — DashboardLayout nav labels
- `settings.*` — EscortSettings, ClientSettings
- `escort_dash.*` — EscortDashboard
- `admin.*` — AdminDashboard, AdminSettings, AdminPayments
- `notfound.*` — NotFound page
- `common.*` — toasts reutilizáveis, "Featured", "years", etc.

### Passo 2 — Componentes públicos (6 arquivos)
Adicionar `useLanguage` e substituir textos fixos em:
1. `FilterModal.tsx`
2. `LocationModal.tsx`
3. `ActiveFilterChips.tsx`
4. `ProfileCard.tsx` (badge "Featured")
5. `ProfileInfo.tsx`
6. `VideoSection.tsx`
7. `ServiceSlugBar.tsx`
8. `CategoryBar.tsx`
9. `NotFound.tsx`

### Passo 3 — Páginas de autenticação (2 arquivos)
1. `LoginPage.tsx`
2. `RegisterPage.tsx`

### Passo 4 — Dashboard e painéis internos (~6 arquivos)
1. `DashboardLayout.tsx` — nav items e role labels dinâmicos
2. `EscortSettings.tsx`
3. `ClientSettings.tsx`
4. `EscortDashboard.tsx`
5. `AdminDashboard.tsx`
6. `AdminSettings.tsx`

### Regras mantidas
- Nenhuma alteração de layout
- Nenhuma alteração de funcionalidade
- Apenas substituição de strings por `t("chave")`
- Persistência de idioma via localStorage já funciona

### Resultado
Ao trocar o idioma no seletor do navbar, **100% dos textos** visíveis no site (público + autenticado) serão traduzidos de forma consistente.

