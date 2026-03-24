import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LoadingState } from '../components/feedback/LoadingState';
import { CriticalityBadge } from '../components/StatusBadge';
import { createPopPlaceholder } from '../lib/placeholders';
import { fetchPopById } from '../services/popService';

const detailBlocks = [
  { key: 'o_que_e', label: 'O que e' },
  { key: 'principais_riscos', label: 'Principais riscos' },
  { key: 'principais_evidencias', label: 'Principais evidencias' },
  { key: 'principais_causas', label: 'Principais causas' },
  { key: 'procedimento_agente', label: 'Procedimento do agente' },
  { key: 'observacoes', label: 'Observacoes complementares' },
];

export function PopDetailPage() {
  const { id } = useParams();
  const [pop, setPop] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPopById(id).then(setPop).catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (!pop) {
    return <LoadingState message="Abrindo POP..." />;
  }

  const cover =
    pop.pop_imagens?.find((item) => item.is_capa)?.signed_url ||
    pop.pop_imagens?.find((item) => item.is_capa)?.public_url ||
    pop.pop_imagens?.[0]?.signed_url ||
    pop.pop_imagens?.[0]?.public_url ||
    pop.imagem_capa_url ||
    createPopPlaceholder(pop.titulo, pop.criticidade);

  return (
    <div className="page-stack detail-page">
      <Link to="/app" className="button button-ghost back-button">
        Voltar para consulta
      </Link>

      <article className="detail-hero">
        <img src={cover} alt={pop.titulo} className="detail-cover" />
        <div className="detail-summary">
          <div className="detail-meta">
            <CriticalityBadge value={pop.criticidade} />
            <span className="meta-chip">{pop.categoria}</span>
            {pop.subcategoria ? <span className="meta-chip">{pop.subcategoria}</span> : null}
          </div>
          <h1>{pop.titulo}</h1>
          <p>{pop.palavras_chave}</p>
        </div>
      </article>

      <section className="detail-grid">
        {detailBlocks
          .filter((block) => pop[block.key])
          .map((block) => (
            <article key={block.key} className="panel detail-block">
              <h2>{block.label}</h2>
              <p>{pop[block.key]}</p>
            </article>
          ))}
      </section>
    </div>
  );
}
