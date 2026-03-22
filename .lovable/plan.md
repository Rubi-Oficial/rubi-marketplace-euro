

## Plano: Contador de Cliques WhatsApp nos Dashboards

### Contexto atual
O sistema **já rastreia** cliques WhatsApp na tabela `leads` com `source = "whatsapp_card"` (card) e `source = "whatsapp_profile"` (página do perfil). A página EscortMetrics já exibe esses dados separados. Porém:
- O **EscortDashboard** mostra apenas "Leads" total, sem breakdown por fonte
- O **AdminDashboard** mostra apenas `totalLeads` sem distinção
- O **AdminReports** idem — apenas total de leads

### Alterações

**1. EscortDashboard** (`src/pages/dashboard/escort/EscortDashboard.tsx`)
- Adicionar ao hook `useDashboardData` queries separadas para contar leads por source: `whatsapp_card`, `whatsapp_profile`, `telegram_profile`, `profile_view`
- No grid de stats, substituir o card genérico "Leads" por cards específicos:
  - WhatsApp (card + perfil combinados) com ícone verde
  - Total Leads (mantém)
- Resultado: profissional vê de relance quantos contatos WhatsApp recebeu

**2. Admin RPC `get_admin_dashboard_stats`** (migração SQL)
- Adicionar ao JSON retornado:
  - `total_whatsapp_clicks`: count de leads com source LIKE 'whatsapp%'
  - `total_telegram_clicks`: count de leads com source = 'telegram_profile'
  - `total_profile_views`: count de leads com source = 'profile_view'
- Sem criar novas tabelas — usa dados já existentes

**3. AdminDashboard** (`src/pages/dashboard/admin/AdminDashboard.tsx`)
- Exibir novo KPI "WhatsApp Clicks" ao lado de "Total Leads" no painel de métricas

**4. AdminReports** (`src/pages/dashboard/admin/AdminReports.tsx`)
- Na aba Overview, adicionar breakdown de leads por fonte (whatsapp_card, whatsapp_profile, telegram, profile_view)
- Adicionar query direta ou usar dados do stats para mostrar distribuição

### Arquivos modificados
- `src/pages/dashboard/escort/EscortDashboard.tsx` — queries + cards WhatsApp
- `src/pages/dashboard/admin/AdminDashboard.tsx` — KPI WhatsApp
- `src/pages/dashboard/admin/AdminReports.tsx` — breakdown leads
- Nova migração SQL — atualiza RPC `get_admin_dashboard_stats`

### Sem impacto
- Não altera tabelas nem RLS
- Não modifica fluxo de tracking existente
- Apenas leitura de dados já coletados

