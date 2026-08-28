import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

type Profile = 'reveny' | 'pessoal';
type Status = 'ideia' | 'rascunho' | 'pronto' | 'publicado' | 'descartado';

interface Slide { headline: string; body: string; kind?: string; image_path?: string }
interface Idea {
  id: string; profile: Profile; pillar: string; format: string;
  hook: string; angle: string; goal: string; week_start: string;
  status: Status; source_note?: string;
  caption?: string; slides?: Slide[]; image_paths?: string[];
  created_at: string; updated_at: string;
}
interface StrategyProfile {
  handle: string; voice: string;
  pillars: { key: string; name: string; desc: string }[];
}
type Strategy = Record<Profile, StrategyProfile>;

const PROFILE_LABEL: Record<Profile, string> = { reveny: '@reveny', pessoal: '@josejunior' };
const STATUS_COLOR: Record<Status, string> = {
  ideia: '#7aaec7', rascunho: '#f59e0b', pronto: '#7aaa4a', publicado: '#4a7fa5', descartado: '#6b7280',
};
const GOAL_LABEL: Record<string, string> = {
  credibilidade: 'credibilidade', trial: 'trial', alcance: 'alcance', rede: 'rede',
};

const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
const card = { background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 8 };
const sectionLabel: React.CSSProperties = {
  fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.18em',
};
const inputStyle: React.CSSProperties = {
  background: 'var(--bg-inner)', border: '1px solid var(--border-inner)', borderRadius: 6,
  padding: '0.55rem 0.75rem', color: 'var(--text-sec)', fontSize: '0.82rem', width: '100%',
  outline: 'none', lineHeight: 1.5, resize: 'none',
};

function mondayISO(d = new Date()) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}
function weekLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00Z');
  const end = new Date(d); end.setUTCDate(end.getUTCDate() + 6);
  const f = (x: Date) => `${x.getUTCDate()}/${x.getUTCMonth() + 1}`;
  return `${f(d)} – ${f(end)}`;
}

