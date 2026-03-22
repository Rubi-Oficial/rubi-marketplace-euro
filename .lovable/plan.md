

## Plan: WhatsApp Click Counters in Dashboards

### Overview
Add WhatsApp/Telegram click breakdown metrics to the professional and admin dashboards using data already tracked in the `leads` table.

### Changes

**1. Migration SQL — Update `get_admin_dashboard_stats` RPC**
Add three new fields to the returned JSON:
- `total_whatsapp_clicks`: count of leads with source LIKE 'whatsapp%'
- `total_telegram_clicks`: count of leads with source = 'telegram_profile'  
- `total_profile_views`: count of leads with source = 'profile_view'

**2. EscortDashboard** (`src/pages/dashboard/escort/EscortDashboard.tsx`)
- Add `whatsappClicks` and `telegramClicks` fields to `DashboardData` interface
- Add two filtered count queries in the data hook (when profile exists):
  - `leads` where `source` starts with `whatsapp` 
  - `leads` where `source` = `telegram_profile`
- Add a WhatsApp KPI card (green icon) and Telegram KPI card in the stats grid, expanding from 4 to 5 columns on large screens

**3. AdminDashboard** (`src/pages/dashboard/admin/AdminDashboard.tsx`)
- Add `whatsappClicks` to `AdminStats` interface
- Read `total_whatsapp_clicks` from the RPC response
- Add a new KPI card "WhatsApp Clicks" with a green messaging icon in the existing KPI grid

**4. AdminReports** (`src/pages/dashboard/admin/AdminReports.tsx`)
- Add WhatsApp/Telegram/Profile View lead counts to the data fetch (3 extra count queries)
- Add a "Leads by Source" breakdown card in the Overview tab with a horizontal bar chart showing WhatsApp, Telegram, and Profile View counts

### Technical Details
- No new tables or RLS changes needed
- All data comes from existing `leads` table with `source` column filtering
- Migration only updates the RPC function
- Uses `ilike` pattern for WhatsApp sources (`whatsapp_card` + `whatsapp_profile`)

