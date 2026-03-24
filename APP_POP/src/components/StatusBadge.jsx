import { CRITICALITY_META, STATUS_META } from '../lib/constants';

export function CriticalityBadge({ value }) {
  const meta = CRITICALITY_META[value] ?? CRITICALITY_META.MEDIA;
  return <span className={`badge ${meta.className}`}>{meta.label}</span>;
}

export function StatusBadge({ value }) {
  const meta = STATUS_META[value] ?? STATUS_META.RASCUNHO;
  return <span className={`status-pill ${meta.className}`}>{meta.label}</span>;
}
