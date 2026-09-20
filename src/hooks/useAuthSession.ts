// src/hooks/useAuthSession.ts
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role?: string;
}

export interface AuthState {
  user: AuthUser | null;
  /** Backward-compatible session wrapper matching NextAuth shape { user: AuthUser } */
  session: { user: AuthUser } | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isHydrated: boolean;
  /** UI presentation flag ONLY. Never used as a server security boundary. */
  isAdmin: boolean;
  isConfigured: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: Error | null }>;
}

function sanitizeUser(supabaseUser: User | null): AuthUser | null {
  if (!supabaseUser) return null;

  const email = supabaseUser.email || '';
  const metadata = supabaseUser.user_metadata || {};
  const appMetadata = supabaseUser.app_metadata || {};

  const name =
    metadata.name ||
    metadata.full_name ||
    (email ? email.split('@')[0] : 'Customer');

  const phone = supabaseUser.phone || metadata.phone || null;
  const role = appMetadata.role || metadata.role || 'CUSTOMER';

  return {
    id: supabaseUser.id,
    email,
    name,
    phone,
    role,
  };
}

export function useAuthSession(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isConfigured = useMemo(() => isSupabaseConfigured(), []);

  // HYDRATION: Mark when client is ready
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // EVENT-DRIVEN AUTH SYNCHRONIZATION via onAuthStateChange
  useEffect(() => {
    if (!isHydrated) return;

    // 1. Initial session load
    supabase.auth
      .getSession()
      .then((res: { data: { session: Session | null }; error: Error | null }) => {
        const session = res.data.session;
        const sessionError = res.error;

        if (sessionError) {
          console.warn('[useAuthSession] Initial session fetch warning:', sessionError.message);
          setError(sessionError);
          setStatus('unauthenticated');
          setUser(null);
          return;
        }

        if (session?.user) {
          setUser(sanitizeUser(session.user));
          setStatus('authenticated');
        } else {
          setUser(null);
          setStatus('unauthenticated');
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error('Failed to get session'));
        setStatus('unauthenticated');
      });

    // 2. Event-driven listener for auth lifecycle & cross-tab events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, newSession: Session | null) => {
      if (newSession?.user) {
        setUser(sanitizeUser(newSession.user));
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }

      // Clear any previous error on successful auth transition
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setError(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isHydrated]);

  // Sign out helper
  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setStatus('unauthenticated');
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('[useAuthSession] Sign out error:', err);
      setError(err instanceof Error ? err : new Error('Failed to sign out'));
    }
  }, []);

  // Google OAuth sign-in helper
  const handleSignInWithGoogle = useCallback(
    async (redirectTo = '/account') => {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;

        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: callbackUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (oauthError) {
          setError(oauthError);
          return { error: oauthError };
        }

        return { error: null };
      } catch (err) {
        const caughtError = err instanceof Error ? err : new Error('Google sign-in failed');
        setError(caughtError);
        return { error: caughtError };
      }
    },
    []
  );

  const isAdmin = user?.role === 'ADMIN';
  const session = user ? { user } : null;

  return {
    user,
    session,
    status: isHydrated ? status : 'loading',
    isHydrated,
    isAdmin,
    isConfigured,
    error,
    signOut: handleSignOut,
    signInWithGoogle: handleSignInWithGoogle,
  };
}

/**
 * Hook to check if user is authenticated (hydration-safe)
 */
export function useIsAuthenticated(): boolean {
  const { status, isHydrated } = useAuthSession();
  return isHydrated && status === 'authenticated';
}

/**
 * UI presentation hook for Admin badge (Never use for server authorization)
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = useAuthSession();
  return isAdmin;
}
