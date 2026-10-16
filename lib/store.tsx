import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import Storage from 'expo-sqlite/kv-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { api, ApiError, API_URL, post, uploadPhoto, type ServerDefect, type ServerMaterial, type ServerOs } from './api';
import { useAuth } from './auth';
import { applyDefects, DEFECTS, type Conclusion, type Defect, type Material, type Report } from './types';

const KEY = 'ilumine.reports.v2';
const OLD_KEY = 'ilumine.reports.v1';
const CATALOG_KEY = 'ilumine.catalogo.v1';
const OWNER_KEY = 'ilumine.dono.v1';

type NewReport = Pick<Report, 'code' | 'defect' | 'photos' | 'latitude' | 'longitude' | 'street' | 'district'>;

export type SyncInfo = { syncing: boolean; pending: number; error: string | null; lastSync: number | null };

type Store = {
  reports: Report[];
  defects: Defect[];
  materials: Material[];
  sync: SyncInfo;
  addReport: (r: NewReport) => void;
  concludeReport: (id: string, c: Conclusion) => void;
  removeReport: (id: string) => void;
  syncNow: () => Promise<void>;
};

const Ctx = createContext<Store | null>(null);

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = Storage.getItemSync(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

function loadReports(): Report[] {
  const v2 = read<Report[] | null>(KEY, null);
  if (v2) return v2;
  // Dados da versão anterior (só no aparelho): ganham UUID e entram na fila de envio.
  const v1 = read<Partial<Report>[]>(OLD_KEY, []);
  return v1.map((r) => ({
    id: Crypto.randomUUID(),
    code: r.code ?? '',
    defect: r.defect ?? 'lampada_apagada',
    latitude: r.latitude ?? 0,
    longitude: r.longitude ?? 0,
    street: r.street ?? '',
    district: r.district ?? '',
    photos: r.photos ?? [],
    status: r.status ?? 'aguardando',
    createdAt: r.createdAt ?? Date.now(),
    synced: false,
    photosSent: [],
  }));
}

/** Camera output lives in the cache dir; copy it somewhere durable. */
export function persistPhoto(uri: string) {
  try {
    const dest = new File(Paths.document, `foto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`);
    new File(uri).copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

const isRemote = (uri: string) => uri.startsWith(API_URL);

export function ReportsProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [reports, setReports] = useState<Report[]>(loadReports);
  const [materials, setMaterials] = useState<Material[]>(() => read<{ materials: Material[] }>(CATALOG_KEY, { materials: [] }).materials);
  const [defects, setDefects] = useState<Defect[]>(() => {
    const saved = read<{ defects: Defect[] }>(CATALOG_KEY, { defects: [] }).defects;
    applyDefects(saved);
    return [...DEFECTS];
  });
  const [syncState, setSyncState] = useState<Omit<SyncInfo, 'pending'>>({ syncing: false, error: null, lastSync: null });

  const running = useRef(false);
  const latest = useRef(reports);
  useEffect(() => {
    latest.current = reports;
    try {
      Storage.setItemSync(KEY, JSON.stringify(reports));
    } catch {}
  }, [reports]);

  // Outro usuário no mesmo aparelho não herda os dados do anterior.
  useEffect(() => {
    if (!user) return;
    const owner = read<string | null>(OWNER_KEY, null);
    if (owner && owner !== user.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReports([]);
    }
    try {
      Storage.setItemSync(OWNER_KEY, JSON.stringify(user.id));
    } catch {}
  }, [user]);

  const patch = useCallback((id: string, p: Partial<Report>) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)));
  }, []);

  const syncNow = useCallback(async () => {
    if (!token || running.current) return;
    running.current = true;
    setSyncState((s) => ({ ...s, syncing: true }));
    let error: string | null = null;
    try {
      // 1) Envia o que está pendente, uma OS por vez.
      for (const r of [...latest.current]) {
        try {
          if (!r.synced) {
            await post('/os', {
              id: r.id,
              codigo: r.code,
              defeito: r.defect,
              latitude: r.latitude,
              longitude: r.longitude,
              rua: r.street,
              bairro: r.district,
              criado_em: new Date(r.createdAt).toISOString(),
            });
            patch(r.id, { synced: true });
          }
          const sent = [...r.photosSent];
          for (const uri of r.photos) {
            if (isRemote(uri) || sent.includes(uri)) continue;
            await uploadPhoto(r.id, uri);
            sent.push(uri);
            patch(r.id, { photosSent: [...sent] });
          }
          if (r.pendingConclusion) {
            try {
              await post(`/os/${r.id}/concluir`, r.pendingConclusion);
            } catch (e) {
              if (!(e instanceof ApiError && e.status === 409)) throw e;
            }
            patch(r.id, { pendingConclusion: undefined });
          }
        } catch (e) {
          // Sem rede: para tudo e tenta de novo depois. Erro de validação: segue para as outras OS.
          if (e instanceof ApiError && e.status === 0) throw e;
          error = e instanceof Error ? `${r.code}: ${e.message}` : 'Falha ao enviar';
        }
      }

      // 2) Traz o que o servidor sabe (status, equipe, OS da equipe).
      const remote = await api<ServerOs[]>('/os?limite=500');
      setReports((prev) => {
        const byId = new Map(prev.map((r) => [r.id, r]));
        for (const s of remote) {
          const local = byId.get(s.id);
          if (local) {
            byId.set(s.id, {
              ...local,
              synced: true,
              status: local.pendingConclusion ? local.status : s.status,
              equipeId: s.equipe_id,
              equipeNome: s.equipe_nome,
              observacao: s.observacao,
            });
          } else {
            byId.set(s.id, {
              id: s.id,
              code: s.codigo,
              defect: s.defeito,
              latitude: s.latitude,
              longitude: s.longitude,
              street: s.rua,
              district: s.bairro,
              photos: s.fotos.map((f) => `${API_URL}/fotos/${f}`),
              status: s.status,
              createdAt: new Date(s.criado_em).getTime(),
              synced: true,
              photosSent: [],
              equipeId: s.equipe_id,
              equipeNome: s.equipe_nome,
              observacao: s.observacao,
            });
          }
        }
        return [...byId.values()];
      });

      // 3) Catálogo definido no painel: tipos de defeito e materiais.
      const [td, mt] = await Promise.all([api<ServerDefect[]>('/tipos-defeito'), api<ServerMaterial[]>('/materiais')]);
      const nextDefects: Defect[] = td.map((d) => ({
        id: d.chave,
        label: d.nome,
        icon: (d.icone ?? 'construct-outline') as Defect['icon'],
        priority: d.prioridade,
        danger: d.perigoso,
      }));
      applyDefects(nextDefects);
      setDefects([...DEFECTS]);
      const nextMaterials = mt.map((m) => ({ id: m.id, nome: m.nome, unidade: m.unidade }));
      setMaterials(nextMaterials);
      try {
        Storage.setItemSync(CATALOG_KEY, JSON.stringify({ defects: nextDefects, materials: nextMaterials }));
      } catch {}

      setSyncState({ syncing: false, error, lastSync: Date.now() });
    } catch (e) {
      const offline = e instanceof ApiError && e.status === 0;
      setSyncState((s) => ({ ...s, syncing: false, error: offline ? 'Sem conexão' : e instanceof Error ? e.message : 'Falha ao sincronizar' }));
    } finally {
      running.current = false;
    }
  }, [token, patch]);

  // Sincroniza ao entrar, ao voltar para o app e a cada minuto enquanto houver algo na fila.
  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void syncNow();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && void syncNow());
    const timer = setInterval(() => void syncNow(), 60_000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, [token, syncNow]);

  const addReport = useCallback(
    (r: NewReport) => {
      const report: Report = { ...r, id: Crypto.randomUUID(), status: 'aguardando', createdAt: Date.now(), synced: false, photosSent: [] };
      setReports((prev) => [report, ...prev]);
      setTimeout(() => void syncNow(), 300);
    },
    [syncNow],
  );

  const concludeReport = useCallback(
    (id: string, c: Conclusion) => {
      patch(id, { status: 'concluido', pendingConclusion: c, observacao: c.observacao ?? null });
      setTimeout(() => void syncNow(), 300);
    },
    [patch, syncNow],
  );

  const removeReport = useCallback((id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const pending = useMemo(
    () =>
      reports.filter(
        (r) => !r.synced || r.pendingConclusion || r.photos.some((u) => !isRemote(u) && !r.photosSent.includes(u)),
      ).length,
    [reports],
  );

  const value = useMemo<Store>(
    () => ({ reports, defects, materials, sync: { ...syncState, pending }, addReport, concludeReport, removeReport, syncNow }),
    [reports, defects, materials, syncState, pending, addReport, concludeReport, removeReport, syncNow],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReports() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useReports must be used inside ReportsProvider');
  return ctx;
}
