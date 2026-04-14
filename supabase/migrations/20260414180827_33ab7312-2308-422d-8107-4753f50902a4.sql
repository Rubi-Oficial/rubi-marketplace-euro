-- Performance indexes for frequently queried patterns

-- profile_images: composite index for the common (profile_id + moderation_status) filter
CREATE INDEX IF NOT EXISTS idx_profile_images_profile_moderation 
ON public.profile_images (profile_id, moderation_status, sort_order);

-- profile_videos: index on profile_id (missing, only has PK)
CREATE INDEX IF NOT EXISTS idx_profile_videos_profile_id 
ON public.profile_videos (profile_id);

-- profile_services: index on service_id for service-based filtering
CREATE INDEX IF NOT EXISTS idx_profile_services_service_id 
ON public.profile_services (service_id);

-- subscriptions: composite index for active subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
ON public.subscriptions (user_id, status);

-- leads: index for date-based analytics queries
CREATE INDEX IF NOT EXISTS idx_leads_created_at 
ON public.leads (created_at DESC);

-- profiles: composite index for the eligible_profiles view (status + subscription join pattern)
CREATE INDEX IF NOT EXISTS idx_profiles_status_user 
ON public.profiles (status, user_id);

-- profiles: city_slug index for location-based filtering
CREATE INDEX IF NOT EXISTS idx_profiles_city_slug 
ON public.profiles (city_slug);

-- site_visits: composite index for analytics aggregation
CREATE INDEX IF NOT EXISTS idx_site_visits_created_bot 
ON public.site_visits (created_at DESC, is_bot);