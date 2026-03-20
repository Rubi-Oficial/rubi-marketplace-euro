# AURA — Marketplace de Acompanhantes

Plataforma multilíngue (PT/EN/ES/FR/DE) para marketplace de serviços de acompanhamento, com painel administrativo, dashboards para profissionais e clientes, e sistema de afiliados.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Lovable Cloud (Supabase — Postgres, Auth, Storage, Edge Functions)
- **Pagamentos:** Stripe (checkout + webhooks)
- **UI:** shadcn/ui (Radix primitives) + Framer Motion
- **Routing:** React Router v6 com code splitting (React.lazy)

## Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis (UI, shared, public, profile, media)
├── contexts/         # AuthContext (sessão, role, redirect)
├── hooks/            # Custom hooks (geolocation, referral, locations)
├── i18n/             # Sistema de tradução (5 idiomas)
├── integrations/     # Clients Supabase + Lovable
├── layouts/          # PublicLayout, DashboardLayout
├── lib/              # Utilitários (image compression, status colors, oauth)
├── pages/
│   ├── auth/         # Login, Registro
│   ├── public/       # Landing, Busca, Perfil, Cidade, Planos, etc.
│   └── dashboard/
│       ├── admin/    # Painel admin (usuários, pagamentos, relatórios)
│       ├── client/   # Painel cliente (afiliados, configurações)
│       └── escort/   # Painel profissional (perfil, fotos, métricas, plano)
supabase/
├── functions/        # Edge Functions (Stripe checkout, webhook)
└── migrations/       # Migrações SQL
```

## Funcionalidades Principais

- **Autenticação:** Email/senha + Google OAuth com sync de role e referral
- **Perfis:** CRUD completo com moderação de fotos/vídeos, categorias, serviços
- **Busca:** Filtros por cidade, categoria, serviço + geolocalização automática
- **Planos:** Assinatura via Stripe com billing mensal/trimestral
- **Afiliados:** Sistema de referral com tracking de clicks e conversões
- **Admin:** Dashboard com métricas, sanity checks, gestão de perfis e pagamentos
- **i18n:** Tradução completa (PT, EN, ES, FR, DE) com persistência via localStorage
- **Segurança:** RLS em todas as tabelas, roles via DB function (SECURITY DEFINER)

## Desenvolvimento

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # Build de produção
npm test           # Testes unitários (Vitest)
```

## Variáveis de Ambiente

Gerenciadas automaticamente pelo Lovable Cloud. Não edite `.env` manualmente.

## Licença

Proprietário — todos os direitos reservados.
