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

export default function Builder() {
  const { token } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [prds, setPrds] = useState<PRD[]>([]);
  const [selected, setSelected] = useState<PRD | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`${PROXY}/api/hq/builder/prds`, { headers: authHeaders });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Erro ao carregar');
        setPrds(data);
        if (data.length > 0) setSelected(data[0]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar PRDs');
      } finally {
        setFetching(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${PROXY}/api/hq/builder/prd`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ feature: input.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro na geração');
      setPrds((prev) => [data, ...prev]);
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
    setPrds((prev) => prev.filter((p) => p.id !== id));
    if (selected?.id === id) setSelected(null);
    await fetch(`${PROXY}/api/hq/builder/prds/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="p-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Builder de Features</h1>
        <p className="mono text-white/30">PRD completo + tasks para Claude Code</p>
      </div>

      {/* Input */}
      <div className="bg-[#141414] border border-white/5 rounded-xl p-5 mb-6">
        <div className="mono text-white/40 mb-3">● descreva a feature</div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
          placeholder="Ex: selector de tom de voz antes de gerar o email..."
          rows={3}
          className="w-full bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none resize-none"
        />
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
          <span className="text-white/20 text-xs">⌘+Enter para gerar PRD</span>
          <button
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
            className="bg-[#60a5fa] hover:bg-[#7db8fb] disabled:opacity-40 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Gerando...' : 'Gerar PRD →'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* PRDs list */}
      <div className="flex items-center justify-between mb-3">
        <div className="mono text-white/25">prds gerados</div>
        <span className="mono text-white/20 text-xs">{prds.length} total</span>
      </div>

      {fetching ? (
        <div className="text-white/20 text-sm">Carregando...</div>
      ) : prds.length === 0 ? (
        <div className="text-white/20 text-sm">Nenhum PRD gerado ainda.</div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {prds.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(selected?.id === p.id ? null : p)}
              className={`text-left bg-[#141414] border rounded-xl p-4 transition-all group ${
                selected?.id === p.id
                  ? 'border-[#60a5fa]/40 bg-[#60a5fa]/5'
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              <div className="text-white/80 text-xs font-medium mb-2 leading-snug line-clamp-2">
                {p.feature}
              </div>
              <div className="flex items-center justify-between">
                <div className="mono text-white/25 text-[10px]">{p.tasks?.length ?? 0} tasks</div>
                <button
                  onClick={(e) => { e.stopPropagation(); deletePrd(p.id); }}
                  className="text-white/10 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all"
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
          <div className="flex items-center justify-between mb-4">
            <div className="mono text-[#60a5fa]">PRD — {selected.feature}</div>
            <button
              onClick={() => handleCopy(selected.content + '\n\nTasks:\n' + selected.tasks?.map((t, i) => `${i+1}. ${t}`).join('\n'))}
              className="text-white/25 text-xs hover:text-white/50 transition-colors"
            >
              {copied ? '✓ copiado' : 'copiar tudo'}
            </button>
          </div>
          <pre className="text-white/60 text-xs leading-relaxed whitespace-pre-wrap font-mono mb-4">
            {selected.content}
          </pre>
          {selected.tasks && selected.tasks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="mono text-white/25 mb-3">tasks para claude code</div>
              <div className="flex flex-col gap-1.5">
                {selected.tasks.map((t, i) => (
                  <div key={i} className="flex gap-2 text-xs text-white/50">
                    <span className="text-[#60a5fa]/50 font-mono flex-shrink-0">{String(i + 1).padStart(2, '0')}.</span>
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
