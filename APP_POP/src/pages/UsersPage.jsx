import { useEffect, useState } from 'react';
import { EmptyState } from '../components/feedback/EmptyState';
import { LoadingState } from '../components/feedback/LoadingState';
import { USER_PROFILES } from '../lib/constants';
import { createManagedUser, fetchUsers, updateUserProfile } from '../services/userService';

const newUserInitialState = {
  nome: '',
  email: '',
  password: '',
  perfil: 'CONSULTA_POP',
};

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState(newUserInitialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      setUsers(await fetchUsers());
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

  async function handleCreateUser(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      await createManagedUser(newUser);
      setNewUser(newUserInitialState);
      setSuccessMessage('Usuario criado com sucesso.');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(userId, payload) {
    try {
      setUpdatingUserId(userId);
      setError('');
      setSuccessMessage('');
      await updateUserProfile(userId, payload);
      setSuccessMessage('Usuario atualizado com sucesso.');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUserId('');
    }
  }

  return (
    <div className="page-stack two-column-layout">
      <section className="panel">
        <div className="section-heading">
          <span className="eyebrow">Controle de acesso</span>
          <h1>Usuarios</h1>
        </div>

        <form className="form-grid" onSubmit={handleCreateUser}>
          <label className="field">
            <span>Nome</span>
            <input value={newUser.nome} onChange={(event) => setNewUser({ ...newUser, nome: event.target.value })} required />
          </label>

          <label className="field">
            <span>Email</span>
            <input type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} required />
          </label>

          <label className="field">
            <span>Senha inicial</span>
            <input type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} minLength="6" required />
          </label>

          <label className="field">
            <span>Perfil</span>
            <select value={newUser.perfil} onChange={(event) => setNewUser({ ...newUser, perfil: event.target.value })}>
              {USER_PROFILES.map((profile) => (
                <option key={profile} value={profile}>
                  {profile}
                </option>
              ))}
            </select>
          </label>

          <button className="button button-primary button-tall" type="submit" disabled={submitting}>
            {submitting ? 'Criando...' : 'Criar usuario'}
          </button>
        </form>

        {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}
        {error ? <div className="alert alert-error">{error}</div> : null}
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Usuarios cadastrados</h2>
        </div>

        {loading ? <LoadingState message="Carregando usuarios..." /> : null}
        {!loading && users.length === 0 ? (
          <EmptyState title="Nenhum usuario encontrado" description="Crie o primeiro usuario para iniciar a operacao." />
        ) : null}

        <div className="list-stack">
          {users.map((user) => (
            <article key={user.id} className="list-row">
              <div>
                <strong>{user.nome}</strong>
                <p>{user.email}</p>
              </div>
              <div className="inline-controls">
                <select value={user.perfil} onChange={(event) => handleUpdate(user.id, { perfil: event.target.value })} disabled={updatingUserId === user.id}>
                  {USER_PROFILES.map((profile) => (
                    <option key={profile} value={profile}>
                      {profile}
                    </option>
                  ))}
                </select>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={user.ativo}
                    disabled={updatingUserId === user.id}
                    onChange={(event) => handleUpdate(user.id, { ativo: event.target.checked })}
                  />
                  <span>{user.ativo ? 'Ativo' : 'Inativo'}</span>
                </label>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
