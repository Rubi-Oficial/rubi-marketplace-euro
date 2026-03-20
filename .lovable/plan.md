

## Plan: Card Contrast + Clickable Service/Category Slugs Across Pages

### What changes

Inspired by the reference site (kinky.nl), two improvements:

**1. ProfileCard contrast improvements**
- Stronger gradient overlay at the bottom so text is always legible over any image
- Add a subtle dark scrim behind the name/city text area
- Category badge shown on the card (small, positioned top-right)
- Slightly bolder text styling for name

**2. Clickable service/category slug chips — distributed across all public pages**

Like the reference site's horizontal scrollable category bar ("Women", "Escort inbound", "Shemales", etc.), add a reusable `ServiceSlugBar` component that renders all active services as clickable pills. This bar appears on:
- **LandingPage** — above the profile grid, between filter buttons and cards
- **SearchPage** — between filter buttons and results
- **CityPage** — already has service chips, keep as-is
- **CategoryPage** — add service chips for cross-filtering
- **ProfilePage** — below the "Back to explore" link, showing the profile's category + city as clickable links (navigate to `/categoria/{slug}` and `/cidade/{city_slug}`)

### Files to change

**1. Create `src/components/public/ServiceSlugBar.tsx`**
- Reusable horizontal scrollable bar of service chips
- Props: `services`, `activeService`, `onServiceClick`
- Styled as rounded pills, scrollable on mobile, with active state highlight (primary color)

**2. Edit `src/components/public/ProfileCard.tsx`**
- Strengthen gradient: `from-black/80 via-black/30` instead of `from-background/90 via-background/10`
- Add text shadow to name: `drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]`
- Show category as small chip top-right (e.g., "Elite") with semi-transparent dark background
- Make city text white with slight text shadow for contrast

**3. Edit `src/pages/public/LandingPage.tsx`**
- Import and render `ServiceSlugBar` between filter buttons and profile grid
- Clicking a service chip sets `serviceFilter` state (already wired)

**4. Edit `src/pages/public/SearchPage.tsx`**
- Import and render `ServiceSlugBar` between filter buttons and results
- Clicking updates the `service` search param

**5. Edit `src/pages/public/CategoryPage.tsx`**
- Add `ServiceSlugBar` for cross-filtering within a category
- Fetch services on mount, filter profiles by selected service

**6. Edit `src/pages/public/ProfilePage.tsx`**
- Below "Back to explore", add clickable breadcrumb-style chips:
  - Category → links to `/categoria/{category-slug}`
  - City → links to `/cidade/{city_slug}`
  - Each service → links to `/buscar?service={slug}`

### Technical Details

**ServiceSlugBar component:**
```text
┌──────────────────────────────────────────────────────┐
│ [All] [Escort] [Massage] [Companion] [BDSM] [...]  │  ← horizontal scroll
└──────────────────────────────────────────────────────┘
```
- `overflow-x-auto scrollbar-hide` for mobile scroll
- Active pill: `bg-primary text-primary-foreground`
- Inactive pill: `bg-card border border-border/40 text-muted-foreground hover:border-primary/30`

**ProfileCard contrast:**
```text
┌─────────────────┐
│ ★Featured  Elite│  ← gold badge left, category right
│                 │
│   [image]       │
│                 │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← stronger dark gradient
│ Sofia Laurent 25│  ← white text + text shadow
│ 📍 Amsterdam   │
└─────────────────┘
```

