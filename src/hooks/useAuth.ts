import {
  createContext, createElement, useCallback, useContext,
  useEffect, useMemo, useRef, useState, type ReactNode
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  /** True until BOTH auth state AND role fetch are settled. Gate all UI on this. */
  loading: boolean;
  userRole: string | null;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchUserRole(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .limit(1);
    if (error) {
      console.warn('[useAuth] role fetch error:', error.message);
      return null;
    }
    return data && data.length > 0 ? String(data[0].role) : null;
  } catch (e) {
    console.warn('[useAuth] role fetch threw:', e);
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);   // stays true until role resolved
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const settled = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Defer DB call to avoid Supabase internal deadlock
          setTimeout(async () => {
            const role = await fetchUserRole(newSession.user.id);
            setUserRole(role);
            // loading drops only after role is known
            if (!settled.current) { settled.current = true; setLoading(false); }
          }, 0);
        } else {
          setUserRole(null);
          if (!settled.current) { settled.current = true; setLoading(false); }
        }
      }
    );

    // Trigger initial session check — errors just unblock the spinner
    supabase.auth.getSession().catch(() => {
      if (!settled.current) { settled.current = true; setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    setSession(null);
    setUser(null);
    setUserRole(null);
    sessionStorage.removeItem('selected_portal');
    sessionStorage.removeItem('selected_rank');
    sessionStorage.removeItem('selected_management_role');
    sessionStorage.setItem('explicit_auth_visit', 'true');

    try { await supabase.auth.signOut({ scope: 'global' }); } catch { /* ignore */ }

    window.location.replace('/auth');
  }, []);

  const value = useMemo(() => ({
    user, session, loading, userRole, signOut,
    isAuthenticated: !!user,
  }), [user, session, loading, userRole, signOut]);

  return createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
