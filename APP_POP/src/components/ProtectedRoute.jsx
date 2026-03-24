import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState } from './feedback/LoadingState';

export function ProtectedRoute({ allowedProfiles, children }) {
  const { user, profile, loading, authError } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState fullScreen message="Validando acesso..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!profile && !authError) {
    return <LoadingState fullScreen message="Carregando perfil..." />;
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedProfiles && !allowedProfiles.includes(profile.perfil)) {
    return <Navigate to={profile.perfil === 'ADMIN_POP' ? '/admin' : '/app'} replace />;
  }

  return children;
}
