import { useState } from 'react';

type Status = 'ideia' | 'aprovada' | 'building' | 'done';

interface Feature {
  id: string;
  title: string;
  description: string;
  ice: number;
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
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [features, setFeatures] = useState<Feature[]>([]);

  const byStatus = (s: Status) => features.filter((f) => f.status === s);

  async function handleAnalyze() {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      // TODO: chamar /api/hq/pm/analyze
      // Por ora: cria feature com ICE mock
      const feature: Feature = {
        id: Date.now().toString(),
        title: input.trim(),
        description: input.trim(),
        ice: Math.floor(Math.random() * 40) + 60,
        status: 'ideia',
        created_at: new Date().toISOString(),
      };
      setFeatures((prev) => [feature, ...prev]);
      setInput('');
    } finally {
      setLoading(false);
    }
  }

  function moveStatus(id: string, status: Status) {
    setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
  }

  return (
    <div className="p-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">PM de Features</h1>
        <p className="mono text-white/30">ideias → ICE Score → backlog</p>
        <div className="flex gap-4 mt-3">
          {(['ideia','aprovada','building','done'] as Status[]).map((s) => (
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

      {/* Kanban */}
      <div className="mono text-white/25 mb-3">backlog</div>
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
                  <div className="text-white/80 text-xs font-medium mb-2 leading-snug">
                    {f.title}
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-bold"
                      style={{ color: f.ice >= 80 ? '#7aaa4a' : f.ice >= 60 ? '#f59e0b' : '#ef4444' }}
                    >
                      ICE {f.ice}
                    </span>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
