import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

interface PRD {
  id: string;
  feature: string;
  content: string;
  tasks: string[];
  created_at: string;
}

interface Feature {
  id: string;
  title: string;
  status: string;
}

function Skel({ className }: { className?: string }) {
  return <div className={`bg-white/5 rounded animate-pulse ${className ?? ''}`} />;
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
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${PROXY}/api/hq/builder/prd`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify({ feature: text }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro');
      setPrds(prev => [data, ...prev]);
      setSelected(data);
      setInput('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
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
    setPrds([]);
    setSelected(null);
    await Promise.all(ids.map(id =>
      fetch(`${PROXY}/api/hq/builder/prds/${id}`, { method: 'DELETE', headers: authHeaders })
    ));
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="p-10 max-w-5xl">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-2xl font-bold text-white mb-1">Builder de Features</h1>
        <p className="mono text-white/30 text-sm">PRD completo + tasks para Claude Code</p>
      </div>
      <div className="border-t border-white/5 mb-8" />

      {/* Features aprovadas no PM */}
      <div className="mono text-white/25 text-xs mb-3">FEATURES APROVADAS NO PM</div>
      {fetching ? (
        <div className="flex gap-2 mb-6">
          {[1, 2].map(i => <Skel key={i} className="h-8 w-40 rounded-lg" />)}
        </div>
      ) : approved.length === 0 ? (
        <p className="text-white/25 text-sm mb-6">Nenhuma feature aprovada no PM ainda.</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-6">
          {approved.map(f => (
            <button
              key={f.id}
              onClick={() => handleGenerate(f.title)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-lg border border-[#7aaa4a]/25 text-[#7aaa4a]/70 hover:border-[#7aaa4a]/50 hover:text-[#7aaa4a] hover:bg-[#7aaa4a]/8 transition-all disabled:opacity-40"
            >
              {f.title}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="bg-[#141414] border border-white/5 rounded-xl p-5 mb-6">
        <div className="mono text-[#60a5fa]/60 text-xs mb-3">● OU DESCREVA DIRETAMENTE</div>
        <div className="border-t border-white/5 mb-4" />
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
          placeholder="Ex: selector de tom de voz antes de gerar o email..."
          rows={3}
          className="w-full bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none resize-none leading-relaxed"
        />
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
          <span className="mono text-white/20 text-xs">⌘+Enter para gerar PRD</span>
          <button
            onClick={() => handleGenerate()}
            disabled={loading || !input.trim()}
            className="bg-[#60a5fa] hover:bg-[#7db8fb] disabled:opacity-40 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border border-black/30 border-t-black/80 rounded-full animate-spin" />
                Gerando...
              </span>
            ) : 'Gerar PRD →'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {/* PRDs list */}
      <div className="flex items-center justify-between mb-3">
        <div className="mono text-white/25 text-xs">PRDS GERADOS</div>
        <div className="flex items-center gap-3">
          {!fetching && <span className="mono text-white/18 text-xs">{prds.length} total</span>}
          {!fetching && prds.length > 0 && (
            <button
              onClick={clearAll}
              className="mono text-white/20 text-xs hover:text-white/45 border border-white/8 hover:border-white/15 px-2.5 py-1 rounded-lg transition-all"
            >
              limpar tudo
            </button>
          )}
        </div>
      </div>

      {fetching ? (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#141414] border border-white/5 rounded-xl p-4">
              <Skel className="h-3 w-full mb-2" />
              <Skel className="h-3 w-3/4 mb-4" />
              <Skel className="h-2.5 w-16" />
            </div>
          ))}
        </div>
      ) : prds.length === 0 ? (
        <div className="text-white/18 text-sm mb-6">Nenhum PRD gerado ainda.</div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {prds.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(selected?.id === p.id ? null : p)}
              className={`text-left rounded-xl p-4 transition-all group border ${
                selected?.id === p.id
                  ? 'bg-[#60a5fa]/5 border-[#60a5fa]/35'
                  : 'bg-[#141414] border-white/5 hover:border-white/12'
              }`}
            >
              <div className="text-white/80 text-xs font-medium mb-2 leading-snug line-clamp-2">{p.feature}</div>
              <div className="flex items-center justify-between">
                <div className="mono text-white/25 text-[10px]">{p.tasks?.length ?? 0} tasks</div>
                <button
                  onClick={e => { e.stopPropagation(); deletePrd(p.id); }}
                  className="text-white/10 hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition-all"
                >
                  ×
                </button>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* PRD Detail */}
      {selected && (
        <div className="bg-[#141414] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="mono text-[#60a5fa] text-xs">{selected.feature}</div>
            <button
              onClick={() => handleCopy(selected.content + '\n\nTasks:\n' + selected.tasks?.map((t, i) => `${i+1}. ${t}`).join('\n'))}
              className="text-white/25 text-xs hover:text-white/55 transition-colors"
            >
              {copied ? '✓ copiado' : 'copiar'}
            </button>
          </div>
          <pre className="text-white/55 text-xs leading-relaxed whitespace-pre-wrap font-mono">{selected.content}</pre>
          {selected.tasks && selected.tasks.length > 0 && (
            <div className="mt-5 pt-5 border-t border-white/5">
              <div className="mono text-white/25 text-xs mb-3">tasks para claude code</div>
              <div className="flex flex-col gap-2">
                {selected.tasks.map((t, i) => (
                  <div key={i} className="flex gap-2.5 text-xs text-white/50">
                    <span className="text-[#60a5fa]/40 font-mono flex-shrink-0 w-5">{String(i + 1).padStart(2, '0')}.</span>
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
