import { Link } from 'react-router-dom';
import { createPopPlaceholder } from '../lib/placeholders';
import { CriticalityBadge, StatusBadge } from './StatusBadge';

export function POPCard({ pop, mode = 'consulta' }) {
  const cover =
    pop.pop_imagens?.find((item) => item.is_capa)?.signed_url ||
    pop.pop_imagens?.find((item) => item.is_capa)?.public_url ||
    pop.pop_imagens?.[0]?.signed_url ||
    pop.pop_imagens?.[0]?.public_url ||
    pop.imagem_capa_url ||
    createPopPlaceholder(pop.titulo, pop.criticidade);

  return (
    <article className="pop-card">
      <img src={cover} alt={pop.titulo} className="pop-card-image" />
      <div className="pop-card-body">
        <div className="pop-card-header">
          <CriticalityBadge value={pop.criticidade} />
          {mode === 'admin' ? <StatusBadge value={pop.status} /> : null}
        </div>
        <strong>{pop.titulo}</strong>
        <span className="muted-text">
          {pop.categoria}
          {pop.subcategoria ? ` • ${pop.subcategoria}` : ''}
        </span>
        <p>{pop.o_que_e}</p>
        <Link className="button button-primary button-full" to={mode === 'admin' ? `/admin/pops/${pop.id}` : `/app/pop/${pop.id}`}>
          {mode === 'admin' ? 'Editar POP' : 'Abrir procedimento'}
        </Link>
      </div>
    </article>
  );
}
