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

const STATUS_LABELS: Record<Status, string> = {
  ideia: 'IDEIA',
  aprovada: 'APROVADA',
  building: 'BUILDING',
  done: 'DONE',
};

const STATUS_COLORS: Record<Status, string> = {
  ideia: '#e5e5e5',
  aprovada: '#7aaa4a',
  building: '#60a5fa',
  done: '#34d399',
};

export default function PM() {
  const { token } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const byStatus = (s: Status) => features.filter((f) => f.status === s);

  // Carregar features do Supabase ao montar
  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`${PROXY}/api/hq/pm/features`, { headers: authHeaders });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Erro ao carregar');
        setFeatures(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar features');
      } finally {
        setFetching(false);
      }
    }
    load();
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
      if (!r.ok) throw new Error(data.error || 'Erro na análise');
      setFeatures((prev) => [data, ...prev]);
      setInput('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  async function moveStatus(id: string, status: Status) {
    setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
    await fetch(`${PROXY}/api/hq/pm/features/${id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status }),
    });
  }

  async function deleteFeature(id: string) {
    if (!confirm('Remover esta feature?')) return;
    setFeatures((prev) => prev.filter((f) => f.id !== id));
    await fetch(`${PROXY}/api/hq/pm/features/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
  }

  return (
    <div className="p-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">PM de Features</h1>
        <p className="mono text-white/30">ideias → ICE Score → backlog</p>
        <div className="flex gap-4 mt-3">
          {(['ideia', 'aprovada', 'building', 'done'] as Status[]).map((s) => (
            <span key={s} className="text-xs text-white/30">
              <span className="font-semibold" style={{ color: STATUS_COLORS[s] }}>
                {byStatus(s).length}
              </span>{' '}
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="bg-[#141414] border border-white/5 rounded-xl p-5 mb-8">
        <div className="mono text-white/40 mb-3">● nova ideia de feature</div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyze(); }}
          placeholder="Ex: quero que o usuário possa escolher o tom de voz antes de gerar o email..."
          rows={3}
          className="w-full bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none resize-none"
        />
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
          <span className="text-white/20 text-xs">⌘+Enter para analisar</span>
          <button
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="bg-[#7aaa4a] hover:bg-[#8dc055] disabled:opacity-40 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Analisando...' : 'Analisar →'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Kanban */}
      <div className="mono text-white/25 mb-3">backlog</div>

      {fetching ? (
        <div className="text-white/20 text-sm">Carregando...</div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {(['ideia', 'aprovada', 'building', 'done'] as Status[]).map((col) => (
            <div key={col} className="bg-[#141414] border border-white/5 rounded-xl p-4 min-h-[200px]">
              <div className="mono mb-3" style={{ color: STATUS_COLORS[col] }}>
                {STATUS_LABELS[col]}
                <span className="ml-2 text-white/20">{byStatus(col).length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {byStatus(col).length === 0 && (
                  <div className="text-white/15 text-xs text-center mt-6">vazio</div>
                )}
                {byStatus(col).map((f) => (
                  <div
                    key={f.id}
                    className="bg-[#1a1a1a] border border-white/5 rounded-lg p-3 group"
                  >
                    <div className="text-white/80 text-xs font-medium mb-1 leading-snug">
                      {f.title}
                    </div>
                    {f.ice_reasoning && (
                      <div className="text-white/30 text-[10px] mb-2 leading-snug">
                        {f.ice_reasoning}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-xs font-bold"
                          style={{ color: f.ice >= 8 ? '#7aaa4a' : f.ice >= 6 ? '#f59e0b' : '#ef4444' }}
                        >
                          ICE {f.ice}
                        </span>
                        {f.ice_impact && (
                          <span className="text-[9px] text-white/20 mono">
                            {f.ice_impact}/{f.ice_confidence}/{f.ice_ease}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <select
                          value={f.status}
                          onChange={(e) => moveStatus(f.id, e.target.value as Status)}
                          className="bg-transparent text-white/30 text-[10px] focus:outline-none cursor-pointer"
                        >
                          <option value="ideia">ideia</option>
                          <option value="aprovada">aprovada</option>
                          <option value="building">building</option>
                          <option value="done">done</option>
                        </select>
                        <button
                          onClick={() => deleteFeature(f.id)}
                          className="text-white/15 hover:text-red-400 text-[10px] transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
