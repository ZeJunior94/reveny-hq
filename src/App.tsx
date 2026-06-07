import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/AuthCallback';
import Hub from '@/pages/Hub';
import Produto from '@/pages/Produto';
import Pipeline from '@/pages/Pipeline';
import Carteira from '@/pages/Carteira';
import Conteudo from '@/pages/Conteudo';
import Contexto from '@/pages/Contexto';
import Time from '@/pages/Time';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1520] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/10 border-t-[#7aaa4a] rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1520] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/10 border-t-[#7aaa4a] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Hub />} />
        <Route path="produto" element={<Produto />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="carteira" element={<Carteira />} />
        <Route path="conteudo" element={<Conteudo />} />
        <Route path="contexto" element={<Contexto />} />
        <Route path="time"     element={<Time />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
