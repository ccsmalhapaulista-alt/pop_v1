import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AgentConsultPage } from './pages/AgentConsultPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { LoginPage } from './pages/LoginPage';
import { ManagePopsPage } from './pages/ManagePopsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PopDetailPage } from './pages/PopDetailPage';
import { PopEditorPage } from './pages/PopEditorPage';
import { UsersPage } from './pages/UsersPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedProfiles={['ADMIN_POP']}>
            <AppShell variant="admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="pops" element={<ManagePopsPage />} />
        <Route path="pops/novo" element={<PopEditorPage mode="create" />} />
        <Route path="pops/:id" element={<PopEditorPage mode="edit" />} />
        <Route path="usuarios" element={<UsersPage />} />
        <Route path="categorias" element={<CategoriesPage />} />
      </Route>

      <Route
        path="/app"
        element={
          <ProtectedRoute allowedProfiles={['ADMIN_POP', 'CONSULTA_POP']}>
            <AppShell variant="consulta" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AgentConsultPage />} />
        <Route path="pop/:id" element={<PopDetailPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
