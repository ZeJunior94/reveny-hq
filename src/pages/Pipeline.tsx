import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined) ||
  'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

type Stage = 'prospect' | 'contato' | 'demo' | 'piloto' | 'cliente';

interface Lead {
  id: string; name: string | null; company: string; stage: Stage;
  notes: string | null; follow_up_at: string | null; mrr_est: number;
  phone: string | null; contact_email: string | null; raw_input: string | null; created_at: string;
}

const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: 'prospect', label: 'Prospect', color: '#9ca3af' },
  { key: 'contato',  label: 'Contato',  color: '#4a7fa5' },
  { key: 'demo',     label: 'Demo',     color: '#f59e0b' },
  { key: 'piloto',   label: 'Piloto',   color: '#a78bfa' },
  { key: 'cliente',  label: 'Cliente',  color: '#7aaa4a' },
];

const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
const card = { background: 'rgba(17,30,48,.7)', border: '1px solid rgba(74,127,165,.12)', borderRadius: 8 };
const innerCard = { background: 'rgba(17,30,48,.5)', border: '1px solid rgba(74,127,165,.08)', borderRadius: 6 };
const sectionLabel: React.CSSProperties = { fontSize: '0.62rem', fontWeight: 600, color: 'rgba(74,127,165,.6)', textTransform: 'uppercase', letterSpacing: '0.18em' };
const INPUT_CLS = 'w-full rounded-lg px-3 py-2.5 text-white/85 text-sm focus:outline-none transition-all placeholder-white/25 leading-relaxed';

function Skel({ className }: { className?: string }) {
  return <div className={`rounded animate-pulse ${className ?? ''}`} style={{ background: 'rgba(74,127,165,.08)' }} />;
}

