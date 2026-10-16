import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, post, setApiToken, setUnauthorizedHandler, type ServerUser } from './api';

const KEY = 'ilumine.sessao.v1';

export type Me = ServerUser & { equipe_nome?: string | null };

type Auth = {
  user: Me | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ token: string; user: Me } | null>(null);
  const [loading, setLoading] = useState(true);

  const clear = useCallback(async () => {
    setApiToken(null);
    setSession(null);
    try {
      await SecureStore.deleteItemAsync(KEY);
    } catch {}
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(KEY);
        if (raw && alive) {
          const s = JSON.parse(raw) as { token: string; user: Me };
          setApiToken(s.token);
          setSession(s);
        }
      } catch {
        // Sessão ilegível: o usuário entra de novo.
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Token vencido ou revogado: volta para o login (os dados locais continuam no aparelho).
  useEffect(() => {
    setUnauthorizedHandler(() => void clear());
    return () => setUnauthorizedHandler(null);
  }, [clear]);

  const signIn = useCallback(async (email: string, senha: string) => {
    const r = await post<{ token: string; usuario: ServerUser }>('/auth/login', { email: email.trim().toLowerCase(), senha });
    setApiToken(r.token);
    let user: Me = r.usuario;
    try {
      const me = await api<{ equipe_nome: string | null }>('/me');
      user = { ...user, equipe_nome: me.equipe_nome };
    } catch {}
    const s = { token: r.token, user };
    setSession(s);
    try {
      await SecureStore.setItemAsync(KEY, JSON.stringify(s));
    } catch {}
  }, []);

  const value = useMemo<Auth>(
    () => ({ user: session?.user ?? null, token: session?.token ?? null, loading, signIn, signOut: clear }),
    [session, loading, signIn, clear],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return c;
}
