import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../lib/constants';
import { useAuth } from '../contexts/AuthContext';

const adminMenu = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/pops', label: 'Gerenciar POPs' },
  { to: '/admin/pops/novo', label: 'Novo POP' },
  { to: '/admin/usuarios', label: 'Usuarios' },
  { to: '/admin/categorias', label: 'Categorias' },
  { to: '/app', label: 'Consulta' },
];

const consultMenu = [{ to: '/app', label: 'Manual' }];

export function AppShell({ variant }) {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const menu =
    variant === 'admin'
      ? adminMenu
      : profile?.perfil === 'ADMIN_POP'
        ? [...consultMenu, { to: '/admin', label: 'Voltar ao Admin' }]
        : consultMenu;

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={`shell ${variant === 'admin' ? 'shell-admin' : 'shell-consult'}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-kicker">Operacao Ferroviaria</span>
          <strong>{APP_NAME}</strong>
        </div>

        <nav className="nav-menu">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/app'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div>
            <strong>{profile?.nome}</strong>
            <span>{profile?.perfil}</span>
          </div>
          <button className="button button-secondary button-full" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
