import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

interface Admin { id: string; email: string; added_by: string; created_at: string; }

const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
const card = { background: 'rgba(17,30,48,.7)', border: '1px solid rgba(74,127,165,.12)', borderRadius: 8 };
const dimLabel: React.CSSProperties = { fontSize: '0.62rem', fontWeight: 600, color: 'rgba(74,127,165,.6)', textTransform: 'uppercase' as const, letterSpacing: '0.18em' };
const ACCENT = '#7aaec7';

export default function Time() {
  const { token, user } = useAuth();

  const [admins,  setAdmins]  = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [email,   setEmail]   = useState('');
  const [adding,  setAdding]  = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [msg,     setMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { fetchAdmins(); }, []); // eslint-disable-line

  async function fetchAdmins() {
    setLoading(true);
    try {
      const res  = await fetch(`${PROXY}/api/hq/admins`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdmins(data);
    } catch (err: unknown) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro ao carregar' });
    } finally { setLoading(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    setMsg(null);
    try {
      const res  = await fetch(`${PROXY}/api/hq/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdmins(prev => [...prev, data]);
      setEmail('');
      setMsg({ ok: true, text: `${data.email} adicionado com sucesso.` });
    } catch (err: unknown) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro ao adicionar' });
    } finally { setAdding(false); }
  }

  async function handleRemove(adminEmail: string) {
    setRemoving(adminEmail);
    setMsg(null);
    try {
      const res = await fetch(
        `${PROXY}/api/hq/admins/${encodeURIComponent(adminEmail)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdmins(prev => prev.filter(a => a.email !== adminEmail));
      setMsg({ ok: true, text: `${adminEmail} removido.` });
    } catch (err: unknown) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro ao remover' });
    } finally { setRemoving(null); }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-8">
        <h1 style={{ ...jakarta, fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.04em', color: 'white', lineHeight: 1.1 }}>
          Time
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.3)', marginTop: '0.3rem' }}>
          Gerencie quem tem acesso ao Reveny HQ
        </p>
        <div style={{ marginTop: '1.5rem', borderBottom: '1px solid rgba(74,127,165,.1)' }} />
      </div>

      {/* Feedback */}
      {msg && (
        <div style={{
          marginBottom: '1rem', padding: '0.65rem 1rem', borderRadius: 6, fontSize: '0.82rem',
          background: msg.ok ? 'rgba(122,170,74,.1)' : 'rgba(239,68,68,.1)',
          border: `1px solid ${msg.ok ? 'rgba(122,170,74,.2)' : 'rgba(239,68,68,.2)'}`,
          color: msg.ok ? '#7aaa4a' : '#f87171',
        }}>
          {msg.text}
        </div>
      )}

      {/* Lista de admins */}
      <div style={{ ...card, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(74,127,165,.08)' }}>
          <span style={dimLabel}>Acesso atual — {admins.length} {admins.length === 1 ? 'pessoa' : 'pessoas'}</span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,.2)', fontSize: '0.82rem' }}>
            Carregando...
          </div>
        ) : admins.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,.2)', fontSize: '0.82rem' }}>
            Nenhum admin cadastrado.
          </div>
        ) : (
          admins.map((a, i) => {
            const isMe   = a.email === user?.email;
            const date   = new Date(a.created_at).toLocaleDateString('pt-BR');
            return (
              <div
                key={a.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '0.85rem 1rem',
                  borderBottom: i < admins.length - 1 ? '1px solid rgba(74,127,165,.06)' : 'none',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #1e3350, #4a7fa5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,.8)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  {a.email.slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,.8)', fontWeight: 500 }}>
                      {a.email}
                    </span>
                    {isMe && (
                      <span style={{
                        fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.45rem',
                        borderRadius: 20, background: `${ACCENT}18`, color: ACCENT,
                        border: `1px solid ${ACCENT}30`, letterSpacing: '0.04em',
                      }}>
                        você
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.2)', marginTop: 1 }}>
                    Adicionado em {date} · por {a.added_by}
                  </div>
                </div>

                {/* Remove */}
                {!isMe && (
                  <button
                    onClick={() => handleRemove(a.email)}
                    disabled={removing === a.email}
                    style={{
                      padding: '0.3rem 0.65rem', borderRadius: 5, fontSize: '0.72rem', fontWeight: 600,
                      background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.18)',
                      color: '#f87171', cursor: 'pointer', transition: 'all .15s',
                      opacity: removing === a.email ? 0.4 : 1, flexShrink: 0,
                    }}
                  >
                    {removing === a.email ? '...' : 'Remover'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Adicionar novo admin */}
      <div style={{ ...card, padding: '1.25rem' }}>
        <div style={{ ...dimLabel, marginBottom: '0.85rem' }}>Adicionar acesso</div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email@reveny.com.br"
            required
            style={{
              flex: 1, padding: '0.55rem 0.85rem',
              background: 'rgba(17,30,48,.9)', border: '1px solid rgba(74,127,165,.2)',
              borderRadius: 6, color: 'rgba(255,255,255,.8)', fontSize: '0.85rem', outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={adding || !email.trim()}
            style={{
              padding: '0.55rem 1.1rem', borderRadius: 6, fontSize: '0.82rem', fontWeight: 700,
              background: ACCENT, color: '#0b1520', border: 'none', cursor: 'pointer',
              opacity: adding || !email.trim() ? 0.4 : 1, transition: 'opacity .15s', flexShrink: 0,
            }}
          >
            {adding ? '...' : '+ Adicionar'}
          </button>
        </form>
        <p style={{ marginTop: '0.6rem', fontSize: '0.72rem', color: 'rgba(255,255,255,.2)' }}>
          A pessoa precisa ter uma conta Google vinculada a esse e-mail no Supabase.
        </p>
      </div>
    </div>
  );
}
