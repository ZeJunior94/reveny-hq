import { useState } from 'react';

type Stage = 'prospect' | 'contato' | 'demo' | 'piloto' | 'cliente';

interface Lead {
  id: string;
  name: string;
  company: string;
  stage: Stage;
  notes: string;
  follow_up?: string;
  mrr_est?: number;
  created_at: string;
}

const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: 'prospect', label: 'PROSPECT', color: '#e5e5e5' },
  { key: 'contato',  label: 'CONTATO',  color: '#60a5fa' },
  { key: 'demo',     label: 'DEMO',     color: '#f59e0b' },
  { key: 'piloto',   label: 'PILOTO',   color: '#a78bfa' },
  { key: 'cliente',  label: 'CLIENTE',  color: '#7aaa4a' },
];

export default function Pipeline() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);

  const byStage = (s: Stage) => leads.filter((l) => l.stage === s);
  const totalMrr = leads.filter((l) => l.stage === 'cliente').reduce((acc, l) => acc + (l.mrr_est ?? 0), 0);
  const followUps = leads.filter((l) => l.follow_up).length;

  async function handleAdd() {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      // TODO: chamar /api/hq/pipeline/parse para Claude estruturar o lead
      const lead: Lead = {
        id: Date.now().toString(),
        name: 'Lead',
        company: input.trim(),
        stage: 'prospect',
        notes: input.trim(),
        created_at: new Date().toISOString(),
      };
      setLeads((prev) => [lead, ...prev]);
      setInput('');
    } finally {
      setLoading(false);
    }
  }

  function moveStage(id: string, stage: Stage) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage } : l)));
  }

  return (
    <div className="p-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Pipeline Comercial</h1>
        <p className="mono text-white/30">CRM em linguagem natural</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'LEADS',      value: leads.length },
          { label: 'CLIENTES',   value: byStage('cliente').length },
          { label: 'FOLLOW-UPS', value: followUps },
          { label: 'MRR EST.',   value: `R$${totalMrr.toLocaleString('pt-BR')}`, color: '#7aaa4a' },
        ].map((s) => (
          <div key={s.label} className="bg-[#141414] border border-white/5 rounded-xl p-4">
            <div
              className="text-xl font-bold mb-1"
              style={{ color: s.color ?? 'white' }}
            >
              {s.value}
            </div>
            <div className="mono text-white/30">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="bg-[#141414] border border-white/5 rounded-xl p-5 mb-8">
        <div className="mono text-[#f59e0b]/60 mb-3">● novo lead ou atualização</div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd(); }}
          placeholder="Ex: Falei com João da Loja XYZ hoje, e-commerce de moda, interessado no Pro, follow-up em 3 dias..."
          rows={3}
          className="w-full bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none resize-none"
        />
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
          <span className="text-white/20 text-xs">descreva em linguagem natural</span>
          <button
            onClick={handleAdd}
            disabled={loading || !input.trim()}
            className="bg-[#f59e0b] hover:bg-[#fbbf24] disabled:opacity-40 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Adicionando...' : 'Adicionar →'}
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="mono text-white/25 mb-3">pipeline</div>
      <div className="grid grid-cols-5 gap-3">
        {STAGES.map((col) => (
          <div key={col.key} className="bg-[#141414] border border-white/5 rounded-xl p-3 min-h-[200px]">
            <div className="mono mb-3 flex items-center justify-between">
              <span style={{ color: col.color }}>{col.label}</span>
              <span className="text-white/20">{byStage(col.key).length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {byStage(col.key).length === 0 && (
                <div className="text-white/15 text-xs text-center mt-6">vazio</div>
              )}
              {byStage(col.key).map((l) => (
                <div
                  key={l.id}
                  className="bg-[#1a1a1a] border border-white/5 rounded-lg p-3"
                >
                  <div className="text-white/80 text-xs font-medium mb-1">{l.company}</div>
                  <div className="text-white/30 text-[10px] leading-snug mb-2 line-clamp-2">
                    {l.notes}
                  </div>
                  <select
                    value={l.stage}
                    onChange={(e) => moveStage(l.id, e.target.value as Stage)}
                    className="bg-transparent text-white/25 text-[10px] focus:outline-none cursor-pointer w-full"
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label.toLowerCase()}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
