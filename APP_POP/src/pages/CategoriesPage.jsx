import { useEffect, useState } from 'react';
import { EmptyState } from '../components/feedback/EmptyState';
import { LoadingState } from '../components/feedback/LoadingState';
import { deleteCategory, fetchCategories, saveCategory } from '../services/categoryService';

const initialForm = { nome: '', descricao: '', ativo: true };

export function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setCategories(await fetchCategories());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      await saveCategory(form);
      setForm(initialForm);
      setSuccessMessage(form.id ? 'Categoria atualizada com sucesso.' : 'Categoria criada com sucesso.');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Deseja excluir esta categoria?')) return;

    try {
      setError('');
      setSuccessMessage('');
      await deleteCategory(id);
      if (form.id === id) {
        setForm(initialForm);
      }
      setSuccessMessage('Categoria excluida com sucesso.');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(category) {
    setError('');
    setSuccessMessage('');
    setForm({
      id: category.id,
      nome: category.nome ?? '',
      descricao: category.descricao ?? '',
      ativo: category.ativo ?? true,
    });
  }

  return (
    <div className="page-stack two-column-layout">
      <section className="panel">
        <div className="section-heading">
          <span className="eyebrow">Administracao</span>
          <h1>Categorias</h1>
          <p className="page-description">Organize os POPs por assunto para facilitar a consulta em campo.</p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nome</span>
            <input
              value={form.nome}
              onChange={(event) => setForm({ ...form, nome: event.target.value })}
              required
            />
          </label>

          <label className="field">
            <span>Descricao</span>
            <textarea
              value={form.descricao}
              onChange={(event) => setForm({ ...form, descricao: event.target.value })}
              rows="4"
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(event) => setForm({ ...form, ativo: event.target.checked })}
            />
            <span>Categoria ativa</span>
          </label>

          <button className="button button-primary button-tall" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : form.id ? 'Salvar alteracoes' : 'Cadastrar categoria'}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Lista de categorias</h2>
          <p className="page-description">Edite nomes, descricoes e disponibilidade das categorias operacionais.</p>
        </div>

        {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}
        {error ? <div className="alert alert-error">{error}</div> : null}
        {loading ? <LoadingState message="Carregando categorias..." /> : null}

        {!loading && categories.length === 0 ? (
          <EmptyState
            title="Nenhuma categoria cadastrada"
            description="Crie categorias para organizar melhor os POPs."
          />
        ) : null}

        <div className="list-stack">
          {categories.map((category) => (
            <article key={category.id} className="list-row">
              <div>
                <strong>{category.nome}</strong>
                <p>{category.descricao || 'Sem descricao cadastrada.'}</p>
              </div>
              <div className="row-actions">
                <button className="button button-ghost" type="button" onClick={() => handleEdit(category)}>
                  Editar
                </button>
                <button className="button button-secondary" type="button" onClick={() => handleDelete(category.id)}>
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
