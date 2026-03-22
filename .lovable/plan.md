

## Plano: Ativar botão WhatsApp nos cards

### Problema
O botão WhatsApp já está implementado no `ProfileCard` e a view `eligible_profiles` já expõe `has_whatsapp`. Porém, a função `fetchEligibleProfiles` **não seleciona** `has_whatsapp` da view e sempre define `has_whatsapp: false` no retorno. O botão nunca aparece.

### Correção (2 linhas)

**Arquivo: `src/components/public/ProfileCard.tsx`**

1. **Linha 37** — Adicionar `has_whatsapp` ao `.select()`:
   ```
   .select("id, display_name, age, city, city_slug, category, gender, slug, pricing_from, is_featured, bio, has_whatsapp")
   ```

2. **Linha 94** — Usar o valor real em vez de `false`:
   ```
   has_whatsapp: p.has_whatsapp ?? false,
   ```

### Também corrigir em `ClientFavorites.tsx`
A query de favoritos também não seleciona `has_whatsapp`. Adicionar ao select e ao mapeamento para que o botão apareça também na página de favoritos.

### Resultado
O botão verde do WhatsApp aparecerá nos cards de perfis que têm número cadastrado. Ao clicar, usa a RPC `get_profile_contact` (já implementada) para obter o número de forma segura e abrir `wa.me/`.

