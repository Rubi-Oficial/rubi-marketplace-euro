

## Findings

The database has **3 eligible profiles** (approved + active subscription): Sofia Laurent (Amsterdam), Isabella Reyes (Barcelona), Nina Dubois (Den Haag). Each has 3 approved images and 1 approved video. There's also "Diego teste" but it's in `draft` status so it doesn't appear publicly.

To reach 6 cards, I need to insert 3 more profiles. Since the `eligible_profiles` view requires `status = 'approved'` AND an active subscription, I'll attach new profiles to the two existing users who already have active subscriptions.

## Plan

**1. Insert 3 new profiles** (via insert tool)
Using the two existing user_ids that have active subscriptions:
- **Camille Moreau** — Paris, Elite, age 25, user_id `95712848...`
- **Elena Rossi** — Milan, Premium, age 26, user_id `6809d822...`  
- **Lucia Fernandez** — Madrid, Companion, age 24, user_id `95712848...`

All with `status: approved`, unique slugs, city_slugs matching existing cities, bio, whatsapp, languages.

**2. Insert profile_images for each** (reusing existing storage paths from other profiles as placeholder images — same bucket, valid URLs)
- 3 images per profile (9 records total), `moderation_status: approved`

**3. Insert profile_videos for each** (reusing existing video paths)
- 1 video per profile (3 records total), `moderation_status: approved`

**4. No code changes needed** — the LandingPage already fetches from `eligible_profiles` and displays up to 20 cards. With 6 eligible profiles, the grid will populate automatically.

### Result
6 profile cards with images visible on the landing page, each with a working profile detail page (`/perfil/{slug}`) showing gallery, bio, services, and contact info.

