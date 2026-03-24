import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/feedback/EmptyState';
import { LoadingState } from '../components/feedback/LoadingState';
import { POPCard } from '../components/POPCard';
import { fetchCategories } from '../services/categoryService';
import { deletePop, fetchPops } from '../services/popService';

export function ManagePopsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pops, setPops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', categoria: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const requestIdRef = useRef(0);

  async function loadData(currentFilters) {
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      const [nextPops, nextCategories] = await Promise.all([
        fetchPops(currentFilters, true),
        fetchCategories(),
      ]);

      if (requestId !== requestIdRef.current) return;

      setPops(nextPops);
      setCategories(nextCategories);
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

  useEffect(() => {
    const nextMessage = location.state?.successMessage;
    if (!nextMessage) return;

    setSuccessMessage(nextMessage);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  async function handleDelete(id) {
    const confirmed = window.confirm('Deseja realmente excluir este POP?');
    if (!confirmed) return;

    try {
      await deletePop(id);
      await loadData(filters);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleFilterChange(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">Administracao</span>
          <h1>Gerenciar POPs</h1>
          <p className="page-description">Filtre, revise e mantenha os procedimentos operacionais atualizados.</p>
        </div>
        <Link className="button button-primary button-tall" to="/admin/pops/novo">
          Novo POP
        </Link>
      </div>

      <section className="panel filters-grid filters-sticky">
        <label className="field">
          <span>Buscar</span>
          <input
            value={filters.search}
            onChange={(event) => handleFilterChange('search', event.target.value)}
            placeholder="Titulo, palavra-chave ou categoria"
          />
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

        <label className="field">
          <span>Status</span>
          <select value={filters.status} onChange={(event) => handleFilterChange('status', event.target.value)}>
            <option value="">Todos</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="PUBLICADO">Publicado</option>
            <option value="INATIVO">Inativo</option>
          </select>
        </label>
      </section>

      {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}
      {error ? <div className="alert alert-error">{error}</div> : null}
      {loading ? <LoadingState message="Carregando POPs..." /> : null}

      {!loading && pops.length === 0 ? (
        <EmptyState
          title="Nenhum POP encontrado"
          description="Ajuste os filtros ou crie um novo procedimento para iniciar a base operacional."
        />
      ) : null}

      <section className="cards-grid">
        {pops.map((pop) => (
          <div key={pop.id} className="card-with-actions">
            <POPCard pop={pop} mode="admin" />
            <button className="button button-ghost button-full button-tall" onClick={() => handleDelete(pop.id)}>
              Excluir
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
