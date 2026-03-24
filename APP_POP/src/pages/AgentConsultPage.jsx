import { useEffect, useRef, useState } from 'react';
import { EmptyState } from '../components/feedback/EmptyState';
import { LoadingState } from '../components/feedback/LoadingState';
import { POPCard } from '../components/POPCard';
import { fetchCategories } from '../services/categoryService';
import { fetchPops } from '../services/popService';

export function AgentConsultPage() {
  const [pops, setPops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', categoria: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  async function loadData(currentFilters) {
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      const [nextPops, nextCategories] = await Promise.all([
        fetchPops(currentFilters, false),
        fetchCategories(),
      ]);

      if (requestId !== requestIdRef.current) return;

      setPops(nextPops);
      setCategories(nextCategories.filter((item) => item.ativo));
      setError('');
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message);
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }

  useEffect(() => {
    const debounceMs = filters.search ? 300 : 0;
    const timerId = window.setTimeout(() => {
      loadData(filters);
    }, debounceMs);

    return () => window.clearTimeout(timerId);
  }, [filters]);

  function handleFilterChange(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="page-stack">
      <div className="page-header consult-header">
        <div>
          <span className="eyebrow">Consulta operacional</span>
          <h1>Manual em campo</h1>
          <p className="page-description">Busque POPs por titulo, palavras-chave ou categoria com leitura otimizada para celular corporativo.</p>
        </div>
      </div>

      <section className="panel filters-grid filters-sticky">
        <label className="field">
          <span>Buscar POP</span>
          <input value={filters.search} onChange={(event) => handleFilterChange('search', event.target.value)} placeholder="Ex.: AMV, desengate, buzina" />
        </label>

        <label className="field">
          <span>Categoria</span>
          <select value={filters.categoria} onChange={(event) => handleFilterChange('categoria', event.target.value)}>
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.nome}>
                {category.nome}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {loading ? <LoadingState message="Atualizando manual..." /> : null}

      {!loading && pops.length === 0 ? (
        <EmptyState title="Nenhum POP publicado encontrado" description="Verifique a busca ou aguarde a publicacao de novos procedimentos." />
      ) : null}

      <section className="cards-grid consult-grid">
        {pops.map((pop) => (
          <POPCard key={pop.id} pop={pop} mode="consulta" />
        ))}
      </section>
    </div>
  );
}
