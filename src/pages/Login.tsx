import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: '#0b1520' }}>

      {/* Glow de fundo */}
      <div style={{
        position: 'absolute', top: '35%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60vw', height: '40vh',
        background: 'radial-gradient(ellipse at center, rgba(74,127,165,.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="w-full max-w-sm flex flex-col items-center relative">

        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-10">
          <div style={{
            width: 36, height: 36, borderRadius: 6, flexShrink: 0,
            background: 'linear-gradient(135deg, #1e3350, #4a7fa5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800,
            fontSize: '1rem', color: 'white',
          }}>
            R
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.04em', color: 'white' }}>
            Rev<span style={{ color: '#7aaec7' }}>e</span>ny{' '}
            <span style={{ color: '#4a7fa5', fontWeight: 500, fontSize: '0.9rem', letterSpacing: '0.04em' }}>HQ</span>
          </span>
        </div>

        {/* Card de login */}
        <div style={{
          width: '100%', padding: '2rem',
          background: 'rgba(30,51,80,.4)',
          border: '1px solid rgba(74,127,165,.15)',
          borderRadius: 8,
          backdropFilter: 'blur(8px)',
        }}>
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '0.82rem', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Workspace interno da equipe Reveny
          </p>

          <button
            onClick={loginWithGoogle}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, background: 'white', color: '#1a2e40',
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              fontSize: '0.88rem', padding: '0.85rem 1.5rem',
              border: 'none', borderRadius: 6, cursor: 'pointer',
              transition: 'background .15s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#f0f5f9')}
            onMouseOut={e => (e.currentTarget.style.background = 'white')}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </button>
        </div>

        <p style={{ color: 'rgba(255,255,255,.15)', fontSize: '0.68rem', marginTop: '1.5rem', letterSpacing: '0.04em' }}>
          Acesso restrito · Reveny © 2026
        </p>
      </div>
    </div>
  );
}
