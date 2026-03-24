import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="state-card full-screen">
      <strong>Pagina nao encontrada</strong>
      <p>O endereco informado nao existe ou voce nao tem acesso a ele.</p>
      <Link to="/login" className="button button-primary button-tall">
        Voltar ao login
      </Link>
    </div>
  );
}
