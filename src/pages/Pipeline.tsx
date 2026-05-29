import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined) ||
  'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

type Stage = 'prospect' | 'contato' | 'demo' | 'piloto' | 'cliente';

interface Lead {
  id: string;
  name: string | null;
  company: string;
  stage: Stage;
  notes: string;
  follow_up_at: string | null;
  mrr_est: number;
  raw_input: string;
  created_at: string;
}

const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: 'prospect', label: 'PROSPECT', color: '#9ca3af' },
  { key: 'contato',  label: 'CONTATO',  color: '#60a5fa' },
  { key: 'demo',     label: 'DEMO',     color: '#f59e0b' },
  { key: 'piloto',   label: 'PILOTO',   color: '#a78bfa' },
  { key: 'cliente',  label: 'CLIENTE',  color: '#7aaa4a' },
];

export default function Pipeline() {
  const { token } = useAuth();
  const [input, setInput]   = useState('');
  const [leads, setLeads]   = useState<Lead[]>([]);
  const [loading, setLoading]     = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const byStage = (s: Stage) => leads.filter(l => l.stage === s);
  const totalMrr = leads.filter(l => l.stage === 'cliente').reduce((a, l) => a + (l.mrr_est ?? 0), 0);
  const followUps = leads.filter(l => l.follow_up_at).length;

  // ── Carregar leads ──────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${PROXY}/api/hq/pipeline/leads`, { headers });
      if (!r.ok) throw new Error(await r.text());
      const { leads: data } = await r.json();
      setLeads(data ?? []);
    } catch (err) {
      console.error('[pipeline]', err);
    } finally {
      setLoadingPage(false);
    }
  }, [token]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // ── Adicionar lead ──────────────────────────────────────────────────────────
  async function handleAdd() {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const r = await fetch(`${PROXY}/api/hq/pipeline/parse`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: input }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao adicionar lead');
      setLeads(prev => [data.lead, ...prev]);
      setInput('');
    } catch (err) {
      console.error('[pipeline/add]', err);
    } finally {
      setLoading(false);
    }
  }

  // ── Mover stage ─────────────────────────────────────────────────────────────
  async function moveStage(id: string, stage: Stage) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l));
    await fetch(`${PROXY}/api/hq/pipeline/leads/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ stage }),
    });
  }

  // ── Deletar lead ─────────────────────────────────────────────────────────────
  async function deleteLead(id: string) {
    setDeletingId(id);
    try {
      await fetch(`${PROXY}/api/hq/pipeline/leads/${id}`, {
        method: 'DELETE',
        headers,
      });
      setLeads(prev => prev.filter(l => l.id !== id));
    } finally {
      setDeletingId(null);
    }
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
        ].map(s => (
          <div key={s.label} className="bg-[#141414] border border-white/5 rounded-xl p-4">
            <div className="text-xl font-bold mb-1" style={{ color: (s as { color?: string }).color ?? 'white' }}>
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
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd(); }}
          placeholder="Ex: Falei com João da Loja XYZ hoje, e-commerce de moda, interessado no Pro, follow-up em 3 dias..."
          rows={3}
          className="w-full bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none resize-none"
        />
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
          <span className="text-white/20 text-xs">⌘+Enter para adicionar · Claude estrutura automaticamente</span>
          <button
            onClick={handleAdd}
            disabled={loading || !input.trim()}
            className="bg-[#f59e0b] hover:bg-[#fbbf24] disabled:opacity-40 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Processando...' : 'Adicionar →'}
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="mono text-white/25 mb-3">pipeline</div>

      {loadingPage ? (
        <div className="flex items-center gap-2 text-white/30 text-sm">
          <div className="w-4 h-4 border border-white/20 border-t-white/60 rounded-full animate-spin" />
          carregando leads...
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {STAGES.map(col => (
            <div key={col.key} className="bg-[#141414] border border-white/5 rounded-xl p-3 min-h-[220px]">
              <div className="mono mb-3 flex items-center justify-between">
                <span style={{ color: col.color }}>{col.label}</span>
                <span className="text-white/20">{byStage(col.key).length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {byStage(col.key).length === 0 && (
                  <div className="text-white/15 text-xs text-center mt-8">vazio</div>
                )}
                {byStage(col.key).map(l => (
                  <div key={l.id} className="bg-[#1a1a1a] border border-white/5 rounded-lg p-3 group">
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="text-white/80 text-xs font-medium leading-snug flex-1">
                        {l.company}
                        {l.name && <span className="text-white/40"> · {l.name}</span>}
                      </div>
                      <button
                        onClick={() => deleteLead(l.id)}
                        disabled={deletingId === l.id}
                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 text-[10px] transition-all flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                    {l.notes && (
                      <div className="text-white/30 text-[10px] leading-snug mb-2 line-clamp-2">
                        {l.notes}
                      </div>
                    )}
                    {l.follow_up_at && (
                      <div className="mono text-[#f59e0b]/70 text-[9px] mb-2">
                        follow-up {new Date(l.follow_up_at + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    {l.mrr_est > 0 && (
                      <div className="mono text-[#7aaa4a]/70 text-[9px] mb-2">
                        R${l.mrr_est.toLocaleString('pt-BR')}/mês
                      </div>
                    )}
                    <select
                      value={l.stage}
                      onChange={e => moveStage(l.id, e.target.value as Stage)}
                      className="bg-transparent text-white/25 text-[10px] focus:outline-none cursor-pointer w-full mt-1"
                    >
                      {STAGES.map(s => (
                        <option key={s.key} value={s.key}>{s.label.toLowerCase()}</option>
                      ))}
                    </select>
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
