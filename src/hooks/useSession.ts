import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface SessionState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

/**
 * Supabase auth session subscription. If Supabase env vars are not configured,
 * the hook resolves to a signed-out cloud state while the local app keeps
 * working normally.
 */
export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setSession(null);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}
