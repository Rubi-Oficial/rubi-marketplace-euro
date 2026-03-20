

## Plan: Unified Filter Bar on Landing + IP-based Country Detection

### Problem
1. **Redundancy**: Navbar Row 2 has country/service chips on homepage, while SearchPage has separate Filters/Location buttons — two different filter UIs.
2. **Landing page** lacks the clean Filters/Location buttons shown in the screenshot.
3. No automatic country suggestion based on user's IP.

### Solution

Unify the filter experience: remove Navbar Row 2 chips entirely, add the same search bar + Filters/Location buttons to the LandingPage, and auto-detect the user's country by IP.

```text
Navbar (single row only: Logo + Search + Auth)
   └── No Row 2 on any page

LandingPage
   ├── Search bar (full width, same style as SearchPage)
   ├── Filters + Location buttons (same as SearchPage)
   ├── Active filter chips
   ├── Profile grid
   └── CTA section

SearchPage (unchanged — already has this UI)
```

### Files to Change

**1. Edit `src/components/shared/Navbar.tsx`**
- Remove Row 2 entirely (lines 109-156) — no more country/service chips
- Remove related state (`activeCountry`, `activeCity`, `activeService`, `services`, `CustomEvent` dispatch)
- Keep only Row 1: Logo + Search + Auth + Mobile menu
- Update `PublicLayout.tsx` padding from `pt-[6.5rem]` to `pt-14` for homepage (no Row 2)

**2. Edit `src/layouts/PublicLayout.tsx`**
- Remove conditional padding — always `pt-14` since Row 2 is gone

**3. Edit `src/pages/public/LandingPage.tsx`**
- Add the same filter UI as SearchPage: search bar + Filters/Location buttons + ActiveFilterChips
- Use local state for filters (country, city, category, service, search query)
- Reuse `FilterModal`, `LocationModal`, `ActiveFilterChips` components
- Use `useLocations` hook + `fetchServices`
- On search submit, navigate to `/buscar?q=...` (deep search goes to SearchPage)
- Filters applied locally update the profile grid in-place
- Remove CustomEvent listener pattern (no longer needed)

**4. Create `src/hooks/useGeoCountry.ts`**
- New hook that calls a free IP geolocation API (`https://ipapi.co/json/`) once on mount
- Returns `{ detectedCountryCode: string | null, loading: boolean }`
- Caches result in `sessionStorage` to avoid repeated calls
- Maps ISO code to matching country slug from the `countries` list

**5. Edit `src/pages/public/LandingPage.tsx` (additional)**
- Use `useGeoCountry` to auto-set the country filter on first load if no filter is active
- Show suggested cities from the detected country as quick chips below the filter buttons (e.g., "Suggested: Lisbon, Porto, Faro")
- User can dismiss or change; it's a soft default, not forced

**6. Edit `src/components/public/LocationModal.tsx`**
- Add optional `suggestedCountry` prop to highlight the detected country at the top of the list with a subtle "Based on your location" label

### Key Decisions
- Free API (`ipapi.co`) — no API key needed, ~1000 req/day free tier, cached in sessionStorage
- No backend changes — purely frontend
- SearchPage remains unchanged — it's already correct
- LandingPage becomes self-contained for filtering (no more CustomEvent coupling)

