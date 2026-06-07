import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

// ── Types ─────────────────────────────────────────────────────────────────────
type Status = 'ideia' | 'aprovada' | 'building' | 'done';
type Tab    = 'backlog' | 'builder' | 'bugs';

interface Bug {
  id: string; sintoma: string; causa: string; arquivo: string | null;
  correcao: string; como_testar: string | null; created_at: string;
}
interface BugForm { sintoma: string; causa: string; arquivo: string; correcao: string; como_testar: string; }
const EMPTY_BUG: BugForm = { sintoma: '', causa: '', arquivo: '', correcao: '', como_testar: '' };

interface Feature {
  id: string; title: string; description: string;
  ice: number; ice_impact: number; ice_confidence: number;
  ice_ease: number; ice_reasoning: string; status: Status;
  notes?: string; created_at: string;
}

interface PRD { id: string; feature: string; content: string; tasks: string[]; created_at: string; }

// ── Styles ────────────────────────────────────────────────────────────────────
const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
const card   = { background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 8 };
const inner  = { background: 'var(--bg-inner)', border: '1px solid var(--border-inner)', borderRadius: 6 };
const dimLabel: React.CSSProperties = { fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' as const, letterSpacing: '0.18em' };
const ACCENT = '#4a7fa5';
const GREEN  = '#7aaa4a';

const COLS: { key: Status; label: string; color: string }[] = [
  { key: 'ideia',    label: 'Ideia',    color: '#7aaec7' },
  { key: 'aprovada', label: 'Aprovada', color: GREEN     },
  { key: 'building', label: 'Building', color: ACCENT    },
  { key: 'done',     label: 'Done',     color: '#34d399' },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function Skel({ className }: { className?: string }) {
  return <div className={`rounded animate-pulse ${className ?? ''}`} style={{ background: 'var(--skel-bg)' }} />;
}

function IceBadge({ ice }: { ice: number }) {
  const color = ice >= 8 ? GREEN : ice >= 6 ? '#f59e0b' : '#ef4444';
  return (
    <span style={{ color, background: `${color}18`, fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 4 }}>
      ICE {ice}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Produto() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('backlog');

  // Shared: features (used in both tabs)
  const [features,  setFeatures]  = useState<Feature[]>([]);
  const [fetching,  setFetching]  = useState(true);

  // Backlog tab
  const [pmInput,   setPmInput]   = useState('');
  const [pmLoading, setPmLoading] = useState(false);
  const [pmError,   setPmError]   = useState<string | null>(null);

  // Builder tab
  const [prds,       setPrds]      = useState<PRD[]>([]);
  const [prdInput,   setPrdInput]  = useState('');
  const [prdLoading, setPrdLoading] = useState(false);
  const [prdError,   setPrdError]  = useState<string | null>(null);
  const [selected,   setSelected]  = useState<PRD | null>(null);
  const [copied,     setCopied]    = useState(false);
  const [prdFetched, setPrdFetched] = useState(false);
  const builderFetchedRef = useRef(false);

  // Bugs tab
  const [bugs,       setBugs]       = useState<Bug[]>([]);
  const [bugForm,    setBugForm]    = useState<BugForm>(EMPTY_BUG);
  const [rawJson,    setRawJson]    = useState('');
  const [bugSaving,  setBugSaving]  = useState(false);
  const [bugSearch,  setBugSearch]  = useState('');
  const [bugExpanded, setBugExpanded] = useState<string | null>(null);
  const [bugsFetched, setBugsFetched] = useState(false);
  const bugsFetchedRef = useRef(false);

  const authH = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const byStatus = (s: Status) => features.filter(f => f.status === s);
  const approved = features.filter(f => f.status === 'aprovada');

  // Fetch features once (shared between tabs)
  useEffect(() => {
    fetch(`${PROXY}/api/hq/pm/features`, { headers: authH })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFeatures(data); })
      .finally(() => setFetching(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch bugs when Bugs tab is first opened
  const fetchBugs = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${PROXY}/api/hq/bugs`, { headers: authH });
      if (!r.ok) throw new Error(await r.text());
      const { bugs: data } = await r.json();
      setBugs(data ?? []);
    } catch (err) { console.error('[bugs]', err); }
    finally { setBugsFetched(true); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (tab !== 'bugs' || bugsFetchedRef.current) return;
    bugsFetchedRef.current = true;
    fetchBugs();
  }, [tab, fetchBugs]);

  // Fetch PRDs when Builder tab is first opened
  useEffect(() => {
    if (tab !== 'builder' || builderFetchedRef.current) return;
    builderFetchedRef.current = true;
    fetch(`${PROXY}/api/hq/builder/prds`, { headers: authH })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) { setPrds(data); if (data.length > 0) setSelected(data[0]); }
      })
      .catch(e => setPrdError(e.message))
      .finally(() => setPrdFetched(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Backlog actions ───────────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!pmInput.trim() || pmLoading) return;
    setPmLoading(true); setPmError(null);
    try {
      const r = await fetch(`${PROXY}/api/hq/pm/analyze`, {
        method: 'POST', headers: authH, body: JSON.stringify({ idea: pmInput.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro');
      setFeatures(prev => [data, ...prev]);
      setPmInput('');
    } catch (e: unknown) { setPmError(e instanceof Error ? e.message : 'Erro'); }
    finally { setPmLoading(false); }
  }

  async function moveStatus(id: string, status: Status) {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    await fetch(`${PROXY}/api/hq/pm/features/${id}`, {
      method: 'PATCH', headers: authH, body: JSON.stringify({ status }),
    });
  }

  async function deleteFeature(id: string) {
    if (!confirm('Remover esta feature?')) return;
    setFeatures(prev => prev.filter(f => f.id !== id));
    await fetch(`${PROXY}/api/hq/pm/features/${id}`, { method: 'DELETE', headers: authH });
  }

  async function clearAllFeatures() {
    if (!confirm('Remover todas as features?')) return;
    const ids = features.map(f => f.id);
    setFeatures([]);
    await Promise.all(ids.map(id => fetch(`${PROXY}/api/hq/pm/features/${id}`, { method: 'DELETE', headers: authH })));
  }

  // ── Builder actions ───────────────────────────────────────────────────────
  async function handleGenerate(featureText?: string) {
    const text = featureText ?? prdInput.trim();
    if (!text || prdLoading) return;
    setPrdLoading(true); setPrdError(null);
    try {
      const r = await fetch(`${PROXY}/api/hq/builder/prd`, {
        method: 'POST', headers: authH, body: JSON.stringify({ feature: text }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro');
      setPrds(prev => [data, ...prev]);
      setSelected(data);
      setPrdInput('');
    } catch (e: unknown) { setPrdError(e instanceof Error ? e.message : 'Erro'); }
    finally { setPrdLoading(false); }
  }

  async function deletePrd(id: string) {
    if (!confirm('Remover este PRD?')) return;
    setPrds(prev => prev.filter(p => p.id !== id));
    if (selected?.id === id) setSelected(null);
    await fetch(`${PROXY}/api/hq/builder/prds/${id}`, { method: 'DELETE', headers: authH });
  }

  async function clearAllPrds() {
    if (!confirm('Remover todos os PRDs?')) return;
    const ids = prds.map(p => p.id);
    setPrds([]); setSelected(null);
    await Promise.all(ids.map(id => fetch(`${PROXY}/api/hq/builder/prds/${id}`, { method: 'DELETE', headers: authH })));
  }

  // ── Bugs actions ─────────────────────────────────────────────────────────
  function parseJsonBug(raw: string): BugForm | null {
    const sanitize = (s: string) => s
      .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[​﻿]/g, '')
      .replace(/\r?\n\s*/g, ' ')
      .trim();
    const clean = sanitize(raw);

    const extract = (s: string): string => {
      const start = s.indexOf('{');
      if (start === -1) return s;
      let depth = 0, end = -1, inStr = false, esc = false;
      for (let i = start; i < s.length; i++) {
        const ch = s[i];
        if (esc) { esc = false; continue; }
        if (ch === '\\' && inStr) { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (!inStr) { if (ch === '{') depth++; else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } } }
      }
      return end !== -1 ? s.slice(start, end + 1) : s;
    };

    try {
      const p = JSON.parse(extract(clean));
      if (!p.sintoma || !p.causa || !p.correcao) return null;
      return { sintoma: p.sintoma, causa: p.causa, arquivo: p.arquivo ?? '', correcao: p.correcao, como_testar: p.como_testar ?? '' };
    } catch { return null; }
  }

  async function handleBugJsonSave() {
    const parsed = parseJsonBug(rawJson);
    if (!parsed) { alert('JSON inválido — verifique se copiou o bloco completo.'); return; }
    setBugSaving(true);
    try {
      const r = await fetch(`${PROXY}/api/hq/bugs`, {
        method: 'POST', headers: authH, body: JSON.stringify(parsed),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setBugs(prev => [data.bug, ...prev]);
      setRawJson('');
    } catch (err) { console.error('[bugs/json-save]', err); alert('Erro ao salvar.'); }
    finally { setBugSaving(false); }
  }

  function applyBugJson() {
    const parsed = parseJsonBug(rawJson);
    if (!parsed) { alert('JSON inválido — verifique se copiou o bloco completo.'); return; }
    setBugForm(parsed);
    setRawJson('');
  }

  async function handleBugSave() {
    if (!bugForm.sintoma.trim() || !bugForm.causa.trim() || !bugForm.correcao.trim()) return;
    setBugSaving(true);
    try {
      const r = await fetch(`${PROXY}/api/hq/bugs`, {
        method: 'POST', headers: authH, body: JSON.stringify(bugForm),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setBugs(prev => [data.bug, ...prev]);
      setBugForm(EMPTY_BUG);
    } catch (err) { console.error('[bugs/save]', err); }
    finally { setBugSaving(false); }
  }

  async function handleBugDelete(id: string) {
    if (!confirm('Remover este registro?')) return;
    await fetch(`${PROXY}/api/hq/bugs/${id}`, { method: 'DELETE', headers: authH });
    setBugs(prev => prev.filter(b => b.id !== id));
    if (bugExpanded === id) setBugExpanded(null);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const filteredBugs = bugs.filter(b => {
    if (!bugSearch) return true;
    const q = bugSearch.toLowerCase();
    return b.sintoma.toLowerCase().includes(q) || b.causa.toLowerCase().includes(q) || (b.arquivo ?? '').toLowerCase().includes(q) || b.correcao.toLowerCase().includes(q);
  });
  const canSaveBug = bugForm.sintoma.trim() && bugForm.causa.trim() && bugForm.correcao.trim();

  const TABS: { id: Tab; label: string }[] = [
    { id: 'backlog', label: 'Backlog' },
    { id: 'builder', label: 'Builder' },
    { id: 'bugs',    label: 'Bugs'    },
  ];

  return (
    <div className="p-4 md:p-8">

      {/* Header + Tabs */}
      <div className="mb-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 style={{ ...jakarta, fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.04em', color: 'var(--text-pri)', lineHeight: 1.1 }}>
              Produto
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-ter)', marginTop: '0.3rem' }}>
              Ideias → ICE Score → PRD → Claude Code
            </p>
          </div>

          {/* Stats (backlog tab only) */}
          {tab === 'backlog' && !fetching && (
            <div className="flex gap-6">
              {[
                { label: 'Total',     value: features.length,            color: 'var(--text-pri)' },
                { label: 'Aprovadas', value: byStatus('aprovada').length, color: GREEN    },
                { label: 'Building',  value: byStatus('building').length, color: ACCENT   },
              ].map(s => (
                <div key={s.label} className="text-right">
                  <div style={{ ...jakarta, fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.04em', color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-ter)', marginTop: '0.2rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 0, marginTop: '1.25rem', borderBottom: '1px solid var(--border-main)' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '0.5rem 1.1rem 0.6rem',
                fontSize: '0.8rem', fontWeight: 600,
                color: tab === t.id ? '#7aaec7' : 'var(--text-ter)',
                background: 'transparent', border: 'none',
                borderBottom: tab === t.id ? '2px solid #7aaec7' : '2px solid transparent',
                cursor: 'pointer', transition: 'all .15s', marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: Backlog (PM) ──────────────────────────────────────── */}
      {tab === 'backlog' && (
        <>
          {/* Input */}
          <div style={{ ...card, padding: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ ...dimLabel, marginBottom: '0.85rem' }}>● Nova ideia de feature</div>
            <div style={{ borderBottom: '1px solid var(--border-inner)', marginBottom: '1rem' }} />
            <textarea
              value={pmInput}
              onChange={e => setPmInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyze(); }}
              placeholder="Ex: quero que o usuário possa escolher o tom de voz antes de gerar o email..."
              rows={3}
              className="w-full bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none resize-none leading-relaxed"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-inner)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-ter)' }}>⌘+Enter para analisar</span>
              <button
                onClick={handleAnalyze}
                disabled={pmLoading || !pmInput.trim()}
                style={{ background: GREEN, color: 'black', fontSize: '0.75rem', fontWeight: 700, padding: '0.45rem 1rem', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: pmLoading || !pmInput.trim() ? 0.4 : 1 }}
              >
                {pmLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="w-3 h-3 border border-black/30 border-t-black/80 rounded-full animate-spin" />
                    Analisando...
                  </span>
                ) : 'Analisar →'}
              </button>
            </div>
          </div>

          {pmError && (
            <div style={{ marginBottom: '1.5rem', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 6, padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.82rem' }}>
              {pmError}
            </div>
          )}

          {/* Kanban */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={dimLabel}>Backlog</span>
            {!fetching && features.length > 0 && (
              <button
                onClick={clearAllFeatures}
                style={{ fontSize: '0.68rem', color: 'var(--text-sec)', background: 'transparent', border: '1px solid var(--border-main)', borderRadius: 6, padding: '0.25rem 0.65rem', cursor: 'pointer' }}
              >
                limpar tudo
              </button>
            )}
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="grid grid-cols-4 gap-3" style={{ minWidth: 720 }}>
              {COLS.map(col => (
                <div key={col.key} style={{ ...card, padding: '1rem', minHeight: 260, borderLeft: `2px solid ${col.color}40` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: col.color }}>{col.label}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: col.color, background: `${col.color}18`, padding: '0.1rem 0.45rem', borderRadius: 999 }}>
                      {byStatus(col.key).length}
                    </span>
                  </div>

                  {fetching && col.key === 'ideia' && (
                    <div className="flex flex-col gap-2">
                      {[1, 2].map(i => (
                        <div key={i} style={{ ...inner, padding: '0.75rem' }}>
                          <Skel className="h-3 w-full mb-2" /><Skel className="h-2.5 w-2/3 mb-3" /><Skel className="h-4 w-12 rounded-full" />
                        </div>
                      ))}
                    </div>
                  )}

                  {!fetching && (
                    <div className="flex flex-col gap-2">
                      {byStatus(col.key).length === 0 && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-ter)', textAlign: 'center', marginTop: '2rem' }}>vazio</div>
                      )}
                      {byStatus(col.key).map(f => (
                        <div key={f.id} style={{ ...inner, padding: '0.75rem' }} className="group hover:border-[#4a7fa5]/20 transition-colors">
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-sec)', fontWeight: 500, lineHeight: 1.4, marginBottom: '0.4rem' }}>{f.title}</p>
                          {f.ice_reasoning && (
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-ter)', lineHeight: 1.5, marginBottom: '0.6rem' }}>{f.ice_reasoning}</p>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <IceBadge ice={f.ice} />
                              {f.ice_impact > 0 && (
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-ter)' }}>{f.ice_impact}/{f.ice_confidence}/{f.ice_ease}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <select
                                value={f.status}
                                onChange={e => moveStatus(f.id, e.target.value as Status)}
                                style={{ background: 'var(--input-bg)', color: 'var(--text-sec)', fontSize: '0.62rem', border: 'none', cursor: 'pointer', borderRadius: 4, padding: '0.15rem 0.25rem' }}
                              >
                                <option value="ideia">ideia</option>
                                <option value="aprovada">aprovada</option>
                                <option value="building">building</option>
                                <option value="done">done</option>
                              </select>
                              <button
                                onClick={() => deleteFeature(f.id)}
                                style={{ color: 'var(--text-ter)', fontSize: '1rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
                                className="hover:text-red-400 transition-colors"
                              >×</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── TAB: Bugs ─────────────────────────────────────────────── */}
      {tab === 'bugs' && (
        <div className="max-w-3xl">
          {/* Cole JSON — salva direto */}
          <div style={{ ...card, padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ ...dimLabel, color: 'rgba(239,68,68,.7)', marginBottom: '0.85rem' }}>● Cole o JSON do Claude Code e registre com um clique</div>
            <div style={{ borderBottom: '1px solid var(--border-inner)', marginBottom: '1rem' }} />
            <textarea
              value={rawJson}
              onChange={e => setRawJson(e.target.value)}
              placeholder={'{\n  "sintoma": "...",\n  "causa": "...",\n  "arquivo": "...",\n  "correcao": "...",\n  "como_testar": "..."\n}'}
              rows={5}
              className="w-full bg-transparent text-white/70 text-xs placeholder-white/15 focus:outline-none resize-none leading-relaxed font-mono"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-inner)' }}>
              <button onClick={applyBugJson} disabled={!rawJson.trim()} style={{ background: 'none', color: 'var(--text-ter)', border: 'none', fontSize: '0.72rem', cursor: 'pointer', opacity: !rawJson.trim() ? 0.3 : 1 }}>
                preencher campos ↓
              </button>
              <button onClick={handleBugJsonSave} disabled={bugSaving || !rawJson.trim()} style={{ background: '#f87171', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, padding: '0.45rem 1.1rem', borderRadius: 6, cursor: 'pointer', opacity: bugSaving || !rawJson.trim() ? 0.4 : 1 }}>
                {bugSaving ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="w-3 h-3 border border-white/30 border-t-white/80 rounded-full animate-spin" />Salvando...</span> : 'Registrar JSON →'}
              </button>
            </div>
          </div>

          {/* Formulário */}
          <div style={{ ...card, padding: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ ...dimLabel, marginBottom: '0.85rem' }}>● Registro do bug</div>
            <div style={{ borderBottom: '1px solid var(--border-inner)', marginBottom: '1.1rem' }} />
            <div className="flex flex-col gap-3">
              {([
                { key: 'sintoma',     label: 'Sintoma',     placeholder: 'O que o usuário observou',  rows: 2 },
                { key: 'causa',       label: 'Causa raiz',  placeholder: 'Por que o bug acontecia',   rows: 2 },
                { key: 'arquivo',     label: 'Arquivo',     placeholder: 'caminho/do/arquivo.ts',      rows: 1 },
                { key: 'correcao',    label: 'Correção',    placeholder: 'O que foi feito',            rows: 2 },
                { key: 'como_testar', label: 'Como testar', placeholder: 'Passo a passo mínimo',      rows: 2 },
              ] as { key: keyof BugForm; label: string; placeholder: string; rows: number }[]).map(f => (
                <div key={f.key}>
                  <label style={{ ...dimLabel, display: 'block', marginBottom: '0.35rem' }}>{f.label}</label>
                  {f.rows === 1
                    ? <input value={bugForm[f.key]} onChange={e => setBugForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full px-3 py-2 text-sm focus:outline-none placeholder-white/25" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 7, color: 'var(--text-sec)' }} />
                    : <textarea value={bugForm[f.key]} onChange={e => setBugForm(p => ({ ...p, [f.key]: e.target.value }))} rows={f.rows} placeholder={f.placeholder} className="w-full px-3 py-2 text-sm focus:outline-none placeholder-white/25 resize-none leading-relaxed" style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 7, color: 'var(--text-sec)' }} />
                  }
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-inner)' }}>
              <button onClick={handleBugSave} disabled={bugSaving || !canSaveBug} style={{ background: '#f87171', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '0.5rem 1.2rem', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: bugSaving || !canSaveBug ? 0.4 : 1 }}>
                {bugSaving ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="w-3 h-3 border border-white/30 border-t-white/80 rounded-full animate-spin" />Salvando...</span> : 'Registrar →'}
              </button>
            </div>
          </div>

          {/* Lista */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={dimLabel}>Histórico ({bugs.length})</span>
            <input value={bugSearch} onChange={e => setBugSearch(e.target.value)} placeholder="Buscar..." style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 7, color: 'var(--text-sec)', fontSize: '0.72rem', padding: '0.3rem 0.7rem', width: 180 }} className="focus:outline-none" />
          </div>

          {!bugsFetched && (
            <div className="flex flex-col gap-2">{[1,2,3].map(i => <div key={i} style={{ ...card, padding: '1rem' }}><Skel className="h-3 w-3/4 mb-2" /><Skel className="h-2.5 w-full mb-1.5" /><Skel className="h-2.5 w-1/2" /></div>)}</div>
          )}

          {bugsFetched && filteredBugs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-ter)', fontSize: '0.8rem' }}>
              {bugSearch ? 'Nenhum resultado.' : 'Nenhum bug registrado ainda.'}
            </div>
          )}

          {bugsFetched && (
            <div className="flex flex-col gap-2">
              {filteredBugs.map(b => (
                <div key={b.id} style={{ ...card, padding: '1rem 1.25rem', cursor: 'pointer' }} onClick={() => setBugExpanded(bugExpanded === b.id ? null : b.id)} className="hover:border-[#4a7fa5]/25 transition-all">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-pri)', lineHeight: 1.35, marginBottom: '0.2rem' }}>{b.sintoma}</div>
                      {b.arquivo && <div style={{ fontSize: '0.65rem', color: 'rgba(122,174,199,.45)', fontFamily: 'monospace', marginBottom: '0.15rem' }}>{b.arquivo}</div>}
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-ter)' }}>{new Date(b.created_at).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-ter)', flexShrink: 0, marginTop: 2 }}>{bugExpanded === b.id ? '▲' : '▼'}</span>
                  </div>
                  {bugExpanded === b.id && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-inner)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {([
                        { label: 'Causa raiz', value: b.causa },
                        { label: 'Correção',   value: b.correcao },
                        b.como_testar ? { label: 'Como testar', value: b.como_testar } : null,
                      ] as ({ label: string; value: string } | null)[]).filter(Boolean).map(f => (
                        <div key={f!.label}>
                          <div style={{ ...dimLabel, marginBottom: '0.25rem' }}>{f!.label}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-sec)', lineHeight: 1.6 }}>{f!.value}</div>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                        <button onClick={e => { e.stopPropagation(); handleBugDelete(b.id); }} style={{ fontSize: '0.68rem', color: 'rgba(239,68,68,.35)', background: 'none', border: 'none', cursor: 'pointer' }} className="hover:text-red-400 transition-colors">
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
      )}

      {/* ── TAB: Builder ──────────────────────────────────────────── */}
      {tab === 'builder' && (
        <div className="max-w-5xl">
          {/* Features aprovadas */}
          <div style={{ ...dimLabel, marginBottom: '0.85rem' }}>Features aprovadas no backlog</div>
          {fetching ? (
            <div className="flex gap-2 mb-6">{[1, 2].map(i => <Skel key={i} className="h-8 w-40 rounded-lg" />)}</div>
          ) : approved.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-sec)', marginBottom: '1.5rem' }}>
              Nenhuma feature aprovada no backlog ainda.{' '}
              <button onClick={() => setTab('backlog')} style={{ color: '#7aaec7', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}>
                Ir para o Backlog →
              </button>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-6">
              {approved.map(f => (
                <button
                  key={f.id}
                  onClick={() => handleGenerate(f.title)}
                  disabled={prdLoading}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem', borderRadius: 6, border: `1px solid rgba(122,170,74,.25)`, color: 'rgba(122,170,74,.7)', background: 'transparent', cursor: 'pointer', transition: 'all .15s' }}
                  className="hover:border-[#7aaa4a]/50 hover:text-[#7aaa4a] hover:bg-[#7aaa4a]/8 disabled:opacity-40"
                >
                  {f.title}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ ...card, padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ ...dimLabel, color: `${ACCENT}99`, marginBottom: '0.85rem' }}>● Ou descreva diretamente</div>
            <div style={{ borderBottom: '1px solid var(--border-inner)', marginBottom: '1rem' }} />
            <textarea
              value={prdInput}
              onChange={e => setPrdInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
              placeholder="Ex: selector de tom de voz antes de gerar o email..."
              rows={3}
              className="w-full bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none resize-none leading-relaxed"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-inner)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-ter)' }}>⌘+Enter para gerar PRD</span>
              <button
                onClick={() => handleGenerate()}
                disabled={prdLoading || !prdInput.trim()}
                style={{ background: ACCENT, color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '0.45rem 1rem', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: prdLoading || !prdInput.trim() ? 0.4 : 1 }}
              >
                {prdLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="w-3 h-3 border border-white/30 border-t-white/80 rounded-full animate-spin" />
                    Gerando...
                  </span>
                ) : 'Gerar PRD →'}
              </button>
            </div>
          </div>

          {prdError && (
            <div style={{ marginBottom: '1rem', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 6, padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.82rem' }}>{prdError}</div>
          )}

          {/* PRDs list */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={dimLabel}>PRDs gerados</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {prdFetched && <span style={{ fontSize: '0.68rem', color: 'var(--text-ter)' }}>{prds.length} total</span>}
              {prdFetched && prds.length > 0 && (
                <button onClick={clearAllPrds} style={{ fontSize: '0.68rem', color: 'var(--text-sec)', background: 'transparent', border: '1px solid var(--border-main)', borderRadius: 6, padding: '0.25rem 0.65rem', cursor: 'pointer' }}>
                  limpar tudo
                </button>
              )}
            </div>
          </div>

          {!prdFetched ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {[1, 2, 3].map(i => (
                <div key={i} style={{ ...card, padding: '1rem' }}>
                  <Skel className="h-3 w-full mb-2" /><Skel className="h-3 w-3/4 mb-4" /><Skel className="h-2.5 w-16" />
                </div>
              ))}
            </div>
          ) : prds.length === 0 ? (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-ter)', marginBottom: '1.5rem' }}>Nenhum PRD gerado ainda.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {prds.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelected(selected?.id === p.id ? null : p)}
                  className="text-left transition-all group"
                  style={selected?.id === p.id
                    ? { background: `rgba(74,127,165,.1)`, border: `1px solid rgba(74,127,165,.35)`, borderRadius: 8, padding: '1rem' }
                    : { ...card, padding: '1rem' }
                  }
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-sec)', fontWeight: 500, marginBottom: '0.5rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.feature}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-ter)' }}>{p.tasks?.length ?? 0} tasks</div>
                    <button
                      onClick={e => { e.stopPropagation(); deletePrd(p.id); }}
                      style={{ color: 'var(--text-ter)', fontSize: '1rem', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                    >×</button>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* PRD Detail */}
          {selected && (
            <div style={{ ...card, padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: ACCENT }}>{selected.feature}</div>
                <button
                  onClick={() => handleCopy(selected.content + '\n\nTasks:\n' + selected.tasks?.map((t, i) => `${i + 1}. ${t}`).join('\n'))}
                  style={{ fontSize: '0.72rem', color: 'var(--text-ter)', background: 'none', border: 'none', cursor: 'pointer' }}
                  className="hover:text-white/60 transition-colors"
                >
                  {copied ? '✓ copiado' : 'copiar'}
                </button>
              </div>
              <pre style={{ fontSize: '0.72rem', color: 'var(--text-sec)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{selected.content}</pre>
              {selected.tasks && selected.tasks.length > 0 && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-main)' }}>
                  <div style={{ ...dimLabel, marginBottom: '0.85rem' }}>Tasks para Claude Code</div>
                  <div className="flex flex-col gap-2">
                    {selected.tasks.map((t, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, fontSize: '0.75rem', color: 'var(--text-sec)' }}>
                        <span style={{ color: `${ACCENT}60`, fontFamily: 'monospace', flexShrink: 0, width: 20 }}>{String(i + 1).padStart(2, '0')}.</span>
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
