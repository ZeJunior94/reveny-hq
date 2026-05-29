import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '@/lib/supabase';
import { useAuth, ADMINS } from '@/contexts/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    // Supabase retorna os tokens no hash da URL após OAuth
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (!accessToken) {
      setError('Token não encontrado. Tente novamente.');
      return;
    }

    getUser(accessToken)
      .then((u) => {
        if (!u?.email) {
          setError('Não foi possível verificar o usuário.');
          return;
        }
        if (!ADMINS.includes(u.email)) {
          setError('Acesso restrito à equipe Reveny.');
          return;
        }
        setSession(accessToken, { id: u.id, email: u.email, isAdmin: true });
        navigate('/', { replace: true });
      })
      .catch(() => setError('Erro ao verificar usuário. Tente novamente.'));
  }, [navigate, setSession]);

  if (error) {
    return (
      <div className="w-full min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="text-white/40 text-xs hover:text-white/60 transition-colors"
        >
          ← Voltar ao login
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-white/10 border-t-[#7aaa4a] rounded-full animate-spin" />
        <p className="text-white/30 text-xs">Autenticando...</p>
      </div>
    </div>
  );
}
