# Black Hawk SOC-OS — Deployment & Login Fixes

**Date:** July 2026  
**Status:** Critical Issues Blocking Production  
**Affected:** blackhawk.com deployment

---

## ISSUE 1: Scroll Not Working on Content Areas

### Root Cause
The main content area in `WorkspaceShell.tsx` has `overflow-y-auto` correctly set, but there may be two issues:
1. **CORS/origin mismatch** — if `blackhawk.com` doesn't match Supabase AUTH_REDIRECT_URL, redirects fail
2. **CSS parsing issue** — if the page height is constrained, scroll won't appear even with overflow-y-auto

### Symptoms
- Pages load but cannot scroll down
- Bottom navigation (on mobile) and footer are unreachable
- Content is cut off

### Quick Fix
Add explicit min-height to the main content wrapper:

**File:** `src/components/shell/WorkspaceShell.tsx`

```tsx
// CURRENT (line 12-14):
<main className="flex-1 overflow-y-auto px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
  <ErrorBoundary>
    <div className="mx-auto w-full max-w-[1440px]">{children}</div>

// CHANGE TO:
<main className="flex-1 overflow-y-auto overflow-x-hidden min-h-full px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
  <ErrorBoundary>
    <div className="mx-auto w-full max-w-[1440px] min-h-[200vh]">{children}</div>
```

### Why This Works
- `min-h-full` ensures main takes full height of its flex container
- `min-h-[200vh]` ensures the content div is tall enough that scroll becomes necessary
- `overflow-x-hidden` prevents horizontal scroll on mobile

---

## ISSUE 2: Login Failing on blackhawk.com

### Root Cause
Supabase requires **three separate redirect URL configurations** to work properly:

1. **Project URL** (in Supabase Dashboard → Settings → API) — e.g., `https://your-project.supabase.co`
2. **Authorized Redirect URLs** (in Supabase Dashboard → Settings → API) — e.g., `https://blackhawk.com`
3. **Email redirect domain** (in Supabase Dashboard → Settings → Auth Providers → Email)

If `blackhawk.com` is NOT added to the authorized redirect URLs, email confirmation links and OAuth flows will redirect to the wrong URL.

### Symptoms
- Login button seems to work but doesn't proceed
- Confirmation email links don't work (404 or redirect to wrong domain)
- "Session could not be established" errors
- Browser console shows CORS errors or invalid redirect warnings

### Step 1: Add blackhawk.com as Authorized Redirect URL

1. Open **Supabase Dashboard** → Your Project
2. Go to **Settings → API**
3. Scroll down to **URL Configuration → Authorized Redirect URLs**
4. Click **Add URL**
5. Enter: `https://blackhawk.com`
6. Also add: `https://blackhawk.com/auth`
7. Also add: `https://www.blackhawk.com` (if using www)
8. Click **Save**

### Step 2: Verify Auth Domain Configuration

1. Go to **Settings → Auth Providers → Email**
2. Under **Custom SMTP**, confirm the **Email redirect domain** is either:
   - `https://blackhawk.com` (your app domain), OR
   - A custom domain configured in Supabase (if using custom emails)
3. Click **Save**

### Step 3: Update .env.local on Your Host

On the machine/server running your Vercel deployment (or wherever blackhawk.com is hosted), ensure `.env.local` has:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...your-anon-key...
```

**Get these from:**
1. Supabase Dashboard → Settings → API
2. Copy **Project URL** and **anon key**

### Step 4: Clear Browser Storage & Cache

The old session tokens might be cached. Clear them:

```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Step 5: Test Login

1. Go to `https://blackhawk.com/auth`
2. Try login with valid credentials (or sign up if no users exist yet)
3. Check the **browser console** (F12 → Console tab) for errors
4. Check the **Network tab** to see if POST `/auth/v1/token` succeeds

---

## ISSUE 3: No Users Exist in Database

### Root Cause
You likely migrated from a test Supabase project, and the production project has no users.

### Symptoms
- Login page shows but every email/password combination fails
- No error message (backend just returns "Invalid credentials")

### Fix: Create a Test User via Supabase Console

