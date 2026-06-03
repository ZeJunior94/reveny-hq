import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

interface Message  { role: 'user' | 'agent'; text: string; }
interface Resumo   { totalClientes: number; ativos: number; emRisco: number; inativos: number; nuncaUsaram: number; }
interface Customer {
  user_id: string; email: string; company_name: string;
  plan: string | null; credits_used: number; credits_limit: number;
  last_activity: string | null; status: string; subscription_id: string | null;
}

const SUGGESTIONS = [
  'Me dá um resumo da carteira',
  'Quais clientes não geraram email nos últimos 7 dias?',
  'Quem está em risco de churn esse mês?',
  'Clientes que nunca geraram nenhum email',
  'Qual cliente está mais ativo?',
];

const PLANS = ['aprendiz', 'pro', 'agencia', 'admin'] as const;

const planColor: Record<string, string> = {
  admin: '#a78bfa', agencia: '#7aaa4a', pro: '#f59e0b',
  aprendiz: '#6b7280', trial: '#7aaec7',
};

const jakarta: React.CSSProperties  = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
const card = { background: 'rgba(17,30,48,.7)', border: '1px solid rgba(74,127,165,.12)', borderRadius: 8 };
const dimLabel: React.CSSProperties = { fontSize: '0.62rem', fontWeight: 600, color: 'rgba(74,127,165,.6)', textTransform: 'uppercase' as const, letterSpacing: '0.18em' };
const ACCENT = '#7aaec7';

