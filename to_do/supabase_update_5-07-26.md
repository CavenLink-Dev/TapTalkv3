Wire auth — call supabase.auth.signUp / signInWithPassword in your existing registration and login screens. Import like: import { supabase } from '../src/lib/supabase';
Add a session hook — create src/hooks/useSession.ts that listens to supabase.auth.onAuthStateChange and exposes the current user to the rest of the app
Design your Supabase tables — decide what syncs to the cloud (user profile, board layouts, symbol favourites) vs. what stays local (session logs, quick drafts)
Enable Row Level Security (RLS) — in the Supabase dashboard for every table you create, so users can only read/write their own data
Create Edge Functions — for anything that needs a service-role key (e.g. deleting a user account, sending emails, admin exports)
Add processLock — the spec mentioned it but @supabase/supabase-js v2 doesn't export it yet; when you upgrade to v3 you can drop it in. Currently not needed.