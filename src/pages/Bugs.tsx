import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined) ||
  'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

interface Bug {
  id: string;
  sintoma: string;
  causa: string;
  arquivo: string | null;
  correcao: string;
  como_testar: string | null;
  created_at: string;
}

interface BugForm {
  sintoma: string;
  causa: string;
  arquivo: string;
  correcao: string;
  como_testar: string;
}

const EMPTY: BugForm = { sintoma: '', causa: '', arquivo: '', correcao: '', como_testar: '' };

const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
const card = { background: 'rgba(17,30,48,.7)', border: '1px solid rgba(74,127,165,.12)', borderRadius: 8 };
const sectionLabel: React.CSSProperties = { fontSize: '0.62rem', fontWeight: 600, color: 'rgba(74,127,165,.6)', textTransform: 'uppercase', letterSpacing: '0.18em' };
const inputStyle = { background: 'rgba(17,30,48,.8)', border: '1px solid rgba(74,127,165,.15)', color: 'rgba(255,255,255,.85)', borderRadius: 7 };
const INPUT_CLS = 'w-full px-3 py-2.5 text-sm focus:outline-none transition-all placeholder-white/25 leading-relaxed';

function Skel({ className }: { className?: string }) {
  return <div className={`rounded animate-pulse ${className ?? ''}`} style={{ background: 'rgba(74,127,165,.08)' }} />;
}