1. Open **Supabase Dashboard → Authentication → Users**
2. Click **Add user**
3. Enter:
   - **Email:** `admin@blackhawk.com`
   - **Password:** `TempPassword123!` (change this after first login)
4. Click **Create user**

Now try logging in with `admin@blackhawk.com / TempPassword123!`

### Fix: Seed Real Users (After Confirming Login Works)

Once one user can login, create the rest via the **User Management** page in the app itself:

1. Login as the test admin
2. Go to **Settings → User Management** (or the admin user module)
3. Create additional users with proper roles

---

## ISSUE 4: Database Users Table Exists But Is Empty

### Symptom
Login succeeds, but the user hits the "Pending Activation" screen because there's no record in the `profiles` table.

### Root Cause
Supabase Auth (`auth.users`) is separate from your app's `public.profiles` table. They must be synced.

### Fix: Create a Supabase Trigger

Run this SQL in **Supabase SQL Editor** (Settings → SQL Editor → New Query):

```sql
-- Auto-create profile when auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (new.id, new.email, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

Now when you create a user in Supabase Auth, a profile is automatically created.

---

## ISSUE 5: CORS/SSL Certificate Issues

### Symptom
- Browser console shows CORS errors
- `Mixed Content` warnings (https://blackhawk.com trying to call http://... )

### Root Cause
blackhawk.com is HTTPS, but some API calls are going to HTTP URLs.

### Fix: Verify All Supabase URLs Use HTTPS

In `src/integrations/supabase/client.ts`, the `VITE_SUPABASE_URL` **must** be `https://...`, not `http://...`

```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// ✅ CORRECT: https://project.supabase.co
// ❌ WRONG:  http://project.supabase.co
```

Also check that your host (blackhawk.com) is served over HTTPS. If you're using Vercel, enable SSL in the Vercel dashboard.

---

## ISSUE 6: Redirect Loop After Login

### Symptom
- Login succeeds, page redirects to `/` (landing page), then back to `/auth`
- Infinite redirect loop

### Root Cause
The `ProtectedRoute` guard in `App.tsx` is bouncing authenticated users back to landing.

### Fix: Check Authentication Context

The issue is in `src/hooks/useAuth.ts`. Ensure it correctly reads the session:

```typescript
// CORRECT pattern:
useEffect(() => {
  supabase.auth.onAuthStateChange(async (event, session) => {
    setIsAuthenticated(!!session);
    if (session) {
      // Fetch user role from DB
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      setUserRole(userRole?.role);
    }
    setLoading(false);
  });
}, []);

// Then in ProtectedRoute:
if (!isAuthenticated) {
  return <Navigate to="/auth" replace />;
}
return children;
```

---

## Deployment Checklist

Before going live, verify:

- [ ] `blackhawk.com` is added to **Supabase Auth → Redirect URLs**
- [ ] `.env.local` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] At least one test user exists in Supabase Auth
- [ ] That user has a record in `public.profiles` with a valid role in `public.user_roles`
- [ ] Test login at `https://blackhawk.com/auth`
- [ ] Test that pages scroll (especially on mobile)
- [ ] Test that after login, you land on the correct dashboard (not a redirect loop)
- [ ] Check browser console (F12) for any warnings or errors
- [ ] Test on both desktop and mobile

---

## Quick Diagnostic: Check Logs

To debug auth issues, check the Supabase **Auth** logs:

1. Go to **Supabase Dashboard → Authentication → Logs**
2. Look for entries related to your login attempt
3. Common errors:
   - `invalid_grant` — Wrong credentials
   - `invalid_redirect_uri` — Domain not authorized
   - `user_not_confirmed` — User hasn't confirmed email

---

## Support

If issues persist:

1. **Check browser console** (F12 → Console) for error details
2. **Check Supabase Logs** (Dashboard → Logs) for backend errors
3. **Check Network tab** (F12 → Network) to see API requests failing
4. **Verify DNS** — ensure `blackhawk.com` actually points to your Vercel deployment
5. **Test with curl** — verify the Supabase endpoint is reachable:
   ```bash
   curl -I https://your-project-id.supabase.co
   ```

---

**Prepared by Immersicloud Consulting**  
**Contact: immersitec@gmail.com**
