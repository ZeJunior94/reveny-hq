import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

interface Message { role: 'user' | 'agent'; text: string; }
interface Resumo { totalClientes: number; ativos: number; emRisco: number; inativos: number; nuncaUsaram: number; }

const SUGGESTIONS = [
  'Me dá um resumo da carteira',
  'Quais clientes não geraram email nos últimos 7 dias?',
  'Quem está em risco de churn esse mês?',
  'Clientes que nunca geraram nenhum email',
  'Qual cliente está mais ativo?',
];

const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
const card = { background: 'rgba(17,30,48,.7)', border: '1px solid rgba(74,127,165,.12)', borderRadius: 8 };
const sectionLabel: React.CSSProperties = { fontSize: '0.62rem', fontWeight: 600, color: 'rgba(74,127,165,.6)', textTransform: 'uppercase', letterSpacing: '0.18em' };
const ACCENT = '#7aaec7';

export default function Carteira() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function handleQuery(q?: string) {
    const text = (q ?? query).trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setQuery('');
    setLoading(true);
    try {
      const res = await fetch(`${PROXY}/api/hq/carteira/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na consulta');
      if (data.resumo) setResumo(data.resumo);
      setMessages(prev => [...prev, { role: 'agent', text: data.answer }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na consulta';
      setMessages(prev => [...prev, { role: 'agent', text: `Erro: ${msg}` }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ ...jakarta, fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.04em', color: 'white', lineHeight: 1.1 }}>
          Agente de Carteira
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.3)', marginTop: '0.3rem' }}>
          Base ativa — atividade, retenção e churn
        </p>
        <div style={{ marginTop: '1.5rem', borderBottom: '1px solid rgba(74,127,165,.1)' }} />
      </div>

      {/* Stats strip */}
      {resumo && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
          {[
            { label: 'Total',      value: resumo.totalClientes, color: 'white' },
            { label: 'Ativos',     value: resumo.ativos,        color: '#7aaa4a' },
            { label: 'Em risco',   value: resumo.emRisco,       color: '#f59e0b' },
            { label: 'Inativos',   value: resumo.inativos,      color: '#ef4444' },
            { label: 'Nunca usou', value: resumo.nuncaUsaram,   color: '#6b7280' },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: '0.85rem', textAlign: 'center', borderLeft: `2px solid ${s.color}40` }}>
              <div style={{ ...jakarta, fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.04em', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,.3)', marginTop: '0.25rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Chat */}
      <div style={{ ...card, overflow: 'hidden', marginBottom: '1rem' }}>
        <div style={{ minHeight: 300, maxHeight: 420, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.length === 0 && (
            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,.2)', textAlign: 'center', marginTop: '3rem' }}>
              Pergunte qualquer coisa sobre sua carteira de clientes.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%', borderRadius: 10, padding: '0.75rem 1rem',
                fontSize: '0.82rem', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                ...(m.role === 'user'
                  ? { background: `rgba(122,174,199,.12)`, color: 'rgba(255,255,255,.8)', border: `1px solid rgba(122,174,199,.2)` }
                  : { background: 'rgba(17,30,48,.5)', color: 'rgba(255,255,255,.7)', border: '1px solid rgba(74,127,165,.1)' })
              }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ background: 'rgba(17,30,48,.5)', border: '1px solid rgba(74,127,165,.1)', borderRadius: 10, padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.3)', marginRight: 6 }}>consultando carteira</span>
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: `${ACCENT}60`, animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ borderTop: '1px solid rgba(74,127,165,.1)', padding: '0.85rem 1.25rem', display: 'flex', gap: 10 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleQuery(); }}
            placeholder="Pergunte sobre sua carteira..."
            className="flex-1 bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none"
          />
          <button
            onClick={() => handleQuery()}
            disabled={loading || !query.trim()}
            style={{ background: ACCENT, color: '#0b1520', fontSize: '0.82rem', fontWeight: 700, padding: '0.45rem 1rem', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: loading || !query.trim() ? 0.4 : 1 }}
          >→</button>
        </div>
      </div>

      {/* Sugestões */}
      <div style={{ ...sectionLabel, marginBottom: '0.75rem' }}>Sugestões</div>
      <div className="flex flex-col gap-1.5">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => handleQuery(s)}
            disabled={loading}
            style={{ textAlign: 'left', fontSize: '0.82rem', color: 'rgba(255,255,255,.4)', padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid transparent', background: 'transparent', cursor: 'pointer', transition: 'all .15s' }}
            className="hover:text-white/70 hover:bg-[#4a7fa5]/8 hover:border-[#4a7fa5]/15 disabled:opacity-30"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
