import { useEffect, useState } from 'react';
import { fetchDashboardStats } from '../services/popService';
import { LoadingState } from '../components/feedback/LoadingState';

const cards = [
  { key: 'totalPops', label: 'POPs cadastrados' },
  { key: 'totalPublicado', label: 'POPs publicados' },
  { key: 'totalRascunho', label: 'POPs em rascunho' },
  { key: 'totalUsuarios', label: 'Usuarios ativos' },
];

export function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats().then(setStats).catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (!stats) {
    return <LoadingState message="Carregando indicadores..." />;
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">Painel administrativo</span>
          <h1>Visao geral operacional</h1>
        </div>
      </div>

      <section className="stats-grid">
        {cards.map((card) => (
          <article key={card.key} className="stat-card">
            <span>{card.label}</span>
            <strong>{stats[card.key]}</strong>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Fluxo recomendado</h2>
        </div>
        <div className="timeline-grid">
          <div className="timeline-step">
            <strong>1. Cadastre o POP</strong>
            <p>Estruture o conteudo com foco em risco, evidencia e resposta operacional.</p>
          </div>
          <div className="timeline-step">
            <strong>2. Publique com seguranca</strong>
            <p>Revise criticidade, imagens e palavras-chave antes de liberar para consulta.</p>
          </div>
          <div className="timeline-step">
            <strong>3. Monitore o uso</strong>
            <p>Mantenha usuarios ativos, categorias organizadas e POPs sempre atualizados.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
