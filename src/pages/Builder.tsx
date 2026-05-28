import { useState } from 'react';

interface PRD {
  id: string;
  feature: string;
  content: string;
  tasks: string[];
  created_at: string;
}

export default function Builder() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [prds, setPrds] = useState<PRD[]>([]);
  const [selected, setSelected] = useState<PRD | null>(null);

  async function handleGenerate() {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      // TODO: chamar /api/hq/builder/prd
      const prd: PRD = {
        id: Date.now().toString(),
        feature: input.trim(),
        content: `# PRD — ${input.trim()}\n\n_Claude irá gerar o PRD completo aqui quando a API estiver conectada._`,
        tasks: ['Conectar Claude API', 'Implementar endpoint /api/hq/builder/prd'],
        created_at: new Date().toISOString(),
      };
      setPrds((prev) => [prd, ...prev]);
      setSelected(prd);
      setInput('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Builder de Features</h1>
        <p className="mono text-white/30">PRD completo + tasks para Claude Code</p>
      </div>

      {/* Input */}
      <div className="bg-[#141414] border border-white/5 rounded-xl p-5 mb-6">
        <div className="mono text-white/40 mb-3">● descreva diretamente</div>
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

      {/* PRDs */}
      <div className="flex items-center justify-between mb-3">
        <div className="mono text-white/25">prds gerados</div>
        {prds.length > 0 && (
          <button
            onClick={() => { setPrds([]); setSelected(null); }}
            className="text-white/20 text-xs hover:text-white/40 transition-colors"
          >
            limpar tudo
          </button>
        )}
      </div>

      {prds.length === 0 ? (
        <div className="text-white/20 text-sm">Nenhum PRD gerado ainda.</div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {prds.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(selected?.id === p.id ? null : p)}
              className={`text-left bg-[#141414] border rounded-xl p-4 transition-all ${
                selected?.id === p.id
                  ? 'border-[#60a5fa]/40 bg-[#60a5fa]/5'
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              <div className="text-white/80 text-xs font-medium mb-2 leading-snug line-clamp-2">
                {p.feature}
              </div>
              <div className="mono text-white/25">{p.tasks.length} tasks</div>
            </button>
          ))}
        </div>
      )}

      {/* PRD Detail */}
      {selected && (
        <div className="mt-6 bg-[#141414] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="mono text-[#60a5fa]">PRD</div>
            <button
              onClick={() => navigator.clipboard.writeText(selected.content)}
              className="text-white/25 text-xs hover:text-white/50 transition-colors"
            >
              copiar
            </button>
          </div>
          <pre className="text-white/60 text-xs leading-relaxed whitespace-pre-wrap font-mono">
            {selected.content}
          </pre>
          {selected.tasks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="mono text-white/25 mb-2">tasks para claude code</div>
              {selected.tasks.map((t, i) => (
                <div key={i} className="flex gap-2 text-xs text-white/50 mb-1">
                  <span className="text-white/20">{i + 1}.</span>
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