function parseJson(raw: string): Partial<BugForm> | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export default function Bugs() {
  const { token } = useAuth();
  const [bugs, setBugs]       = useState<Bug[]>([]);
  const [fetching, setFetching] = useState(true);
  const [form, setForm]       = useState<BugForm>(EMPTY);
  const [rawJson, setRawJson] = useState('');
  const [saving, setSaving]   = useState(false);
  const [search, setSearch]   = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchBugs = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${PROXY}/api/hq/bugs`, { headers: authHeaders });
      if (!r.ok) throw new Error(await r.text());
      const { bugs: data } = await r.json();
      setBugs(data ?? []);
    } catch (err) { console.error('[bugs]', err); }
    finally { setFetching(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { fetchBugs(); }, [fetchBugs]);

  function applyJson() {
    const parsed = parseJson(rawJson);
    if (!parsed) { alert('JSON inválido — cole o bloco completo gerado pelo Claude Code.'); return; }
    setForm({
      sintoma:     parsed.sintoma     ?? '',
      causa:       parsed.causa       ?? '',
      arquivo:     parsed.arquivo     ?? '',
      correcao:    parsed.correcao    ?? '',
      como_testar: parsed.como_testar ?? '',
    });
    setRawJson('');
  }

  async function handleSave() {
    if (!form.sintoma.trim() || !form.causa.trim() || !form.correcao.trim()) {
      alert('Preencha pelo menos: sintoma, causa e correção.');
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${PROXY}/api/hq/bugs`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setBugs(prev => [data.bug, ...prev]);
      setForm(EMPTY);
    } catch (err) { console.error('[bugs/save]', err); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este registro?')) return;
    await fetch(`${PROXY}/api/hq/bugs/${id}`, { method: 'DELETE', headers: authHeaders });
    setBugs(prev => prev.filter(b => b.id !== id));
    if (expanded === id) setExpanded(null);
  }

  const filtered = bugs.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.sintoma.toLowerCase().includes(q) ||
      b.causa.toLowerCase().includes(q) ||
      (b.arquivo ?? '').toLowerCase().includes(q) ||
      b.correcao.toLowerCase().includes(q)
    );
  });

  const canSave = form.sintoma.trim() && form.causa.trim() && form.correcao.trim();

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ ...jakarta, fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.04em', color: 'white', lineHeight: 1.1 }}>
          Bug Agent
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.3)', marginTop: '0.3rem' }}>
          Histórico estruturado de correções — cole o JSON do Claude Code ou preencha manualmente
        </p>
        <div style={{ marginTop: '1.5rem', borderBottom: '1px solid rgba(74,127,165,.1)' }} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total de bugs',   value: bugs.length,                          color: 'white' },
          { label: 'Esta semana',     value: bugs.filter(b => {
            const d = new Date(b.created_at);
            const now = new Date();
            const diff = (now.getTime() - d.getTime()) / 86400000;
            return diff <= 7;
          }).length, color: '#f87171' },
          { label: 'Arquivos únicos', value: new Set(bugs.map(b => b.arquivo).filter(Boolean)).size, color: '#7aaec7' },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '1rem 1.1rem', borderLeft: `3px solid ${s.color}40` }}>
            {fetching ? (
              <><Skel className="h-6 w-8 mb-2" /><Skel className="h-2.5 w-20" /></>
            ) : (
              <>
                <div style={{ ...jakarta, fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.04em', color: s.color, lineHeight: 1, marginBottom: '0.3rem' }}>{s.value}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,.3)' }}>{s.label}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Input — colar JSON */}
      <div style={{ ...card, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ ...sectionLabel, color: 'rgba(239,68,68,.7)', marginBottom: '0.85rem' }}>● Cole o JSON do Claude Code</div>
        <div style={{ borderBottom: '1px solid rgba(74,127,165,.08)', marginBottom: '1rem' }} />
        <textarea
          value={rawJson}
          onChange={e => setRawJson(e.target.value)}
          placeholder={'{\n  "sintoma": "...",\n  "causa": "...",\n  "arquivo": "...",\n  "correcao": "...",\n  "como_testar": "..."\n}'}
          rows={6}
          className="w-full bg-transparent text-white/70 text-xs placeholder-white/15 focus:outline-none resize-none leading-relaxed font-mono"
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(74,127,165,.08)' }}>
          <button
            onClick={applyJson}
            disabled={!rawJson.trim()}
            style={{ background: 'rgba(239,68,68,.15)', color: '#f87171', border: '1px solid rgba(239,68,68,.25)', fontSize: '0.75rem', fontWeight: 600, padding: '0.45rem 1rem', borderRadius: 6, cursor: 'pointer', opacity: !rawJson.trim() ? 0.4 : 1 }}
          >
            Preencher campos →
          </button>
        </div>
      </div>

      {/* Formulário */}
      <div style={{ ...card, padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ ...sectionLabel, marginBottom: '0.85rem' }}>● Registro do bug</div>
        <div style={{ borderBottom: '1px solid rgba(74,127,165,.08)', marginBottom: '1.1rem' }} />

        <div className="flex flex-col gap-4">
          {([
            { key: 'sintoma',     label: 'Sintoma',    placeholder: 'O que o usuário observou', rows: 2 },
            { key: 'causa',       label: 'Causa raiz', placeholder: 'Por que o bug acontecia',  rows: 2 },
            { key: 'arquivo',     label: 'Arquivo',    placeholder: 'caminho/do/arquivo.ts',     rows: 1 },
            { key: 'correcao',    label: 'Correção',   placeholder: 'O que foi feito',           rows: 2 },
            { key: 'como_testar', label: 'Como testar', placeholder: 'Passo a passo mínimo',    rows: 2 },
          ] as { key: keyof BugForm; label: string; placeholder: string; rows: number }[]).map(f => (
            <div key={f.key}>
              <label style={{ ...sectionLabel, display: 'block', marginBottom: '0.4rem' }}>{f.label}</label>
              {f.rows === 1 ? (
                <input
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className={INPUT_CLS}
                  style={inputStyle}
                  placeholder={f.placeholder}
                />
              ) : (
                <textarea
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  rows={f.rows}
                  className={`${INPUT_CLS} resize-none`}
                  style={inputStyle}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.1rem', paddingTop: '1rem', borderTop: '1px solid rgba(74,127,165,.08)' }}>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            style={{ background: '#f87171', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '0.5rem 1.4rem', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: saving || !canSave ? 0.4 : 1 }}
          >
            {saving ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="w-3 h-3 border border-white/30 border-t-white/80 rounded-full animate-spin" />
                Salvando...
              </span>
            ) : 'Registrar bug →'}
          </button>
        </div>
      </div>

      {/* Lista */}
      <div style={{ ...sectionLabel, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Histórico</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar..."
          style={{ ...inputStyle, fontSize: '0.72rem', padding: '0.3rem 0.7rem', width: 180 }}
          className="focus:outline-none"
        />
      </div>

      {fetching && (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => (
            <div key={i} style={{ ...card, padding: '1rem 1.25rem' }}>
              <Skel className="h-3 w-3/4 mb-2" />
              <Skel className="h-2.5 w-full mb-1.5" />
              <Skel className="h-2.5 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!fetching && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(255,255,255,.15)', fontSize: '0.8rem' }}>
          {search ? 'Nenhum resultado.' : 'Nenhum bug registrado ainda.'}
        </div>
      )}

      {!fetching && (
        <div className="flex flex-col gap-3">
          {filtered.map(b => (
            <div
              key={b.id}
              style={{ ...card, padding: '1rem 1.25rem', cursor: 'pointer' }}
              onClick={() => setExpanded(expanded === b.id ? null : b.id)}
              className="hover:border-[#4a7fa5]/25 transition-all"
            >
              {/* Row resumo */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,.85)', lineHeight: 1.35, marginBottom: '0.25rem' }}>
                    {b.sintoma}
                  </div>
                  {b.arquivo && (
                    <div style={{ fontSize: '0.65rem', color: 'rgba(122,174,199,.5)', fontFamily: 'monospace', marginBottom: '0.2rem' }}>
                      {b.arquivo}
                    </div>
                  )}
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.25)' }}>
                    {new Date(b.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.2)', flexShrink: 0, marginTop: 2 }}>
                  {expanded === b.id ? '▲' : '▼'}
                </span>
              </div>

              {/* Detalhes expandidos */}
              {expanded === b.id && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(74,127,165,.08)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {([
                    { label: 'Causa raiz', value: b.causa },
                    { label: 'Correção',   value: b.correcao },
                    b.como_testar ? { label: 'Como testar', value: b.como_testar } : null,
                  ] as ({ label: string; value: string } | null)[]).filter(Boolean).map(f => (
                    <div key={f!.label}>
                      <div style={{ ...sectionLabel, marginBottom: '0.3rem' }}>{f!.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.6 }}>{f!.value}</div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(b.id); }}
                      style={{ fontSize: '0.68rem', color: 'rgba(239,68,68,.4)', background: 'none', border: 'none', cursor: 'pointer' }}
                      className="hover:text-red-400 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
