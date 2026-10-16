import type { Ionicons } from '@expo/vector-icons';

/** Chave do tipo de defeito. Os tipos oficiais vêm do servidor (definidos no painel). */
export type DefectId = string;

export type Priority = 'critica' | 'alta' | 'media';
export type Status = 'aguardando' | 'em_rota' | 'concluido';

export type Defect = {
  id: DefectId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  priority: Priority;
  danger?: boolean;
};

export type Conclusion = {
  materiais: { material_id: string; quantidade: number }[];
  observacao?: string;
};

export type Report = {
  /** UUID gerado no aparelho: o servidor usa o mesmo id, então reenviar não duplica. */
  id: string;
  code: string;
  defect: DefectId;
  latitude: number;
  longitude: number;
  street: string;
  district: string;
  /** URIs locais (file://) ou do servidor (…/fotos/:id). */
  photos: string[];
  status: Status;
  createdAt: number;
  /** A OS já existe no servidor. */
  synced: boolean;
  /** Fotos locais já enviadas. */
  photosSent: string[];
  equipeId?: string | null;
  equipeNome?: string | null;
  observacao?: string | null;
  /** Conclusão registrada no aparelho e ainda não enviada. */
  pendingConclusion?: Conclusion;
};

export type Material = { id: string; nome: string; unidade: string };

/** Padrão usado até o servidor responder pela primeira vez. */
const FALLBACK_DEFECTS: Defect[] = [
  { id: 'lampada_piscando', label: 'Lâmpada Piscando', icon: 'flash', priority: 'media' },
  { id: 'lampada_apagada', label: 'Lâmpada Apagada', icon: 'bulb-outline', priority: 'media' },
  { id: 'luminaria_quebrada', label: 'Luminária Quebrada', icon: 'image-outline', priority: 'media' },
  { id: 'braco_torto', label: 'Braço / Suporte Torto', icon: 'return-up-forward', priority: 'alta' },
  { id: 'poste_abalroado', label: 'Poste Abalroado', icon: 'warning-outline', priority: 'alta' },
  { id: 'fiacao_exposta', label: 'Fiação Exposta', icon: 'flash-off-outline', priority: 'critica', danger: true },
];

/** Lista viva: `applyDefects` troca o conteúdo quando o catálogo do servidor chega. */
export const DEFECTS: Defect[] = [...FALLBACK_DEFECTS];

export function applyDefects(next: Defect[]) {
  DEFECTS.splice(0, DEFECTS.length, ...(next.length ? next : FALLBACK_DEFECTS));
}

export const defectById = (id: DefectId): Defect =>
  DEFECTS.find((d) => d.id === id) ?? { id, label: id.replace(/_/g, ' '), icon: 'construct-outline', priority: 'media' };

export const PRIORITY_LABEL: Record<Priority, string> = {
  critica: 'Risco Iminente',
  alta: 'Alta Prioridade',
  media: 'Média',
};

export const PRIORITY_RANK: Record<Priority, number> = { critica: 0, alta: 1, media: 2 };

export const STATUS_LABEL: Record<Status, string> = {
  aguardando: 'Aguardando Equipe',
  em_rota: 'Em Rota',
  concluido: 'Concluído',
};
