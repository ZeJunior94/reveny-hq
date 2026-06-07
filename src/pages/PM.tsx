import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

type Status = 'ideia' | 'aprovada' | 'building' | 'done';

interface Feature {
  id: string; title: string; description: string;
  ice: number; ice_impact: number; ice_confidence: number;
  ice_ease: number; ice_reasoning: string; status: Status;
  notes?: string; created_at: string;
}

const COLS: { key: Status; label: string; color: string }[] = [
  { key: 'ideia',    label: 'Ideia',    color: '#7aaec7' },
  { key: 'aprovada', label: 'Aprovada', color: '#7aaa4a' },
  { key: 'building', label: 'Building', color: '#4a7fa5' },
  { key: 'done',     label: 'Done',     color: '#34d399' },
];

const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
const card = { background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 8 };
const innerCard = { background: 'var(--bg-inner)', border: '1px solid var(--border-inner)', borderRadius: 6 };
const sectionLabel: React.CSSProperties = { fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.18em' };

function Skel({ className }: { className?: string }) {
  return <div className={`rounded animate-pulse ${className ?? ''}`} style={{ background: 'var(--skel-bg)' }} />;
}

function IceBadge({ ice }: { ice: number }) {
  const color = ice >= 8 ? '#7aaa4a' : ice >= 6 ? '#f59e0b' : '#ef4444';
  return (
    <span style={{ color, background: `${color}18`, fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 4 }}>
      ICE {ice}
    </span>
  );
}

export default function PM() {
  const { token } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const byStatus = (s: Status) => features.filter(f => f.status === s);

  useEffect(() => {
    fetch(`${PROXY}/api/hq/pm/features`, { headers: authHeaders })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFeatures(data); })
      .catch(e => setError(e.message))
      .finally(() => setFetching(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAnalyze() {
    if (!input.trim() || loading) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${PROXY}/api/hq/pm/analyze`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify({ idea: input.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro');
      setFeatures(prev => [data, ...prev]);
      setInput('');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro'); }
    finally { setLoading(false); }
  }

  async function moveStatus(id: string, status: Status) {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    await fetch(`${PROXY}/api/hq/pm/features/${id}`, {
      method: 'PATCH', headers: authHeaders, body: JSON.stringify({ status }),
    });
  }

  async function deleteFeature(id: string) {
    if (!confirm('Remover esta feature?')) return;
    setFeatures(prev => prev.filter(f => f.id !== id));
    await fetch(`${PROXY}/api/hq/pm/features/${id}`, { method: 'DELETE', headers: authHeaders });
  }

  async function clearAll() {
    if (!confirm('Remover todas as features?')) return;
    const ids = features.map(f => f.id);
    setFeatures([]);
    await Promise.all(ids.map(id => fetch(`${PROXY}/api/hq/pm/features/${id}`, { method: 'DELETE', headers: authHeaders })));
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 style={{ ...jakarta, fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.04em', color: 'var(--text-pri)', lineHeight: 1.1 }}>
              PM de Features
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-ter)', marginTop: '0.3rem' }}>
              Ideias → ICE Score → backlog
            </p>
          </div>
          {!fetching && (
            <div className="flex gap-6">
              {[
                { label: 'Total',    value: features.length,            color: 'var(--text-pri)' },
                { label: 'Aprovadas', value: byStatus('aprovada').length, color: '#7aaa4a' },
                { label: 'Building', value: byStatus('building').length, color: '#4a7fa5' },
              ].map(s => (
                <div key={s.label} className="text-right">
                  <div style={{ ...jakarta, fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.04em', color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-ter)', marginTop: '0.2rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginTop: '1.5rem', borderBottom: '1px solid var(--border-main)' }} />
      </div>

      {/* Input */}
      <div style={{ ...card, padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ ...sectionLabel, marginBottom: '0.85rem' }}>● Nova ideia de feature</div>
        <div style={{ borderBottom: '1px solid var(--border-inner)', marginBottom: '1rem' }} />
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyze(); }}
          placeholder="Ex: quero que o usuário possa escolher o tom de voz antes de gerar o email..."
          rows={3}
          className="w-full bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none resize-none leading-relaxed"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-inner)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-ter)' }}>⌘+Enter para analisar</span>
          <button
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            style={{ background: '#7aaa4a', color: 'black', fontSize: '0.75rem', fontWeight: 700, padding: '0.45rem 1rem', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: loading || !input.trim() ? 0.4 : 1 }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="w-3 h-3 border border-black/30 border-t-black/80 rounded-full animate-spin" />
                Analisando...
              </span>
            ) : 'Analisar →'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '1.5rem', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 6, padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.82rem' }}>
          {error}
        </div>
      )}

      {/* Kanban */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <span style={sectionLabel}>Backlog</span>
        {!fetching && features.length > 0 && (
          <button
            onClick={clearAll}
            style={{ fontSize: '0.68rem', color: 'var(--text-sec)', background: 'transparent', border: '1px solid var(--border-main)', borderRadius: 6, padding: '0.25rem 0.65rem', cursor: 'pointer' }}
          >
            limpar tudo
          </button>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="grid grid-cols-4 gap-3" style={{ minWidth: 720 }}>
          {COLS.map(col => (
            <div key={col.key} style={{ ...card, padding: '1rem', minHeight: 260, borderLeft: `2px solid ${col.color}40` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: col.color }}>{col.label}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: col.color, background: `${col.color}18`, padding: '0.1rem 0.45rem', borderRadius: 999 }}>
                  {byStatus(col.key).length}
                </span>
              </div>

              {fetching && col.key === 'ideia' && (
                <div className="flex flex-col gap-2">
                  {[1,2].map(i => (
                    <div key={i} style={{ ...innerCard, padding: '0.75rem' }}>
                      <Skel className="h-3 w-full mb-2" /><Skel className="h-2.5 w-2/3 mb-3" /><Skel className="h-4 w-12 rounded-full" />
                    </div>
                  ))}
                </div>
              )}

              {!fetching && (
                <div className="flex flex-col gap-2">
                  {byStatus(col.key).length === 0 && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-ter)', textAlign: 'center', marginTop: '2rem' }}>vazio</div>
                  )}
                  {byStatus(col.key).map(f => (
                    <div key={f.id} style={{ ...innerCard, padding: '0.75rem' }} className="group hover:border-[#4a7fa5]/20 transition-colors">
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-sec)', fontWeight: 500, lineHeight: 1.4, marginBottom: '0.4rem' }}>{f.title}</p>
                      {f.ice_reasoning && (
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-ter)', lineHeight: 1.5, marginBottom: '0.6rem' }}>{f.ice_reasoning}</p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <IceBadge ice={f.ice} />
                          {f.ice_impact > 0 && (
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-ter)' }}>{f.ice_impact}/{f.ice_confidence}/{f.ice_ease}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <select
                            value={f.status}
                            onChange={e => moveStatus(f.id, e.target.value as Status)}
                            style={{ background: 'var(--input-bg)', color: 'var(--text-sec)', fontSize: '0.62rem', border: 'none', cursor: 'pointer', borderRadius: 4, padding: '0.15rem 0.25rem' }}
                          >
                            <option value="ideia">ideia</option>
                            <option value="aprovada">aprovada</option>
                            <option value="building">building</option>
                            <option value="done">done</option>
                          </select>
                          <button onClick={() => deleteFeature(f.id)} style={{ color: 'var(--text-ter)', fontSize: '1rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }} className="hover:text-red-400 transition-colors">×</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
