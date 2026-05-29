import { useState, useEffect, useCallback, useRef } from 'react';
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
  notes: string | null;
  follow_up_at: string | null;
  mrr_est: number;
  phone: string | null;
  contact_email: string | null;
  raw_input: string | null;
  created_at: string;
}

const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: 'prospect', label: 'PROSPECT', color: '#9ca3af' },
  { key: 'contato',  label: 'CONTATO',  color: '#60a5fa' },
  { key: 'demo',     label: 'DEMO',     color: '#f59e0b' },
  { key: 'piloto',   label: 'PILOTO',   color: '#a78bfa' },
  { key: 'cliente',  label: 'CLIENTE',  color: '#7aaa4a' },
];

// ── Painel de detalhes ────────────────────────────────────────────────────────
function LeadPanel({
  lead,
  onClose,
  onSave,
  onDelete,
}: {
  lead: Lead;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Lead>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [form, setForm] = useState<Partial<Lead>>({ ...lead });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fechar com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function set(field: keyof Lead, value: string | number | null) {
    setForm(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(lead.id, form);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remover "${lead.company}" do pipeline?`)) return;
    setDeleting(true);
    await onDelete(lead.id);
  }

  const stageColor = STAGES.find(s => s.key === form.stage)?.color ?? '#9ca3af';

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Painel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-[420px] bg-[#141414] border-l border-white/8 z-50 flex flex-col overflow-hidden"
        style={{ animation: 'slideIn 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span
              className="mono text-[10px] px-2 py-1 rounded"
              style={{ color: stageColor, background: `${stageColor}18` }}
            >
              {form.stage?.toUpperCase()}
            </span>
            <span className="text-white/40 text-xs">
              {new Date(lead.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Empresa */}
          <div>
            <label className="mono text-white/30 text-[10px] block mb-1.5">EMPRESA</label>
            <input
              value={form.company ?? ''}
              onChange={e => set('company', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/8 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 transition-colors"
              placeholder="Nome da empresa"
            />
          </div>

          {/* Nome do contato */}
          <div>
            <label className="mono text-white/30 text-[10px] block mb-1.5">CONTATO</label>
            <input
              value={form.name ?? ''}
              onChange={e => set('name', e.target.value || null)}
              className="w-full bg-[#1a1a1a] border border-white/8 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 transition-colors"
              placeholder="Nome da pessoa"
            />
          </div>

          {/* Telefone + Email lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mono text-white/30 text-[10px] block mb-1.5">TELEFONE</label>
              <input
                value={form.phone ?? ''}
                onChange={e => set('phone', e.target.value || null)}
                className="w-full bg-[#1a1a1a] border border-white/8 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 transition-colors"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="mono text-white/30 text-[10px] block mb-1.5">EMAIL</label>
              <input
                type="email"
                value={form.contact_email ?? ''}
                onChange={e => set('contact_email', e.target.value || null)}
                className="w-full bg-[#1a1a1a] border border-white/8 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 transition-colors"
                placeholder="contato@loja.com"
              />
            </div>
          </div>

          {/* Stage */}
          <div>
            <label className="mono text-white/30 text-[10px] block mb-2">ESTÁGIO</label>
            <div className="flex gap-2 flex-wrap">
              {STAGES.map(s => (
                <button
                  key={s.key}
                  onClick={() => set('stage', s.key)}
                  className="mono text-[10px] px-3 py-1.5 rounded-lg transition-all"
                  style={
                    form.stage === s.key
                      ? { color: s.color, background: `${s.color}22`, border: `1px solid ${s.color}50` }
                      : { color: '#ffffff40', background: 'transparent', border: '1px solid #ffffff10' }
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up + MRR lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mono text-white/30 text-[10px] block mb-1.5">FOLLOW-UP</label>
              <input
                type="date"
                value={form.follow_up_at ?? ''}
                onChange={e => set('follow_up_at', e.target.value || null)}
                className="w-full bg-[#1a1a1a] border border-white/8 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <div>
              <label className="mono text-white/30 text-[10px] block mb-1.5">MRR EST. (R$)</label>
              <input
                type="number"
                value={form.mrr_est ?? 0}
                onChange={e => set('mrr_est', Number(e.target.value))}
                className="w-full bg-[#1a1a1a] border border-white/8 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 transition-colors"
                placeholder="0"
                min={0}
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="mono text-white/30 text-[10px] block mb-1.5">OBSERVAÇÕES</label>
            <textarea
              value={form.notes ?? ''}
              onChange={e => set('notes', e.target.value || null)}
              rows={4}
              className="w-full bg-[#1a1a1a] border border-white/8 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 transition-colors resize-none"
              placeholder="Contexto, histórico, próximos passos..."
            />
          </div>

          {/* Input original */}
          {lead.raw_input && (
            <div>
              <label className="mono text-white/30 text-[10px] block mb-1.5">ENTRADA ORIGINAL</label>
              <p className="text-white/25 text-xs leading-relaxed bg-[#1a1a1a] rounded-lg px-3 py-2.5">
                {lead.raw_input}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-400/60 hover:text-red-400 text-xs transition-colors disabled:opacity-40"
          >
            {deleting ? 'Removendo...' : 'Remover lead'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="bg-[#f59e0b] hover:bg-[#fbbf24] disabled:opacity-40 text-black text-xs font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Salvando...' : dirty ? 'Salvar →' : 'Salvo ✓'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ── Pipeline principal ────────────────────────────────────────────────────────
export default function Pipeline() {
  const { token } = useAuth();
  const [input, setInput]         = useState('');
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [loading, setLoading]     = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const byStage   = (s: Stage) => leads.filter(l => l.stage === s);
  const totalMrr  = leads.filter(l => l.stage === 'cliente').reduce((a, l) => a + (l.mrr_est ?? 0), 0);
  const followUps = leads.filter(l => l.follow_up_at).length;

  const fetchLeads = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${PROXY}/api/hq/pipeline/leads`, { headers: authHeaders });
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

  async function handleAdd() {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const r = await fetch(`${PROXY}/api/hq/pipeline/parse`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ text: input }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setLeads(prev => [data.lead, ...prev]);
      setInput('');
    } catch (err) {
      console.error('[pipeline/add]', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(id: string, updates: Partial<Lead>) {
    const r = await fetch(`${PROXY}/api/hq/pipeline/leads/${id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(updates),
    });
    const data = await r.json();
    if (data.lead) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data.lead } : l));
      setSelectedLead(prev => prev?.id === id ? { ...prev, ...data.lead } : prev);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`${PROXY}/api/hq/pipeline/leads/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    setLeads(prev => prev.filter(l => l.id !== id));
    setSelectedLead(null);
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
          <span className="text-white/20 text-xs">⌘+Enter · Claude estrutura automaticamente</span>
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
                  <div
                    key={l.id}
                    onClick={() => setSelectedLead(l)}
                    className="bg-[#1a1a1a] border border-white/5 rounded-lg p-3 cursor-pointer hover:border-white/15 hover:bg-[#202020] transition-all"
                  >
                    <div className="text-white/80 text-xs font-medium leading-snug mb-1">
                      {l.company}
                    </div>
                    {l.name && (
                      <div className="text-white/35 text-[10px] mb-1">{l.name}</div>
                    )}
                    {l.notes && (
                      <div className="text-white/25 text-[10px] leading-snug line-clamp-2 mb-2">
                        {l.notes}
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {l.follow_up_at && (
                        <span className="mono text-[#f59e0b]/60 text-[9px]">
                          📅 {new Date(l.follow_up_at + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {l.mrr_est > 0 && (
                        <span className="mono text-[#7aaa4a]/60 text-[9px]">
                          R${l.mrr_est.toLocaleString('pt-BR')}
                        </span>
                      )}
                      {l.phone && (
                        <span className="mono text-white/25 text-[9px]">📞</span>
                      )}
                      {l.contact_email && (
                        <span className="mono text-white/25 text-[9px]">✉️</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Painel de detalhes */}
      {selectedLead && (
        <LeadPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