function LeadPanel({ lead, onClose, onSave, onDelete }: {
  lead: Lead; onClose: () => void;
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
  const inputStyle = { background: 'rgba(17,30,48,.8)', border: '1px solid rgba(74,127,165,.15)', color: 'rgba(255,255,255,.85)' };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-[420px] z-50 flex flex-col"
        style={{ background: '#111e30', borderLeft: '1px solid rgba(74,127,165,.15)', animation: 'slideIn 0.2s ease-out' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(74,127,165,.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 4, color: stageColor, background: `${stageColor}18` }}>
              {form.stage?.toUpperCase()}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,.3)' }}>
              {new Date(lead.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,.3)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }} className="hover:text-white/70 hover:bg-white/5 transition-all">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { key: 'company', label: 'Empresa', placeholder: 'Nome da empresa', type: 'text' },
            { key: 'name',    label: 'Contato',  placeholder: 'Nome da pessoa',   type: 'text' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ ...sectionLabel, display: 'block', marginBottom: '0.4rem' }}>{f.label}</label>
              <input value={(form as Record<string, string | null>)[f.key] ?? ''} onChange={e => set(f.key as keyof Lead, e.target.value || null)} className={INPUT_CLS} style={inputStyle} placeholder={f.placeholder} />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ ...sectionLabel, display: 'block', marginBottom: '0.4rem' }}>Telefone</label>
              <input value={form.phone ?? ''} onChange={e => set('phone', e.target.value || null)} className={INPUT_CLS} style={inputStyle} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label style={{ ...sectionLabel, display: 'block', marginBottom: '0.4rem' }}>Email</label>
              <input type="email" value={form.contact_email ?? ''} onChange={e => set('contact_email', e.target.value || null)} className={INPUT_CLS} style={inputStyle} placeholder="contato@loja.com" />
            </div>
          </div>

          <div>
            <label style={{ ...sectionLabel, display: 'block', marginBottom: '0.6rem' }}>Estágio</label>
            <div className="flex gap-1.5 flex-wrap">
              {STAGES.map(s => (
                <button key={s.key} onClick={() => set('stage', s.key)} style={
                  form.stage === s.key
                    ? { color: s.color, background: `${s.color}22`, border: `1px solid ${s.color}50`, fontSize: '0.68rem', padding: '0.3rem 0.7rem', borderRadius: 6, cursor: 'pointer' }
                    : { color: 'rgba(255,255,255,.3)', background: 'transparent', border: '1px solid rgba(74,127,165,.1)', fontSize: '0.68rem', padding: '0.3rem 0.7rem', borderRadius: 6, cursor: 'pointer' }
                }>{s.label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ ...sectionLabel, display: 'block', marginBottom: '0.4rem' }}>Follow-up</label>
              <input type="date" value={form.follow_up_at ?? ''} onChange={e => set('follow_up_at', e.target.value || null)} className={INPUT_CLS} style={inputStyle} />
            </div>
            <div>
              <label style={{ ...sectionLabel, display: 'block', marginBottom: '0.4rem' }}>MRR Est. (R$)</label>
              <input type="number" value={form.mrr_est ?? 0} onChange={e => set('mrr_est', Number(e.target.value))} className={INPUT_CLS} style={inputStyle} placeholder="0" min={0} />
            </div>
          </div>

          <div>
            <label style={{ ...sectionLabel, display: 'block', marginBottom: '0.4rem' }}>Observações</label>
            <textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} rows={4} className={`${INPUT_CLS} resize-none`} style={inputStyle} placeholder="Contexto, histórico, próximos passos..." />
          </div>

          {lead.raw_input && (
            <div>
              <label style={{ ...sectionLabel, display: 'block', marginBottom: '0.4rem' }}>Entrada original</label>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.2)', lineHeight: 1.6, background: 'rgba(11,21,32,.5)', border: '1px solid rgba(74,127,165,.08)', borderRadius: 6, padding: '0.6rem 0.75rem' }}>
                {lead.raw_input}
              </p>
            </div>
          )}
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(74,127,165,.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={handleDelete} disabled={deleting} style={{ fontSize: '0.72rem', color: 'rgba(239,68,68,.5)', background: 'none', border: 'none', cursor: 'pointer' }} className="hover:text-red-400 transition-colors disabled:opacity-40">
            {deleting ? 'Removendo...' : 'Remover lead'}
          </button>
          <button onClick={handleSave} disabled={saving || !dirty}
            style={{ background: '#f59e0b', color: 'black', fontSize: '0.75rem', fontWeight: 700, padding: '0.5rem 1.25rem', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: saving || !dirty ? 0.4 : 1 }}>
            {saving ? 'Salvando...' : dirty ? 'Salvar →' : 'Salvo ✓'}
          </button>
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }`}</style>
    </>
  );
}

export default function Pipeline() {
  const { token } = useAuth();
  const [input, setInput]       = useState('');
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
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
    } catch (err) { console.error('[pipeline]', err); }
    finally { setFetching(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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

  const STATS = [
    { label: 'Leads',      value: leads.length,              color: 'white' },
    { label: 'Clientes',   value: byStage('cliente').length, color: '#7aaa4a' },
    { label: 'Follow-ups', value: followUps,                 color: '#f59e0b' },
    { label: 'MRR Est.',   value: `R$${totalMrr.toLocaleString('pt-BR')}`, color: '#7aaec7' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ ...jakarta, fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.04em', color: 'white', lineHeight: 1.1 }}>
          Pipeline Comercial
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.3)', marginTop: '0.3rem' }}>
          CRM em linguagem natural
        </p>
        <div style={{ marginTop: '1.5rem', borderBottom: '1px solid rgba(74,127,165,.1)' }} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {STATS.map(s => (
          <div key={s.label} style={{ ...card, padding: '1rem 1.1rem', borderLeft: `3px solid ${s.color}40` }}>
            {fetching ? (
              <><Skel className="h-6 w-8 mb-2" /><Skel className="h-2.5 w-16" /></>
            ) : (
              <>
                <div style={{ ...jakarta, fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.04em', color: s.color, lineHeight: 1, marginBottom: '0.3rem' }}>{s.value}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.3)' }}>{s.label}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ ...card, padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ ...sectionLabel, color: 'rgba(245,158,11,.7)', marginBottom: '0.85rem' }}>● Novo lead ou atualização</div>
        <div style={{ borderBottom: '1px solid rgba(74,127,165,.08)', marginBottom: '1rem' }} />
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd(); }}
          placeholder="Ex: Falei com João da Loja XYZ hoje, e-commerce de moda, interessado no Pro, follow-up em 3 dias..."
          rows={3}
          className="w-full bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none resize-none leading-relaxed"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(74,127,165,.08)' }}>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,.2)' }}>⌘+Enter · Claude estrutura automaticamente</span>
          <button
            onClick={handleAdd}
            disabled={loading || !input.trim()}
            style={{ background: '#f59e0b', color: 'black', fontSize: '0.75rem', fontWeight: 700, padding: '0.45rem 1rem', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: loading || !input.trim() ? 0.4 : 1 }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="w-3 h-3 border border-black/30 border-t-black/80 rounded-full animate-spin" />
                Processando...
              </span>
            ) : 'Adicionar →'}
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div style={{ ...sectionLabel, marginBottom: '0.85rem' }}>Pipeline</div>
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-cols-5 gap-3" style={{ minWidth: 800 }}>
          {STAGES.map(col => (
            <div key={col.key} style={{ ...card, padding: '0.85rem', minHeight: 240, borderTop: `2px solid ${col.color}30` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: col.color }}>{col.label}</span>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: col.color, background: `${col.color}18`, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999 }}>
                  {byStage(col.key).length}
                </span>
              </div>

              {fetching && (
                <div className="flex flex-col gap-2">
                  {col.key === 'prospect' && [1,2].map(i => (
                    <div key={i} style={{ ...innerCard, padding: '0.65rem' }}>
                      <Skel className="h-3 w-full mb-2" /><Skel className="h-2 w-2/3 mb-2" /><Skel className="h-2 w-1/2" />
                    </div>
                  ))}
                </div>
              )}

              {!fetching && (
                <div className="flex flex-col gap-2">
                  {byStage(col.key).length === 0 && (
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.1)', textAlign: 'center', marginTop: '1.5rem' }}>vazio</div>
                  )}
                  {byStage(col.key).map(l => (
                    <div
                      key={l.id}
                      onClick={() => setSelectedLead(l)}
                      style={{ ...innerCard, padding: '0.65rem', cursor: 'pointer' }}
                      className="hover:border-[#4a7fa5]/20 hover:bg-[#1e3350]/30 transition-all"
                    >
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.8)', fontWeight: 500, lineHeight: 1.3, marginBottom: '0.2rem' }}>{l.company}</div>
                      {l.name && <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.3)', marginBottom: '0.4rem' }}>{l.name}</div>}
                      {l.notes && <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,.22)', lineHeight: 1.4, marginBottom: '0.4rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.notes}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {l.follow_up_at && <span style={{ fontSize: '0.58rem', color: 'rgba(245,158,11,.55)' }}>📅 {new Date(l.follow_up_at + 'T00:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })}</span>}
                        {l.mrr_est > 0 && <span style={{ fontSize: '0.58rem', color: 'rgba(122,170,74,.55)' }}>R${l.mrr_est.toLocaleString('pt-BR')}</span>}
                        {l.phone && <span style={{ fontSize: '0.58rem', opacity: 0.3 }}>📞</span>}
                        {l.contact_email && <span style={{ fontSize: '0.58rem', opacity: 0.3 }}>✉️</span>}
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
        <LeadPanel lead={selectedLead} onClose={() => setSelectedLead(null)} onSave={handleSave} onDelete={handleDelete} />
      )}
    </div>
  );
}
