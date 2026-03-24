export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Procedimentos Operacionais';

export const POP_STATUS = ['RASCUNHO', 'PUBLICADO', 'INATIVO'];
export const POP_CRITICALITY = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];
export const USER_PROFILES = ['ADMIN_POP', 'CONSULTA_POP'];

export const CRITICALITY_META = {
  BAIXA: { label: 'Baixa', className: 'badge-low' },
  MEDIA: { label: 'Média', className: 'badge-medium' },
  ALTA: { label: 'Alta', className: 'badge-high' },
  CRITICA: { label: 'Crítica', className: 'badge-critical' },
};

export const STATUS_META = {
  RASCUNHO: { label: 'Rascunho', className: 'status-draft' },
  PUBLICADO: { label: 'Publicado', className: 'status-published' },
  INATIVO: { label: 'Inativo', className: 'status-inactive' },
};
