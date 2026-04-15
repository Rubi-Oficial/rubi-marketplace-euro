---
name: Catalog Hook Consolidation
description: CityPage and CategoryPage share useCatalogPage hook for profiles/services/filters state
type: feature
---
The `useCatalogPage` hook (src/hooks/useCatalogPage.ts) consolidates duplicated catalog logic from CityPage and CategoryPage:
- Manages profiles, loading, services, and filter state (service, country, city)
- Accepts `fixedFilters` for page-specific constraints (e.g. city_slug or gender)
- Handles country→city cascading and client-side country filtering
- Exports all filter handlers (apply, remove, clear) and derived names

SearchPage continues to use `useProfileFilters` which has additional features (search, debounce, infinite scroll, prefetch).
ProfileCard no longer re-exports API functions — import directly from `@/lib/profileApi`.
