

# Analysis: Profile Display on Landing Page

## Status: Profiles ARE displaying correctly

The API query to `eligible_profiles` returns **4 profiles** with HTTP 200. The UI renders them with working image carousels.

## Minor Issues Found

### 1. Two test profiles missing from results
Sofia Laurent and Nina Dubois are not returned by the `eligible_profiles` view. This is likely a data issue (expired subscription, status not "approved", etc.) — not a code bug. To investigate further, we'd need to query the `profiles` and `subscriptions` tables directly to check their status.

### 2. React `forwardRef` warnings (cosmetic)
`ProfileGrid` and `MobileFilterBar` receive refs from parent components but aren't wrapped in `React.forwardRef()`. This causes console warnings but doesn't break functionality.

**Fix:** Wrap both components with `forwardRef` or remove the ref passing in `LandingPage`.

## Recommended Next Steps

1. **Investigate missing profiles** — Query the database to check why Sofia Laurent and Nina Dubois don't appear in `eligible_profiles` (check their `profiles.status` and `subscriptions.status`).
2. **Fix forwardRef warnings** — Quick cleanup in `ProfileGrid.tsx` and `MobileFilterBar.tsx`.

## Technical Details

- **Files to edit:** `src/components/public/ProfileGrid.tsx`, `src/components/public/MobileFilterBar.tsx`
- **Database check needed:** Query `profiles` table for the 2 missing profiles' status and subscription state

