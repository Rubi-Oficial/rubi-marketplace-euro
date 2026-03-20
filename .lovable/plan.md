

## Plan: Enhanced Admin Profile Detail Page

### Current State
The page at `/admin/perfis/:id` (AdminProfileDetail.tsx) already exists with basic profile viewing, inline editing, image moderation, and status actions. However it lacks: videos support, upload capability, drag-drop reorder, user email display, admin action history, featured/flags toggles, and confirmation dialogs for destructive actions.

### Changes

#### 1. Enhance AdminProfileDetail.tsx (major rewrite)
Split into organized sections with tabs for better UX:

**Section: Header** - Keep current back button, name, status badge, edit/save buttons. Add featured toggle (star icon).

**Section: Media (Tabs - Photos / Videos)**
- Load `profile_videos` alongside `profile_images`
- Show videos with thumbnail, play overlay, duration, moderation badge
- Add video moderation buttons (approve/reject) and delete
- Add image/video upload buttons (reuse compression logic from EscortPhotos)
- Add drag-drop reorder using existing `@dnd-kit` + `SortableMediaGrid` component
- Confirmation dialog before deleting any media

**Section: Details (view/edit)**
- Add `is_featured` toggle (Switch component)
- Add `featured_until` date field
- Show `updated_at` timestamp
- Show user email (fetch from `users` table via `user_id`)

**Section: Contact & Services**
- Keep current WhatsApp/Telegram fields
- Show user email from `users` table

**Section: Bio** - Keep current implementation

**Section: Admin Actions Log**
- Fetch from `admin_actions` table where `target_profile_id = id`
- Show action type, admin name, notes, timestamp in a simple list

**Section: Status Actions**
- Keep current approve/reject/pause/reactivate buttons
- Add confirmation dialog for reject action

#### 2. Files to Create/Modify
- **Modify**: `src/pages/dashboard/admin/AdminProfileDetail.tsx` - Complete rewrite with all sections
- No new database tables needed - all data already exists
- No migrations needed

#### 3. Technical Details
- Reuse `SortableMediaGrid` + `SortableMediaItem` for drag-drop reorder of images
- Use `supabase.storage.from("profile-images")` for uploads (same pattern as EscortPhotos)
- Use `imageCompression` from `src/lib/imageCompression.ts` for photo uploads
- Use `AlertDialog` for delete confirmations
- Use `Switch` component for boolean toggles (is_featured)
- Fetch user email: `supabase.from("users").select("email, full_name").eq("id", profile.user_id).single()`
- Fetch admin actions: `supabase.from("admin_actions").select("*").eq("target_profile_id", id).order("created_at", { ascending: false })`
- Video upload limit: 1 video, 100MB, 20s max (per existing constraints)
- Image upload limit: 10 images, 2MB each (per existing constraints)

