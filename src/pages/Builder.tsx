import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

interface PRD { id: string; feature: string; content: string; tasks: string[]; created_at: string; }
interface Feature { id: string; title: string; status: string; }

const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
const card = { background: 'rgba(17,30,48,.7)', border: '1px solid rgba(74,127,165,.12)', borderRadius: 8 };
const sectionLabel: React.CSSProperties = { fontSize: '0.62rem', fontWeight: 600, color: 'rgba(74,127,165,.6)', textTransform: 'uppercase', letterSpacing: '0.18em' };
const ACCENT = '#4a7fa5';

function Skel({ className }: { className?: string }) {
  return <div className={`rounded animate-pulse ${className ?? ''}`} style={{ background: 'rgba(74,127,165,.08)' }} />;
}

export default function Builder() {
  const { token } = useAuth();
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);
  const [prds, setPrds]           = useState<PRD[]>([]);
  const [approved, setApproved]   = useState<Feature[]>([]);
  const [selected, setSelected]   = useState<PRD | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      fetch(`${PROXY}/api/hq/builder/prds`, { headers: authHeaders }).then(r => r.json()),
      fetch(`${PROXY}/api/hq/pm/features`, { headers: authHeaders }).then(r => r.json()),
    ])
      .then(([prdsData, featData]) => {
        if (Array.isArray(prdsData)) { setPrds(prdsData); if (prdsData.length > 0) setSelected(prdsData[0]); }
        if (Array.isArray(featData)) setApproved(featData.filter((f: Feature) => f.status === 'aprovada'));
      })
      .catch(e => setError(e.message))
      .finally(() => setFetching(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate(featureText?: string) {
    const text = featureText ?? input.trim();
    if (!text || loading) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${PROXY}/api/hq/builder/prd`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify({ feature: text }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro');
      setPrds(prev => [data, ...prev]);
      setSelected(data);
      setInput('');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro'); }
    finally { setLoading(false); }
  }

  async function deletePrd(id: string) {
    if (!confirm('Remover este PRD?')) return;
    setPrds(prev => prev.filter(p => p.id !== id));
    if (selected?.id === id) setSelected(null);
    await fetch(`${PROXY}/api/hq/builder/prds/${id}`, { method: 'DELETE', headers: authHeaders });
  }

  async function clearAll() {
    if (!confirm('Remover todos os PRDs?')) return;
    const ids = prds.map(p => p.id);
    setPrds([]); setSelected(null);
    await Promise.all(ids.map(id => fetch(`${PROXY}/api/hq/builder/prds/${id}`, { method: 'DELETE', headers: authHeaders })));
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ ...jakarta, fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.04em', color: 'white', lineHeight: 1.1 }}>
          Builder de Features
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.3)', marginTop: '0.3rem' }}>
          PRD completo + tasks para Claude Code
        </p>
        <div style={{ marginTop: '1.5rem', borderBottom: '1px solid rgba(74,127,165,.1)' }} />
      </div>

      {/* Features aprovadas */}
      <div style={{ ...sectionLabel, marginBottom: '0.85rem' }}>Features aprovadas no PM</div>
      {fetching ? (
        <div className="flex gap-2 mb-6">{[1,2].map(i => <Skel key={i} className="h-8 w-40 rounded-lg" />)}</div>
      ) : approved.length === 0 ? (
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,.25)', marginBottom: '1.5rem' }}>Nenhuma feature aprovada no PM ainda.</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-6">
          {approved.map(f => (
            <button
              key={f.id}
              onClick={() => handleGenerate(f.title)}
              disabled={loading}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem', borderRadius: 6, border: '1px solid rgba(122,170,74,.25)', color: 'rgba(122,170,74,.7)', background: 'transparent', cursor: 'pointer', transition: 'all .15s' }}
              className="hover:border-[#7aaa4a]/50 hover:text-[#7aaa4a] hover:bg-[#7aaa4a]/8 disabled:opacity-40"
            >
              {f.title}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ ...card, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ ...sectionLabel, color: `${ACCENT}99`, marginBottom: '0.85rem' }}>● Ou descreva diretamente</div>
        <div style={{ borderBottom: '1px solid rgba(74,127,165,.08)', marginBottom: '1rem' }} />
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
          placeholder="Ex: selector de tom de voz antes de gerar o email..."
          rows={3}
          className="w-full bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none resize-none leading-relaxed"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(74,127,165,.08)' }}>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,.2)' }}>⌘+Enter para gerar PRD</span>
          <button
            onClick={() => handleGenerate()}
            disabled={loading || !input.trim()}
            style={{ background: ACCENT, color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '0.45rem 1rem', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: loading || !input.trim() ? 0.4 : 1 }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="w-3 h-3 border border-white/30 border-t-white/80 rounded-full animate-spin" />
                Gerando...
              </span>
            ) : 'Gerar PRD →'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 6, padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.82rem' }}>{error}</div>
      )}

      {/* PRDs list */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <span style={sectionLabel}>PRDs gerados</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!fetching && <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.18)' }}>{prds.length} total</span>}
          {!fetching && prds.length > 0 && (
            <button onClick={clearAll} style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.25)', background: 'transparent', border: '1px solid rgba(74,127,165,.1)', borderRadius: 6, padding: '0.25rem 0.65rem', cursor: 'pointer' }}>
              limpar tudo
            </button>
          )}
        </div>
      </div>

      {fetching ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {[1,2,3].map(i => (
            <div key={i} style={{ ...card, padding: '1rem' }}>
              <Skel className="h-3 w-full mb-2" /><Skel className="h-3 w-3/4 mb-4" /><Skel className="h-2.5 w-16" />
            </div>
          ))}
        </div>
      ) : prds.length === 0 ? (
        <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,.18)', marginBottom: '1.5rem' }}>Nenhum PRD gerado ainda.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {prds.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(selected?.id === p.id ? null : p)}
              className="text-left transition-all group"
              style={selected?.id === p.id
                ? { background: `rgba(74,127,165,.1)`, border: `1px solid rgba(74,127,165,.35)`, borderRadius: 8, padding: '1rem' }
                : { ...card, padding: '1rem' }
              }
            >
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,.8)', fontWeight: 500, marginBottom: '0.5rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {p.feature}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.25)' }}>{p.tasks?.length ?? 0} tasks</div>
                <button
                  onClick={e => { e.stopPropagation(); deletePrd(p.id); }}
                  style={{ color: 'rgba(255,255,255,.12)', fontSize: '1rem', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                >×</button>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* PRD Detail */}
      {selected && (
        <div style={{ ...card, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', color: ACCENT }}>{selected.feature}</div>
            <button
              onClick={() => handleCopy(selected.content + '\n\nTasks:\n' + selected.tasks?.map((t,i) => `${i+1}. ${t}`).join('\n'))}
              style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.3)', background: 'none', border: 'none', cursor: 'pointer' }}
              className="hover:text-white/60 transition-colors"
            >
              {copied ? '✓ copiado' : 'copiar'}
            </button>
          </div>
          <pre style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{selected.content}</pre>
          {selected.tasks && selected.tasks.length > 0 && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(74,127,165,.1)' }}>
              <div style={{ ...sectionLabel, marginBottom: '0.85rem' }}>Tasks para Claude Code</div>
              <div className="flex flex-col gap-2">
                {selected.tasks.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: '0.75rem', color: 'rgba(255,255,255,.5)' }}>
                    <span style={{ color: `${ACCENT}60`, fontFamily: 'monospace', flexShrink: 0, width: 20 }}>{String(i+1).padStart(2,'0')}.</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
