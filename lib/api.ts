import type { ImageSourcePropType } from 'react-native';

/**
 * Endereço da API. Em desenvolvimento no celular, use o IP do computador na rede
 * (ex.: http://10.0.0.33:3333) em EXPO_PUBLIC_API_URL no arquivo .env da raiz.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3333').replace(/\/$/, '');

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setApiToken = (t: string | null) => {
  token = t;
};
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set('authorization', `Bearer ${token}`);
  const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body && !isForm && !headers.has('content-type')) headers.set('content-type', 'application/json');

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Sem conexão com o servidor', 0);
  }
  if (res.status === 401 && token) onUnauthorized?.();
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.erro ?? `Erro ${res.status}`, res.status);
  }
  return (await res.json().catch(() => ({}))) as T;
}

export const post = <T>(path: string, body: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(body) });

/** Fotos do servidor exigem o token; as locais (file://) passam direto. */
export function photoSource(uri: string): ImageSourcePropType {
  if (uri.startsWith(API_URL) && token) return { uri, headers: { Authorization: `Bearer ${token}` } };
  return { uri };
}

export async function uploadPhoto(osId: string, uri: string) {
  const form = new FormData();
  form.append('foto', { uri, name: 'foto.jpg', type: 'image/jpeg' } as unknown as Blob);
  await api(`/os/${osId}/fotos`, { method: 'POST', body: form });
}

// ---------- formatos do servidor ----------
export type ServerOs = {
  id: string;
  codigo: string;
  status: 'aguardando' | 'em_rota' | 'concluido';
  latitude: number;
  longitude: number;
  rua: string;
  bairro: string;
  equipe_id: string | null;
  equipe_nome: string | null;
  observacao: string | null;
  criado_em: string;
  defeito: string;
  fotos: string[];
};

export type ServerDefect = {
  chave: string;
  nome: string;
  prioridade: 'critica' | 'alta' | 'media';
  icone: string | null;
  perigoso: boolean;
};

export type ServerMaterial = { id: string; nome: string; unidade: string };
export type ServerUser = { id: string; nome: string; papel: 'campo' | 'gestor' | 'admin'; equipe_id: string | null };
