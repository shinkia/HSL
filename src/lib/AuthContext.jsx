import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/db';
import { auth } from '@/lib/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState({}); // legacy; unused on Supabase

  const loadProfile = useCallback(async () => {
    try {
      const me = await User.me();
      setUser(me);
      setIsAuthenticated(true);
      setAuthError(null);
      // fire-and-forget last_seen
      supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', me.id).then(() => {});
    } catch (e) {
      setUser(null);
      setIsAuthenticated(false);
      if (e?.status === 401) {
        // anonymous — not an error
        setAuthError(null);
      } else {
        setAuthError({ type: 'unknown', message: e?.message ?? String(e) });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    // Initial check — in dev mode, auto-login if credentials are set in .env.local
    supabase.auth.getSession().then(async ({ data }) => {
      if (data?.session) {
        loadProfile();
      } else if (import.meta.env.DEV) {
        // Dev auto-login via edge function (bypasses captcha)
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const res = await fetch(`${supabaseUrl}/functions/v1/dev-signin`, {
            headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
          });
          const { token, email, error: fnError } = await res.json();
          if (token) {
            const { error: otpError } = await supabase.auth.verifyOtp({
              email,
              token,
              type: 'magiclink',
            });
            if (otpError) {
              console.warn('[dev-login] OTP verify failed:', otpError.message);
              setIsLoadingAuth(false);
              setAuthChecked(true);
            }
            // on success, auth state change listener below calls loadProfile()
          } else {
            console.warn('[dev-login] edge function error:', fnError);
            setIsLoadingAuth(false);
            setAuthChecked(true);
          }
        } catch (e) {
          console.warn('[dev-login] failed:', e.message);
          setIsLoadingAuth(false);
          setAuthChecked(true);
        }
      } else {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    });

    // Listen for sign-in/out
    const { data: sub } = auth.onChange((event, session) => {
      if (session?.user) loadProfile();
      else { setUser(null); setIsAuthenticated(false); }
    });
    return () => { sub?.subscription?.unsubscribe?.(); };
  }, [loadProfile]);

  const logout = async (shouldRedirect = true) => {
    await auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) window.location.assign('/');
  };

  const navigateToLogin = () => {
    const next = `/login?return=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    window.location.assign(next);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth: loadProfile,
      checkAppState: loadProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
