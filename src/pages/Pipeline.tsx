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

function Skel({ className }: { className?: string }) {
  return <div className={`bg-white/5 rounded animate-pulse ${className ?? ''}`} />;
}

const INPUT_CLS =
  'w-full bg-[#1e1e1e] border border-white/8 rounded-lg px-3 py-2.5 text-white/85 text-sm focus:outline-none focus:border-white/25 focus:bg-[#232323] transition-all placeholder-white/20';

// ── Painel de detalhes ────────────────────────────────────────────────────────
function LeadPanel({
  lead, onClose, onSave, onDelete,
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function set(field: keyof Lead, value: string | number | null) {
    setForm(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try { await onSave(lead.id, form); setDirty(false); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm(`Remover "${lead.company}" do pipeline?`)) return;
    setDeleting(true);
    await onDelete(lead.id);
  }

  const stageColor = STAGES.find(s => s.key === form.stage)?.color ?? '#9ca3af';

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-[420px] bg-[#131313] border-l border-white/8 z-50 flex flex-col"
        style={{ animation: 'slideIn 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span
              className="mono text-[10px] font-semibold px-2 py-1 rounded-md"
              style={{ color: stageColor, background: `${stageColor}18` }}
            >
              {form.stage?.toUpperCase()}
            </span>
            <span className="text-white/30 text-xs">
              {new Date(lead.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white/70 transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5">
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="mono text-white/25 text-[10px] block mb-1.5">EMPRESA</label>
            <input value={form.company ?? ''} onChange={e => set('company', e.target.value)} className={INPUT_CLS} placeholder="Nome da empresa" />
          </div>
          <div>
            <label className="mono text-white/25 text-[10px] block mb-1.5">CONTATO</label>
            <input value={form.name ?? ''} onChange={e => set('name', e.target.value || null)} className={INPUT_CLS} placeholder="Nome da pessoa" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mono text-white/25 text-[10px] block mb-1.5">TELEFONE</label>
              <input value={form.phone ?? ''} onChange={e => set('phone', e.target.value || null)} className={INPUT_CLS} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label className="mono text-white/25 text-[10px] block mb-1.5">EMAIL</label>
              <input type="email" value={form.contact_email ?? ''} onChange={e => set('contact_email', e.target.value || null)} className={INPUT_CLS} placeholder="contato@loja.com" />
            </div>
          </div>

          {/* Stage pills */}
          <div>
            <label className="mono text-white/25 text-[10px] block mb-2">ESTÁGIO</label>
            <div className="flex gap-1.5 flex-wrap">
              {STAGES.map(s => (
                <button
                  key={s.key}
                  onClick={() => set('stage', s.key)}
                  className="mono text-[10px] px-2.5 py-1.5 rounded-lg transition-all"
                  style={
                    form.stage === s.key
                      ? { color: s.color, background: `${s.color}22`, border: `1px solid ${s.color}50` }
                      : { color: '#ffffff35', background: 'transparent', border: '1px solid #ffffff0e' }
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mono text-white/25 text-[10px] block mb-1.5">FOLLOW-UP</label>
              <input type="date" value={form.follow_up_at ?? ''} onChange={e => set('follow_up_at', e.target.value || null)} className={INPUT_CLS} />
            </div>
            <div>
              <label className="mono text-white/25 text-[10px] block mb-1.5">MRR EST. (R$)</label>
              <input type="number" value={form.mrr_est ?? 0} onChange={e => set('mrr_est', Number(e.target.value))} className={INPUT_CLS} placeholder="0" min={0} />
            </div>
          </div>

          <div>
            <label className="mono text-white/25 text-[10px] block mb-1.5">OBSERVAÇÕES</label>
            <textarea
              value={form.notes ?? ''}
              onChange={e => set('notes', e.target.value || null)}
              rows={4}
              className={`${INPUT_CLS} resize-none`}
              placeholder="Contexto, histórico, próximos passos..."
            />
          </div>

          {lead.raw_input && (
            <div>
              <label className="mono text-white/25 text-[10px] block mb-1.5">ENTRADA ORIGINAL</label>
              <p className="text-white/20 text-xs leading-relaxed bg-[#1a1a1a] border border-white/5 rounded-lg px-3 py-2.5">
                {lead.raw_input}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
          <button onClick={handleDelete} disabled={deleting} className="text-red-400/50 hover:text-red-400 text-xs transition-colors disabled:opacity-40">
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
        @keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
      `}</style>
    </>
  );
}

// ── Pipeline principal ────────────────────────────────────────────────────────
export default function Pipeline() {
  const { token } = useAuth();
  const [input, setInput]     = useState('');
  const [leads, setLeads]     = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const byStage  = (s: Stage) => leads.filter(l => l.stage === s);
  const totalMrr = leads.filter(l => l.stage === 'cliente').reduce((a, l) => a + (l.mrr_est ?? 0), 0);
  const followUps = leads.filter(l => l.follow_up_at).length;

  const fetchLeads = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${PROXY}/api/hq/pipeline/leads`, { headers: authHeaders });
      if (!r.ok) throw new Error(await r.text());
      const { leads: data } = await r.json();
      setLeads(data ?? []);
    } catch (err) { console.error('[pipeline]', err); }
    finally { setFetching(false); }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  async function handleAdd() {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const r = await fetch(`${PROXY}/api/hq/pipeline/parse`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify({ text: input }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setLeads(prev => [data.lead, ...prev]);
      setInput('');
    } catch (err) { console.error('[pipeline/add]', err); }
    finally { setLoading(false); }
  }

  async function handleSave(id: string, updates: Partial<Lead>) {
    const r = await fetch(`${PROXY}/api/hq/pipeline/leads/${id}`, {
      method: 'PATCH', headers: authHeaders, body: JSON.stringify(updates),
    });
    const data = await r.json();
    if (data.lead) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data.lead } : l));
      setSelectedLead(prev => prev?.id === id ? { ...prev, ...data.lead } : prev);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`${PROXY}/api/hq/pipeline/leads/${id}`, { method: 'DELETE', headers: authHeaders });
    setLeads(prev => prev.filter(l => l.id !== id));
    setSelectedLead(null);
  }

  return (
    <div className="p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Pipeline Comercial</h1>
        <p className="mono text-white/30 text-sm">CRM em linguagem natural</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'LEADS',      value: leads.length,                                    color: '#e5e5e5' },
          { label: 'CLIENTES',   value: byStage('cliente').length,                       color: '#7aaa4a' },
          { label: 'FOLLOW-UPS', value: followUps,                                       color: '#f59e0b' },
          { label: 'MRR EST.',   value: `R$${totalMrr.toLocaleString('pt-BR')}`,        color: '#34d399' },
        ].map(s => (
          <div key={s.label} className="bg-[#141414] border border-white/5 rounded-xl p-4">
            {fetching ? (
              <><Skel className="h-6 w-8 mb-2" /><Skel className="h-2.5 w-16" /></>
            ) : (
              <>
                <div className="text-xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                <div className="mono text-white/28 text-[10px]">{s.label}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="bg-[#141414] border border-white/5 rounded-xl p-5 mb-8">
        <div className="mono text-[#f59e0b]/50 text-xs mb-3">● novo lead ou atualização</div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd(); }}
          placeholder="Ex: Falei com João da Loja XYZ hoje, e-commerce de moda, interessado no Pro, follow-up em 3 dias..."
          rows={3}
          className="w-full bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none resize-none leading-relaxed"
        />
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
          <span className="text-white/20 text-xs">⌘+Enter · Claude estrutura automaticamente</span>
          <button
            onClick={handleAdd}
            disabled={loading || !input.trim()}
            className="bg-[#f59e0b] hover:bg-[#fbbf24] disabled:opacity-40 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border border-black/30 border-t-black/80 rounded-full animate-spin" />
                Processando...
              </span>
            ) : 'Adicionar →'}
          </button>
        </div>
      </div>

      {/* Kanban — overflow horizontal em telas pequenas */}
      <div className="mono text-white/25 text-xs mb-3">pipeline</div>
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-cols-5 gap-3" style={{ minWidth: 800 }}>
          {STAGES.map(col => (
            <div key={col.key} className="bg-[#141414] border border-white/5 rounded-xl p-3 min-h-[240px]">
              {/* Col header */}
              <div className="flex items-center justify-between mb-3">
                <span className="mono text-[10px] font-semibold" style={{ color: col.color }}>
                  {col.label}
                </span>
                <span
                  className="text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full mono"
                  style={{ color: col.color, background: `${col.color}18` }}
                >
                  {byStage(col.key).length}
                </span>
              </div>

              {/* Skeleton */}
              {fetching && (
                <div className="flex flex-col gap-2">
                  {col.key === 'prospect' && [1,2].map(i => (
                    <div key={i} className="bg-[#1a1a1a] rounded-lg p-3 border border-white/5">
                      <Skel className="h-3 w-full mb-2" />
                      <Skel className="h-2 w-2/3 mb-2" />
                      <Skel className="h-2 w-1/2" />
                    </div>
                  ))}
                </div>
              )}

              {/* Cards */}
              {!fetching && (
                <div className="flex flex-col gap-2">
                  {byStage(col.key).length === 0 && (
                    <div className="text-white/10 text-xs text-center mt-10">vazio</div>
                  )}
                  {byStage(col.key).map(l => (
                    <div
                      key={l.id}
                      onClick={() => setSelectedLead(l)}
                      className="bg-[#1a1a1a] border border-white/5 rounded-lg p-3 cursor-pointer hover:border-white/15 hover:bg-[#1e1e1e] transition-all"
                    >
                      <div className="text-white/80 text-xs font-medium leading-snug mb-0.5">{l.company}</div>
                      {l.name && <div className="text-white/30 text-[10px] mb-1.5">{l.name}</div>}
                      {l.notes && (
                        <div className="text-white/22 text-[10px] leading-snug line-clamp-2 mb-2">{l.notes}</div>
                      )}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {l.follow_up_at && (
                          <span className="mono text-[#f59e0b]/55 text-[9px]">
                            📅 {new Date(l.follow_up_at + 'T00:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })}
                          </span>
                        )}
                        {l.mrr_est > 0 && (
                          <span className="mono text-[#7aaa4a]/55 text-[9px]">R${l.mrr_est.toLocaleString('pt-BR')}</span>
                        )}
                        {l.phone && <span className="text-[9px] opacity-30">📞</span>}
                        {l.contact_email && <span className="text-[9px] opacity-30">✉️</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

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
