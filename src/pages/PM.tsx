import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

type Status = 'ideia' | 'aprovada' | 'building' | 'done';

interface Feature {
  id: string;
  title: string;
  description: string;
  ice: number;
  ice_impact: number;
  ice_confidence: number;
  ice_ease: number;
  ice_reasoning: string;
  status: Status;
  notes?: string;
  created_at: string;
}

const COLS: { key: Status; label: string; color: string }[] = [
  { key: 'ideia',    label: 'IDEIA',    color: '#e5e5e5' },
  { key: 'aprovada', label: 'APROVADA', color: '#7aaa4a' },
  { key: 'building', label: 'BUILDING', color: '#60a5fa' },
  { key: 'done',     label: 'DONE',     color: '#34d399' },
];

function Skel({ className }: { className?: string }) {
  return <div className={`bg-white/5 rounded-lg animate-pulse ${className ?? ''}`} />;
}

function IceBadge({ ice }: { ice: number }) {
  const color = ice >= 8 ? '#7aaa4a' : ice >= 6 ? '#f59e0b' : '#ef4444';
  return (
    <span className="mono text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color, background: `${color}18` }}>
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
  const byStatus = (s: Status) => features.filter((f) => f.status === s);

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
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${PROXY}/api/hq/pm/analyze`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ idea: input.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro');
      setFeatures(prev => [data, ...prev]);
      setInput('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="p-10">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">PM de Features</h1>
          <p className="mono text-white/30 text-sm">ideias → ICE Score → backlog</p>
        </div>
        <div className="flex gap-4">
          {COLS.map((c) => (
            <span key={c.key} className="text-xs text-white/30">
              <span className="font-bold" style={{ color: c.color }}>{byStatus(c.key).length}</span>
              {' '}{c.key}
            </span>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="bg-[#141414] border border-white/5 rounded-xl p-5 mb-8">
        <div className="mono text-white/35 text-xs mb-3">● nova ideia de feature</div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyze(); }}
          placeholder="Ex: quero que o usuário possa escolher o tom de voz antes de gerar o email..."
          rows={3}
          className="w-full bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none resize-none leading-relaxed"
        />
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
          <span className="text-white/20 text-xs">⌘+Enter para analisar</span>
          <button
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="bg-[#7aaa4a] hover:bg-[#8dc055] disabled:opacity-40 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border border-black/30 border-t-black/80 rounded-full animate-spin" />
                Analisando...
              </span>
            ) : 'Analisar →'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Kanban — overflow horizontal em telas pequenas */}
      <div className="mono text-white/25 text-xs mb-3">backlog</div>
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-cols-4 gap-3" style={{ minWidth: 720 }}>
          {COLS.map((col) => (
            <div key={col.key} className="bg-[#141414] border border-white/5 rounded-xl p-4 min-h-[260px]">
              {/* Col header */}
              <div className="flex items-center justify-between mb-4">
                <span className="mono text-[11px] font-semibold" style={{ color: col.color }}>
                  {col.label}
                </span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mono"
                  style={{ color: col.color, background: `${col.color}18` }}
                >
                  {byStatus(col.key).length}
                </span>
              </div>

              {/* Skeleton */}
              {fetching && col.key === 'ideia' && (
                <div className="flex flex-col gap-2">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-[#1a1a1a] rounded-lg p-3 border border-white/5">
                      <Skel className="h-3 w-full mb-2" />
                      <Skel className="h-2.5 w-2/3 mb-3" />
                      <Skel className="h-5 w-14 rounded-full" />
                    </div>
                  ))}
                </div>
              )}
              {fetching && col.key !== 'ideia' && (
                <div className="text-white/10 text-xs text-center mt-10">—</div>
              )}

              {/* Cards */}
              {!fetching && (
                <div className="flex flex-col gap-2">
                  {byStatus(col.key).length === 0 && (
                    <div className="text-white/12 text-xs text-center mt-10">vazio</div>
                  )}
                  {byStatus(col.key).map(f => (
                    <div
                      key={f.id}
                      className="bg-[#1a1a1a] border border-white/5 rounded-lg p-3 group hover:border-white/10 transition-colors"
                    >
                      <p className="text-white/80 text-xs font-medium leading-snug mb-1.5">
                        {f.title}
                      </p>
                      {f.ice_reasoning && (
                        <p className="text-white/28 text-[10px] leading-snug mb-2.5">
                          {f.ice_reasoning}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <IceBadge ice={f.ice} />
                          {f.ice_impact && (
                            <span className="text-[9px] text-white/20 mono">
                              {f.ice_impact}/{f.ice_confidence}/{f.ice_ease}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <select
                            value={f.status}
                            onChange={e => moveStatus(f.id, e.target.value as Status)}
                            className="bg-[#111] text-white/30 text-[10px] focus:outline-none cursor-pointer rounded px-1"
                          >
                            <option value="ideia">ideia</option>
                            <option value="aprovada">aprovada</option>
                            <option value="building">building</option>
                            <option value="done">done</option>
                          </select>
                          <button
                            onClick={() => deleteFeature(f.id)}
                            className="text-white/15 hover:text-red-400 text-sm transition-colors leading-none px-1"
                          >
                            ×
                          </button>
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
