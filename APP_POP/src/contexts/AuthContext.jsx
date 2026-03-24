import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearSupabaseAuthStorage, supabase } from '../lib/supabaseClient';
import { getLoggedUserProfile, signInWithPassword, signOut } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      setLoading(true);

      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        setAuthError(error.message);
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession?.user) {
        setProfile(null);
        setAuthError('');
        setLoading(false);
      }
    });

    bootstrap();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user?.id) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const nextProfile = await getLoggedUserProfile(user.id);
        if (!active) return;

        if (!nextProfile) {
          setAuthError('Seu usuario autenticado nao possui perfil cadastrado no sistema.');
          setProfile(null);
          return;
        }

        if (nextProfile.ativo === false) {
          setAuthError('Seu acesso esta inativo. Procure o administrador do sistema.');
          setProfile(null);
          await signOut();
          return;
        }

        setAuthError('');
        setProfile(nextProfile);
      } catch (error) {
        if (!active) return;
        setAuthError(error.message);
        setProfile(null);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [user?.id]);

  async function login(email, password) {
    setAuthError('');
    setLoading(true);

    try {
      await signInWithPassword(email, password);
    } catch (error) {
      setAuthError(error.message);
      setLoading(false);
      throw error;
    }
  }

  async function logout() {
    await signOut();
    clearSupabaseAuthStorage();
    setAuthError('');
    setProfile(null);
    setUser(null);
    setSession(null);
    setLoading(false);
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      loading,
      authError,
      isAdmin: profile?.perfil === 'ADMIN_POP',
      isConsulta: profile?.perfil === 'CONSULTA_POP',
      login,
      logout,
    }),
    [authError, loading, profile, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }

  return context;
}
