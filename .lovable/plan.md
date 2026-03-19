

## Plan: Admin Contact Messages + Code Review

### Summary
Create an admin page to manage contact messages (with read/unread status), add a navigation entry, register the route, and add a `is_read` column to `contact_messages`. Also review and fix minor issues in auth flows and ProfilePage typing.

---

### 1. Database Migration
Add `is_read` boolean column to `contact_messages` table (default `false`). Add an UPDATE policy so admins can mark messages as read.

```sql
ALTER TABLE public.contact_messages ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;

CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### 2. New Page: `AdminContactMessages.tsx`
- Fetch messages from `contact_messages` ordered by `created_at DESC`, limit 50
- Tab filter: Todas / Não lidas / Lidas
- Table with columns: Nome, Email, Mensagem (truncated), Data, Status
- Click row to expand message in a Dialog
- Button to toggle `is_read` status
- Loading spinner and empty state

### 3. Route & Navigation
- Add nav item "Mensagens" with `Mail` icon to `adminNav` in `DashboardLayout.tsx` pointing to `/admin/mensagens`
- Add route in `App.tsx`: `<Route path="/admin/mensagens" element={<AdminContactMessages />} />`

### 4. Fix ProfilePage `eligible_profiles` typing
- Remove `as any` cast on the `eligible_profiles` query in `ProfilePage.tsx` (the view is now in the generated types)

### 5. Fix `as any` casts on `getRoleDashboard` calls
- In `LoginPage.tsx` and `RegisterPage.tsx`, the `userRole as any` cast is unnecessary since `getRoleDashboard` accepts `AppRole | null`. Remove the casts.

---

### Technical Notes
- No new modules outside scope
- No changes to upload/storage/attachments
- Contact form (`ContactPage.tsx`) already has proper Zod validation, loading, success/error states -- no changes needed
- Auth flows (Google OAuth with role/referral preservation) are correctly implemented via `saveOAuthPreState` + `AuthRedirectHandler` -- no changes needed
- Referral flow in signup correctly passes `referral_code` in user metadata, and `handle_new_user` trigger resolves it -- no changes needed
- `eligible_profiles` view correctly enforces approved + active subscription -- consistent with frontend check

