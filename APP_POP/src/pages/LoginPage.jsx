import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../lib/constants';
import { supabaseConfigError } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, login, authError, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (location.state?.from) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!loading && user && profile) {
      navigate(profile.perfil === 'ADMIN_POP' ? '/admin' : '/app', { replace: true });
    }
  }, [loading, navigate, profile, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError('');

    try {
      await login(email, password);
    } catch (error) {
      setLocalError(error.message || 'Nao foi possivel entrar.');
    }
  }

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="hero-panel">
          <span className="eyebrow">Uso corporativo</span>
          <h1>{APP_NAME}</h1>
          <p>
            Manual digital de consulta rapida e padronizacao operacional para agentes de seguranca e operacao ferroviaria.
          </p>
          <ul className="hero-list">
            <li>Consulte o que verificar e como agir em cada situacao</li>
            <li>Veja rapidamente os riscos, evidencias e causas no local</li>
            <li>Siga o procedimento correto com seguranca e padrao</li>
          </ul>
        </div>
      </section>

      <section className="login-form-section">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <div className="section-heading">
            <span className="eyebrow">Acesso ao sistema</span>
            <h2>Entrar</h2>
          </div>

          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="agente@empresa.com" required />
          </label>

          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha"
              required
            />
          </label>

          {supabaseConfigError ? <div className="alert alert-error">{supabaseConfigError}</div> : null}
          {localError || authError ? <div className="alert alert-error">{localError || authError}</div> : null}

          <button className="button button-primary button-full button-tall" type="submit" disabled={loading || Boolean(supabaseConfigError)}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </div>
  );
}