export default function CMO() {
  const { token } = useAuth();
  const H = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);

  const [profile, setProfile] = useState<Profile>('reveny');
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [fetching, setFetching] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [context, setContext] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = ideas.find((i) => i.id === selectedId) || null;
  const pillarName = useCallback(
    (key: string) => strategy?.[profile]?.pillars.find((p) => p.key === key)?.name || key,
    [strategy, profile],
  );

  const load = useCallback(async () => {
    setFetching(true); setError(null);
    try {
      const [sr, ir] = await Promise.all([
        fetch(`${PROXY}/api/hq/content/strategy`, { headers: H }),
        fetch(`${PROXY}/api/hq/content/ideas?profile=${profile}`, { headers: H }),
      ]);
      if (sr.ok) setStrategy(await sr.json());
      const id = await ir.json();
      if (!ir.ok) throw new Error(id.error || 'Erro ao carregar ideias');
      setIdeas(id.ideas || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setFetching(false);
    }
  }, [H, profile]);

  useEffect(() => { load(); }, [load]);

  async function generatePlan() {
    if (planning) return;
    setPlanning(true); setError(null);
    try {
      const r = await fetch(`${PROXY}/api/hq/content/plan`, {
        method: 'POST', headers: H,
        body: JSON.stringify({ profile, week_start: mondayISO(), context: context.trim() || undefined }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao gerar plano');
      setIdeas((prev) => [...(data.ideas || []), ...prev]);
      setContext('');
      if (data.ideas?.[0]) setSelectedId(data.ideas[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar plano');
    } finally {
      setPlanning(false);
    }
  }

  function patchLocal(id: string, patch: Partial<Idea>) {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function setStatus(id: string, status: Status) {
    patchLocal(id, { status });
    await fetch(`${PROXY}/api/hq/content/ideas/${id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ status }) });
  }

  async function removeIdea(id: string) {
    if (!confirm('Remover esta ideia?')) return;
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
    await fetch(`${PROXY}/api/hq/content/ideas/${id}`, { method: 'DELETE', headers: H });
  }

  const grouped = useMemo(() => {
    const m = new Map<string, Idea[]>();
    for (const i of ideas) {
      const k = i.week_start || 'sem data';
      (m.get(k) || m.set(k, []).get(k)!).push(i);
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [ideas]);

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ ...jakarta, fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.04em', color: 'var(--text-pri)', lineHeight: 1.1 }}>
              CMO
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-ter)', marginTop: '0.3rem' }}>
              Plano semanal + carrossel de Instagram
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['reveny', 'pessoal'] as Profile[]).map((p) => (
              <button
                key={p}
                onClick={() => { setProfile(p); setSelectedId(null); }}
                style={profile === p
                  ? { ...jakarta, background: '#4a7fa5', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '0.4rem 0.9rem', borderRadius: 6, border: 'none', cursor: 'pointer' }
                  : { ...jakarta, border: '1px solid var(--border-inner)', color: 'var(--text-ter)', fontSize: '0.75rem', padding: '0.4rem 0.9rem', borderRadius: 6, background: 'transparent', cursor: 'pointer' }}
              >
                {PROFILE_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', borderBottom: '1px solid var(--border-main)' }} />
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 6, padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.82rem' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-4 md:gap-6">
        {/* ── Left: plano + lista de ideias ── */}
        <div className="min-w-0">
          <div style={{ ...card, padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ ...sectionLabel, color: '#4a7fa599', marginBottom: '0.85rem' }}>● Plano da semana</div>
            <div style={{ borderBottom: '1px solid var(--border-inner)', marginBottom: '1rem' }} />
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Opcional: o que rolou essa semana no produto/negócio (o agente já puxa bugs e features automáticos)"
              rows={3}
              style={inputStyle}
            />
            <button
              onClick={generatePlan}
              disabled={planning}
              style={{ ...jakarta, marginTop: '0.85rem', width: '100%', background: '#4a7fa5', color: 'white', fontSize: '0.78rem', fontWeight: 700, padding: '0.55rem', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: planning ? 0.5 : 1 }}
            >
              {planning ? 'Planejando…' : 'Gerar plano da semana →'}
            </button>
          </div>

          {fetching ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => <div key={i} style={{ ...card, padding: '1rem', height: 76 }} className="animate-pulse" />)}
            </div>
          ) : grouped.length === 0 ? (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-ter)', padding: '1rem 0' }}>
              Nenhuma ideia ainda. Gera o plano da semana.
            </div>
          ) : (
            grouped.map(([week, items]) => (
              <div key={week} style={{ marginBottom: '1.25rem' }}>
                <div style={{ ...sectionLabel, marginBottom: '0.6rem' }}>
                  {week === mondayISO() ? 'Esta semana' : weekLabel(week)}
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((i) => (
                    <button
                      key={i.id}
                      onClick={() => setSelectedId(i.id)}
                      className="text-left transition-all"
                      style={selectedId === i.id
                        ? { background: 'var(--bg-inner)', border: '1px solid rgba(74,127,165,.3)', borderRadius: 8, padding: '0.9rem 1rem' }
                        : { ...card, padding: '0.9rem 1rem', opacity: i.status === 'descartado' ? 0.5 : 1 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#7aaec7', background: '#7aaec715', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                          {pillarName(i.pillar)}
                        </span>
                        <span style={{ fontSize: '0.6rem', color: STATUS_COLOR[i.status], background: `${STATUS_COLOR[i.status]}15`, padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                          {i.status}
                        </span>
                        {i.image_paths?.length ? (
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-ter)' }}>{i.image_paths.length} slides</span>
                        ) : null}
                      </div>
                      <div style={{ ...jakarta, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-sec)', lineHeight: 1.3 }}>
                        {i.hook}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Right: detalhe da ideia ── */}
        <div className="min-w-0">
          {selected ? (
            <IdeaDetail
              key={selected.id}
              idea={selected}
              H={H}
              pillarName={pillarName}
              onPatch={(patch) => patchLocal(selected.id, patch)}
              onStatus={(s) => setStatus(selected.id, s)}
              onRemove={() => removeIdea(selected.id)}
            />
          ) : (
            <div style={{ ...card, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-ter)' }}>Selecione uma ideia</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function IdeaDetail({
  idea, H, pillarName, onPatch, onStatus, onRemove,
}: {
  idea: Idea;
  H: Record<string, string>;
  pillarName: (k: string) => string;
  onPatch: (p: Partial<Idea>) => void;
  onStatus: (s: Status) => void;
  onRemove: () => void;
}) {
  const [busy, setBusy] = useState<null | 'draft' | 'render' | 'save'>(null);
  const [err, setErr] = useState<string | null>(null);
  const [caption, setCaption] = useState(idea.caption || '');
  const [slides, setSlides] = useState<Slide[]>(idea.slides || []);
  const [copied, setCopied] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<number>(-1);

  const dirty =
    caption !== (idea.caption || '') ||
    JSON.stringify(slides) !== JSON.stringify(idea.slides || []);

  async function generateDraft() {
    setBusy('draft'); setErr(null);
    try {
      const r = await fetch(`${PROXY}/api/hq/content/ideas/${idea.id}/draft`, { method: 'POST', headers: H });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao gerar carrossel');
      setCaption(data.caption || '');
      setSlides(data.slides || []);
      onPatch({ caption: data.caption, slides: data.slides, image_paths: data.image_paths, status: data.status });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro');
    } finally {
      setBusy(null);
    }
  }

  async function saveAndRender() {
    setBusy('render'); setErr(null);
    try {
      // salva caption/slides
      await fetch(`${PROXY}/api/hq/content/ideas/${idea.id}`, {
        method: 'PATCH', headers: H, body: JSON.stringify({ caption, slides }),
      });
      // re-renderiza
      const r = await fetch(`${PROXY}/api/hq/content/ideas/${idea.id}/render`, {
        method: 'POST', headers: H, body: JSON.stringify({ slides }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao renderizar');
      onPatch({ caption, slides, image_paths: data.image_paths });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro');
    } finally {
      setBusy(null);
    }
  }

  function editSlide(i: number, patch: Partial<Slide>) {
    setSlides((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function pickImage(i: number) {
    uploadTargetRef.current = i;
    uploadRef.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    const i = uploadTargetRef.current;
    if (!file || i < 0) return;
    setBusy('save'); setErr(null);
    try {
      const r = await fetch(`${PROXY}/api/hq/content/upload`, {
        method: 'POST',
        headers: { Authorization: H.Authorization, 'Content-Type': file.type || 'image/png' },
        body: file,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro no upload');
      editSlide(i, { image_path: data.url });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro');
    } finally {
      setBusy(null);
    }
  }

  const imgs = idea.image_paths || [];

  return (
    <div style={{ ...card, padding: '1.25rem' }} className="sticky top-6">
      <input ref={uploadRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />

      {/* topo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', gap: 8 }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#7aaec7', background: '#7aaec715', padding: '0.15rem 0.5rem', borderRadius: 4 }}>
          {pillarName(idea.pillar)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select
            value={idea.status}
            onChange={(e) => onStatus(e.target.value as Status)}
            style={{ background: 'var(--input-bg)', color: 'var(--text-sec)', fontSize: '0.65rem', border: 'none', cursor: 'pointer', borderRadius: 4, padding: '0.15rem 0.4rem' }}
          >
            {(['ideia', 'rascunho', 'pronto', 'publicado', 'descartado'] as Status[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={onRemove} title="Remover" style={{ fontSize: '0.95rem', color: 'var(--text-ter)', background: 'none', border: 'none', cursor: 'pointer' }} className="hover:text-red-400 transition-colors">×</button>
        </div>
      </div>

      {/* briefing */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ ...jakarta, fontSize: '1rem', fontWeight: 700, color: 'var(--text-pri)', lineHeight: 1.25, marginBottom: '0.35rem' }}>
          {idea.hook}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-ter)', lineHeight: 1.55 }}>{idea.angle}</p>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.5rem', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>objetivo: {GOAL_LABEL[idea.goal] || idea.goal}</span>
          {idea.source_note && <span>fonte: {idea.source_note}</span>}
        </div>
      </div>

      {err && (
        <div style={{ marginBottom: '0.85rem', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 6, padding: '0.6rem 0.85rem', color: '#f87171', fontSize: '0.78rem' }}>
          {err}
        </div>
      )}

      {slides.length === 0 ? (
        <button
          onClick={generateDraft}
          disabled={busy === 'draft'}
          style={{ ...jakarta, width: '100%', background: '#7aaa4a', color: 'white', fontSize: '0.78rem', fontWeight: 700, padding: '0.6rem', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: busy === 'draft' ? 0.5 : 1 }}
        >
          {busy === 'draft' ? 'Gerando carrossel (~20s)…' : 'Gerar carrossel →'}
        </button>
      ) : (
        <>
          {/* preview dos slides renderizados */}
          {imgs.length > 0 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: '1rem' }}>
              {imgs.map((u, i) => (
                <a key={u} href={u} download={`slide-${i + 1}.png`} title={`Baixar slide ${i + 1}`} style={{ flexShrink: 0 }}>
                  <img src={u} alt={`slide ${i + 1}`} style={{ width: 132, height: 165, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-inner)' }} />
                </a>
              ))}
            </div>
          )}

          {/* legenda */}
          <div style={{ ...sectionLabel, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Legenda</span>
            <button
              onClick={() => { navigator.clipboard.writeText(caption); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              style={{ fontSize: '0.62rem', color: 'var(--text-ter)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}
            >
              {copied ? '✓ copiado' : 'copiar'}
            </button>
          </div>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={6} style={{ ...inputStyle, marginBottom: '1rem', whiteSpace: 'pre-wrap' }} />

          {/* editor de slides */}
          <div style={{ ...sectionLabel, marginBottom: '0.6rem' }}>Slides</div>
          <div className="flex flex-col gap-2" style={{ marginBottom: '1rem' }}>
            {slides.map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-inner)', borderRadius: 6, padding: '0.65rem 0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{i + 1} · {s.kind || 'content'}</span>
                  <button onClick={() => pickImage(i)} style={{ fontSize: '0.62rem', color: s.image_path ? '#7aaa4a' : 'var(--text-ter)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {s.image_path ? '✓ imagem' : '+ imagem'}
                  </button>
                </div>
                <input
                  value={s.headline}
                  onChange={(e) => editSlide(i, { headline: e.target.value })}
                  placeholder="Título do slide"
                  style={{ ...inputStyle, fontWeight: 600, marginBottom: '0.35rem' }}
                />
                {s.kind !== 'hook' && (
                  <textarea
                    value={s.body}
                    onChange={(e) => editSlide(i, { body: e.target.value })}
                    placeholder="Texto do slide"
                    rows={2}
                    style={inputStyle}
                  />
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={saveAndRender}
              disabled={busy !== null}
              style={{ ...jakarta, flex: 1, background: dirty || imgs.length === 0 ? '#4a7fa5' : 'var(--bg-inner)', color: dirty || imgs.length === 0 ? 'white' : 'var(--text-ter)', fontSize: '0.75rem', fontWeight: 700, padding: '0.55rem', borderRadius: 6, border: '1px solid var(--border-inner)', cursor: 'pointer', opacity: busy ? 0.5 : 1 }}
            >
              {busy === 'render' ? 'Renderizando…' : dirty ? 'Salvar e re-renderizar' : 'Re-renderizar'}
            </button>
            <button
              onClick={generateDraft}
              disabled={busy !== null}
              title="Gerar tudo de novo com a IA"
              style={{ ...jakarta, background: 'transparent', color: 'var(--text-ter)', fontSize: '0.75rem', padding: '0.55rem 0.9rem', borderRadius: 6, border: '1px solid var(--border-inner)', cursor: 'pointer', opacity: busy ? 0.5 : 1 }}
            >
              {busy === 'draft' ? '…' : 'Regerar'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
