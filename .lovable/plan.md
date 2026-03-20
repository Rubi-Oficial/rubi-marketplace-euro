

## Plan: Remove Duplicated Search Bar + Ensure 6 Real Cards

### Problem
The LandingPage has a search bar (lines 124-133) that duplicates the Navbar's search bar, creating visual redundancy. The user wants only the Filters + Location buttons visible below the navbar.

### Changes

**1. Edit `src/pages/public/LandingPage.tsx`**
- Remove the search bar `<form>` block (lines 124-133)
- Keep only: Filters button + Location button + suggested city chips + ActiveFilterChips
- Ensure the grid fetches and displays up to 6 cards from real DB data (already fetches from `eligible_profiles` — just confirm `slice(0, 20)` works; if DB has profiles they'll show)
- Add 6 placeholder/skeleton cards as fallback when no real profiles exist, so layout can be validated visually even with empty DB

**2. No other file changes needed**
- Navbar search bar stays as-is (it's the single source of search)
- ProfileCard, FilterModal, LocationModal, ActiveFilterChips remain unchanged

### Technical Details
- The `fetchEligibleProfiles` function already queries real profiles from the `eligible_profiles` view
- The 3 test profiles (Sofia Laurent, Isabella Reyes, Nina Dubois) should appear as cards
- If fewer than 6 real profiles exist, show placeholder cards with sample data to validate the grid layout