export default function Carteira() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'carteira' | 'planos'>('carteira');

  // ── Chat state ────────────────────────────────────────────────────────────
  const [query,    setQuery]    = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [resumo,   setResumo]   = useState<Resumo | null>(null);
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Planos state ──────────────────────────────────────────────────────────
  const [customers,        setCustomers]        = useState<Customer[]>([]);
  const [search,           setSearch]           = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [modalUser,        setModalUser]        = useState<Customer | null>(null);
  const [newPlan,          setNewPlan]          = useState('');
  const [reason,           setReason]           = useState('');
  const [saving,           setSaving]           = useState(false);
  const [saveMsg,          setSaveMsg]          = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (activeTab === 'planos' && customers.length === 0) fetchCustomers();
  }, [activeTab]); // eslint-disable-line

  async function fetchCustomers() {
    setLoadingCustomers(true);
    try {
      const res  = await fetch(`${PROXY}/api/admin/customers`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCustomers(data.customers || []);
    } catch (err) { console.error(err); }
    finally { setLoadingCustomers(false); }
  }

  async function handleQuery(q?: string) {
    const text = (q ?? query).trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setQuery('');
    setLoading(true);
    try {
      const res  = await fetch(`${PROXY}/api/hq/carteira/query`, {
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

  function openModal(c: Customer) {
    setModalUser(c);
    setNewPlan(c.plan || 'aprendiz');
    setReason('');
    setSaveMsg(null);
  }

  async function handleChangePlan() {
    if (!modalUser || !newPlan || !reason.trim()) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res  = await fetch(`${PROXY}/api/admin/change-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: modalUser.user_id, new_plan: newPlan, reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaveMsg({ ok: true, text: `Plano alterado: ${modalUser.plan || 'sem plano'} → ${newPlan}` });
      setCustomers(prev => prev.map(c => c.user_id === modalUser.user_id ? { ...c, plan: newPlan } : c));
      setTimeout(() => setModalUser(null), 1800);
    } catch (err: unknown) {
      setSaveMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro ao alterar plano' });
    } finally { setSaving(false); }
  }

  const filtered = customers.filter(c =>
    !search ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.company_name.toLowerCase().includes(search.toLowerCase())
  );

  const TABS: { id: 'carteira' | 'planos'; label: string }[] = [
    { id: 'carteira', label: 'Carteira' },
    { id: 'planos',   label: 'Planos'   },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl">

      {/* Header + Tabs */}
      <div className="mb-6">
        <h1 style={{ ...jakarta, fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.04em', color: 'white', lineHeight: 1.1 }}>
          Agente de Carteira
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.3)', marginTop: '0.3rem' }}>
          Base ativa — atividade, retenção e churn
        </p>
        <div style={{ display: 'flex', gap: 0, marginTop: '1.25rem', borderBottom: '1px solid rgba(74,127,165,.1)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 1.1rem 0.6rem',
                fontSize: '0.8rem', fontWeight: 600,
                color: activeTab === tab.id ? ACCENT : 'rgba(255,255,255,.35)',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${ACCENT}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all .15s',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: Carteira (chat) ──────────────────────────────────── */}
      {activeTab === 'carteira' && (
        <>
          {resumo && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
              {[
                { label: 'Total',      value: resumo.totalClientes, color: 'white'    },
                { label: 'Ativos',     value: resumo.ativos,        color: '#7aaa4a'  },
                { label: 'Em risco',   value: resumo.emRisco,       color: '#f59e0b'  },
                { label: 'Inativos',   value: resumo.inativos,      color: '#ef4444'  },
                { label: 'Nunca usou', value: resumo.nuncaUsaram,   color: '#6b7280'  },
              ].map(s => (
                <div key={s.label} style={{ ...card, padding: '0.85rem', textAlign: 'center', borderLeft: `2px solid ${s.color}40` }}>
                  <div style={{ ...jakarta, fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.04em', color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,.3)', marginTop: '0.25rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

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
                      ? { background: 'rgba(122,174,199,.12)', color: 'rgba(255,255,255,.8)', border: '1px solid rgba(122,174,199,.2)' }
                      : { background: 'rgba(17,30,48,.5)',      color: 'rgba(255,255,255,.7)', border: '1px solid rgba(74,127,165,.1)' })
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
                      {[0, 1, 2].map(i => (
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

          <div style={{ ...dimLabel, marginBottom: '0.75rem' }}>Sugestões</div>
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
        </>
      )}

      {/* ── TAB: Planos ───────────────────────────────────────────── */}
      {activeTab === 'planos' && (
        <div>
          {/* Barra de busca + refresh */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por e-mail ou nome..."
              style={{
                flex: 1, background: 'rgba(17,30,48,.7)', border: '1px solid rgba(74,127,165,.15)',
                borderRadius: 6, padding: '0.5rem 0.85rem',
                color: 'rgba(255,255,255,.8)', fontSize: '0.82rem', outline: 'none',
              }}
            />
            <button
              onClick={fetchCustomers}
              disabled={loadingCustomers}
              style={{
                background: 'rgba(17,30,48,.7)', border: '1px solid rgba(74,127,165,.15)',
                borderRadius: 6, padding: '0.5rem 0.85rem',
                color: ACCENT, fontSize: '0.9rem', cursor: 'pointer',
                opacity: loadingCustomers ? 0.5 : 1,
              }}
            >↻</button>
          </div>

          {/* Tabela */}
          <div style={{ ...card, overflow: 'hidden' }}>
            {loadingCustomers ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: '0.82rem' }}>
                Carregando clientes...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: '0.82rem' }}>
                Nenhum cliente encontrado.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(74,127,165,.12)' }}>
                      {['Cliente', 'Plano', 'E-mails / mês', 'Última atividade', ''].map(h => (
                        <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', ...dimLabel }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => {
                      const color   = planColor[c.plan || ''] || '#6b7280';
                      const lastAct = c.last_activity
                        ? new Date(c.last_activity).toLocaleDateString('pt-BR')
                        : '—';
                      return (
                        <tr key={c.user_id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(74,127,165,.06)' : 'none' }}>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ color: 'rgba(255,255,255,.85)', fontWeight: 600, marginBottom: 1 }}>{c.company_name}</div>
                            <div style={{ color: 'rgba(255,255,255,.3)', fontSize: '0.72rem' }}>{c.email}</div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              display: 'inline-block', padding: '0.18rem 0.6rem', borderRadius: 20,
                              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
                              background: `${color}18`, color, border: `1px solid ${color}30`,
                            }}>
                              {c.plan || 'sem plano'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'rgba(255,255,255,.55)' }}>
                            {c.credits_used}{c.credits_limit ? ` / ${c.credits_limit}` : ''}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'rgba(255,255,255,.35)', fontSize: '0.75rem' }}>
                            {lastAct}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <button
                              onClick={() => openModal(c)}
                              style={{
                                padding: '0.28rem 0.7rem', borderRadius: 5, fontSize: '0.75rem', fontWeight: 600,
                                background: 'rgba(122,174,199,.1)', border: '1px solid rgba(122,174,199,.2)',
                                color: ACCENT, cursor: 'pointer', transition: 'all .15s',
                              }}
                            >
                              Alterar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'rgba(255,255,255,.2)' }}>
            {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* ── Modal alterar plano ───────────────────────────────────── */}
      {modalUser && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setModalUser(null); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem',
          }}
        >
          <div style={{ ...card, width: '100%', maxWidth: 420, padding: '1.5rem', position: 'relative' }}>
            {/* Close */}
            <button
              onClick={() => setModalUser(null)}
              style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}
            >×</button>

            {/* User info */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ ...dimLabel, marginBottom: '0.4rem' }}>Alterar plano</div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>{modalUser.company_name}</div>
              <div style={{ color: 'rgba(255,255,255,.35)', fontSize: '0.78rem' }}>{modalUser.email}</div>
            </div>

            {/* Plano atual */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem', padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,.07)' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,.4)' }}>Plano atual:</span>
              {(() => {
                const color = planColor[modalUser.plan || ''] || '#6b7280';
                return (
                  <span style={{
                    padding: '0.15rem 0.6rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                    background: `${color}18`, color, border: `1px solid ${color}30`,
                  }}>
                    {modalUser.plan || 'sem plano'}
                  </span>
                );
              })()}
            </div>

            {/* Novo plano */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ ...dimLabel, display: 'block', marginBottom: '0.4rem' }}>Novo plano</label>
              <select
                value={newPlan}
                onChange={e => setNewPlan(e.target.value)}
                style={{
                  width: '100%', padding: '0.55rem 0.85rem',
                  background: 'rgba(17,30,48,.9)', border: '1px solid rgba(74,127,165,.2)',
                  borderRadius: 6, color: 'white', fontSize: '0.85rem', outline: 'none',
                }}
              >
                {PLANS.map(p => (
                  <option key={p} value={p} style={{ background: '#0b1520' }}>{p}</option>
                ))}
              </select>
            </div>

            {/* Motivo */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ ...dimLabel, display: 'block', marginBottom: '0.4rem' }}>
                Motivo <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ex: Upgrade solicitado via WhatsApp"
                rows={3}
                style={{
                  width: '100%', padding: '0.55rem 0.85rem', resize: 'vertical',
                  background: 'rgba(17,30,48,.9)', border: '1px solid rgba(74,127,165,.2)',
                  borderRadius: 6, color: 'rgba(255,255,255,.8)', fontSize: '0.82rem',
                  outline: 'none', lineHeight: 1.5,
                }}
              />
            </div>

            {/* Feedback */}
            {saveMsg && (
              <div style={{
                marginBottom: '1rem', padding: '0.55rem 0.85rem', borderRadius: 6, fontSize: '0.8rem',
                background: saveMsg.ok ? 'rgba(122,170,74,.12)' : 'rgba(239,68,68,.12)',
                border: `1px solid ${saveMsg.ok ? 'rgba(122,170,74,.25)' : 'rgba(239,68,68,.25)'}`,
                color: saveMsg.ok ? '#7aaa4a' : '#f87171',
              }}>
                {saveMsg.text}
              </div>
            )}

            {/* Botões */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalUser(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: 6, fontSize: '0.82rem', background: 'transparent', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.4)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePlan}
                disabled={saving || !reason.trim() || newPlan === modalUser.plan}
                style={{
                  padding: '0.5rem 1.2rem', borderRadius: 6, fontSize: '0.82rem', fontWeight: 700,
                  background: ACCENT, color: '#0b1520', border: 'none', cursor: 'pointer',
                  opacity: saving || !reason.trim() || newPlan === modalUser.plan ? 0.4 : 1,
                  transition: 'opacity .15s',
                }}
              >
                {saving ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
