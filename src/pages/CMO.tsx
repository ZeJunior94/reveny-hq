import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import JSZip from 'jszip';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

type Profile = 'reveny' | 'pessoal';
type Status = 'ideia' | 'rascunho' | 'pronto' | 'publicado' | 'descartado';
type Template = 'reveny' | 'quote' | 'loud' | 'cinema';

interface Slide { headline: string; body: string; kind?: string; kicker?: string; image_path?: string }
interface ArcBeat { beat: string; note: string }
interface Research { pain: string; hook_type: string; hook: string; narrative_arc: ArcBeat[]; proof?: string }
interface Idea {
  id: string; profile: Profile; pillar: string; format: string;
  hook: string; angle: string; goal: string; week_start: string;
  status: Status; source_note?: string;
  caption?: string; slides?: Slide[]; image_paths?: string[];
  research?: Research | null;
  template?: Template | null;
  created_at: string; updated_at: string;
}

const TEMPLATE_LABEL: Record<Template, string> = { reveny: 'Reveny', quote: 'Quote-card', loud: 'Gritado', cinema: 'Cinema' };
const TEMPLATE_DESC: Record<Template, string> = {
  reveny: 'Navy/claro alternado, pills e dots — nosso padrão',
  quote: 'Cartão branco estilo citação, avatar + nome + handle',
  loud: 'Headline gigante condensada, tons de azul/navy variando',
  cinema: 'Capa com foto + headline com 1-2 palavras em destaque colorido; resto do carrossel igual ao Reveny',
};
interface StrategyProfile {
  handle: string; voice: string; displayName?: string; avatarUrl?: string;
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

function ProfileConfigPanel({
  profile, strategy, H, onClose, onSaved,
}: {
  profile: Profile;
  strategy: Strategy;
  H: Record<string, string>;
  onClose: () => void;
  onSaved: (s: Strategy) => void;
}) {
  const prof = strategy[profile];
  const [displayName, setDisplayName] = useState(prof.displayName || '');
  const [handle, setHandle] = useState(prof.handle || '');
  const [avatarUrl, setAvatarUrl] = useState(prof.avatarUrl || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`${PROXY}/api/hq/content/upload`, {
        method: 'POST',
        headers: { Authorization: H.Authorization, 'Content-Type': file.type || 'image/png' },
        body: file,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro no upload');
      setAvatarUrl(data.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true); setErr(null);
    try {
      const updated: Strategy = {
        ...strategy,
        [profile]: { ...prof, displayName: displayName.trim(), handle: handle.trim(), avatarUrl },
      };
      const r = await fetch(`${PROXY}/api/hq/content/strategy`, {
        method: 'PUT', headers: H, body: JSON.stringify(updated),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao salvar');
      onSaved(updated);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ ...card, padding: '1.25rem', marginBottom: '1.25rem' }}>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={sectionLabel}>Configurar perfil — {prof.handle || PROFILE_LABEL[profile]}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-ter)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>
          ×
        </button>
      </div>
      {err && (
        <div style={{ marginBottom: '0.85rem', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 6, padding: '0.6rem 0.85rem', color: '#f87171', fontSize: '0.78rem' }}>
          {err}
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: '1.1rem' }}>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          title="Trocar foto"
          style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
            border: '1px solid var(--border-inner)', padding: 0,
            background: avatarUrl ? `center/cover no-repeat url(${avatarUrl})` : '#4a7fa5',
            color: 'white', fontWeight: 800, fontSize: '1.3rem', ...jakarta,
          }}
        >
          {!avatarUrl && (displayName || handle || '?').replace('@', '').charAt(0).toUpperCase()}
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          style={{ ...jakarta, fontSize: '0.72rem', fontWeight: 700, color: '#4a7fa5', background: 'transparent', border: '1px solid var(--border-inner)', borderRadius: 6, padding: '0.5rem 0.9rem', cursor: 'pointer' }}
        >
          {busy ? '…' : 'Trocar foto'}
        </button>
      </div>
      <label style={{ fontSize: '0.62rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem' }}>Nome de exibição</label>
      <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="ex: Reveny" style={{ ...inputStyle, marginBottom: '0.75rem' }} />
      <label style={{ fontSize: '0.62rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem' }}>Handle</label>
      <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@reveny" style={{ ...inputStyle, marginBottom: '1.1rem' }} />
      <button
        onClick={save}
        disabled={busy}
        style={{ ...jakarta, width: '100%', background: '#4a7fa5', color: 'white', fontSize: '0.78rem', fontWeight: 700, padding: '0.6rem', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: busy ? 0.5 : 1 }}
      >
        {busy ? 'Salvando…' : 'Salvar'}
      </button>
    </div>
  );
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
  const [showProfileConfig, setShowProfileConfig] = useState(false);

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

  // ordem plana igual à exibida na lista (grupos de semana + ordem dentro do
  // grupo) — usada pelas setas de navegação pra não precisar voltar pra lista
  // pra abrir o próximo card.
  const flatIds = useMemo(() => grouped.flatMap(([, list]) => list.map((i) => i.id)), [grouped]);
  const selectedIndex = selectedId ? flatIds.indexOf(selectedId) : -1;
  const goToOffset = useCallback((delta: number) => {
    if (selectedIndex === -1) return;
    const next = flatIds[selectedIndex + delta];
    if (next) setSelectedId(next);
  }, [flatIds, selectedIndex]);

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
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {(['reveny', 'pessoal'] as Profile[]).map((p) => (
              <button
                key={p}
                onClick={() => { setProfile(p); setSelectedId(null); }}
                style={profile === p
                  ? { ...jakarta, background: '#4a7fa5', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '0.4rem 0.9rem', borderRadius: 6, border: 'none', cursor: 'pointer' }
                  : { ...jakarta, border: '1px solid var(--border-inner)', color: 'var(--text-ter)', fontSize: '0.75rem', padding: '0.4rem 0.9rem', borderRadius: 6, background: 'transparent', cursor: 'pointer' }}
              >
                {strategy?.[p]?.handle || PROFILE_LABEL[p]}
              </button>
            ))}
            <button
              onClick={() => setShowProfileConfig((v) => !v)}
              title="Configurar perfil (foto, nome, @)"
              style={{ ...jakarta, border: '1px solid var(--border-inner)', color: 'var(--text-ter)', fontSize: '0.75rem', padding: '0.4rem 0.7rem', borderRadius: 6, background: showProfileConfig ? 'var(--bg-inner)' : 'transparent', cursor: 'pointer' }}
            >
              ⚙
            </button>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', borderBottom: '1px solid var(--border-main)' }} />
      </div>

      {showProfileConfig && strategy && (
        <ProfileConfigPanel
          profile={profile}
          strategy={strategy}
          H={H}
          onClose={() => setShowProfileConfig(false)}
          onSaved={(s) => setStrategy(s)}
        />
      )}

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
              onPrev={() => goToOffset(-1)}
              onNext={() => goToOffset(1)}
              hasPrev={selectedIndex > 0}
              hasNext={selectedIndex !== -1 && selectedIndex < flatIds.length - 1}
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
  idea, H, pillarName, onPatch, onStatus, onRemove, onPrev, onNext, hasPrev, hasNext,
}: {
  idea: Idea;
  H: Record<string, string>;
  pillarName: (k: string) => string;
  onPatch: (p: Partial<Idea>) => void;
  onStatus: (s: Status) => void;
  onRemove: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const [busy, setBusy] = useState<null | 'research' | 'draft' | 'render' | 'save' | 'cover' | 'export'>(null);
  const [err, setErr] = useState<string | null>(null);
  const [caption, setCaption] = useState(idea.caption || '');
  const [slides, setSlides] = useState<Slide[]>(idea.slides || []);
  const [research, setResearch] = useState<Research | null>(idea.research || null);
  const [template, setTemplate] = useState<Template>((idea.template as Template) || 'reveny');
  const [copied, setCopied] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<number>(-1);

  const dirty =
    caption !== (idea.caption || '') ||
    template !== ((idea.template as Template) || 'reveny') ||
    JSON.stringify(slides) !== JSON.stringify(idea.slides || []);

  async function generateResearch() {
    setBusy('research'); setErr(null);
    try {
      const r = await fetch(`${PROXY}/api/hq/content/ideas/${idea.id}/research`, { method: 'POST', headers: H });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao pesquisar');
      setResearch(data.research || null);
      onPatch({ research: data.research });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro');
    } finally {
      setBusy(null);
    }
  }

  function editResearch(patch: Partial<Research>) {
    setResearch((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function editArcBeat(i: number, patch: Partial<ArcBeat>) {
    setResearch((prev) => (prev
      ? { ...prev, narrative_arc: prev.narrative_arc.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) }
      : prev));
  }

  async function generateCoverImage() {
    const r = await fetch(`${PROXY}/api/hq/content/ideas/${idea.id}/cover`, { method: 'POST', headers: H });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Erro ao gerar imagem de capa');
    setSlides(data.slides || []);
    onPatch({ slides: data.slides, image_paths: data.image_paths });
  }

  async function generateDraft() {
    setBusy('draft'); setErr(null);
    try {
      // se tem pesquisa editada na tela, salva antes — o backend lê o
      // research já persistido, não o que vem no corpo do /draft
      if (research) {
        await fetch(`${PROXY}/api/hq/content/ideas/${idea.id}`, {
          method: 'PATCH', headers: H, body: JSON.stringify({ research }),
        });
      }
      const r = await fetch(`${PROXY}/api/hq/content/ideas/${idea.id}/draft`, {
        method: 'POST', headers: H, body: JSON.stringify({ template }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao gerar carrossel');
      setCaption(data.caption || '');
      setSlides(data.slides || []);
      onPatch({ research, caption: data.caption, slides: data.slides, image_paths: data.image_paths, status: data.status, template });
      // a primeira entrega já sai com a capa pronta — sem isso o usuário
      // recebia um carrossel "incompleto" e precisava lembrar de voltar e
      // clicar num segundo botão pra ganhar a imagem de fundo do slide 1.
      // Só ideias com pesquisa suportam capa (o endpoint exige research), e
      // só o template "reveny" desenha foto no slide 1 (quote/loud ignoram).
      if (research && (template === 'reveny' || template === 'cinema')) {
        setBusy('cover');
        await generateCoverImage();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro');
    } finally {
      setBusy(null);
    }
  }

  async function generateCover() {
    setBusy('cover'); setErr(null);
    try {
      await generateCoverImage();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro');
    } finally {
      setBusy(null);
    }
  }

  async function saveAndRender() {
    setBusy('render'); setErr(null);
    try {
      // salva caption/slides/template
      await fetch(`${PROXY}/api/hq/content/ideas/${idea.id}`, {
        method: 'PATCH', headers: H, body: JSON.stringify({ caption, slides, template }),
      });
      // re-renderiza
      const r = await fetch(`${PROXY}/api/hq/content/ideas/${idea.id}/render`, {
        method: 'POST', headers: H, body: JSON.stringify({ slides, template }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao renderizar');
      onPatch({ caption, slides, template, image_paths: data.image_paths });
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

  async function exportZip() {
    if (!imgs.length) return;
    setBusy('export'); setErr(null);
    try {
      const zip = new JSZip();
      await Promise.all(imgs.map(async (u, i) => {
        const versioned = idea.updated_at ? `${u}?v=${encodeURIComponent(idea.updated_at)}` : u;
        const r = await fetch(versioned);
        if (!r.ok) throw new Error(`Falha ao baixar slide ${i + 1}`);
        zip.file(`slide-${String(i + 1).padStart(2, '0')}.png`, await r.blob());
      }));
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carrossel-${idea.pillar}-${idea.id.slice(0, 8)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao exportar');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ ...card, padding: '1.25rem' }} className="sticky top-6">
      <input ref={uploadRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />

      {/* topo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', gap: 8 }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#7aaec7', background: '#7aaec715', padding: '0.15rem 0.5rem', borderRadius: 4 }}>
          {pillarName(idea.pillar)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            title="Ideia anterior"
            style={{ display: 'flex', color: hasPrev ? 'var(--text-ter)' : 'var(--text-dim)', background: 'none', border: 'none', cursor: hasPrev ? 'pointer' : 'default', opacity: hasPrev ? 1 : 0.4, padding: 2 }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            title="Próxima ideia"
            style={{ display: 'flex', color: hasNext ? 'var(--text-ter)' : 'var(--text-dim)', background: 'none', border: 'none', cursor: hasNext ? 'pointer' : 'default', opacity: hasNext ? 1 : 0.4, padding: 2 }}
          >
            <ChevronRight size={16} />
          </button>
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
        !research ? (
          <button
            onClick={generateResearch}
            disabled={busy === 'research'}
            style={{ ...jakarta, width: '100%', background: '#7aaa4a', color: 'white', fontSize: '0.78rem', fontWeight: 700, padding: '0.6rem', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: busy === 'research' ? 0.5 : 1 }}
          >
            {busy === 'research' ? 'Pesquisando (~15s)…' : 'Pesquisar →'}
          </button>
        ) : (
          <>
            <div style={{ ...sectionLabel, marginBottom: '0.6rem' }}>Pesquisa</div>
            <div style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-inner)', borderRadius: 6, padding: '0.75rem', marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.62rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem' }}>Dor</label>
              <textarea
                value={research.pain}
                onChange={(e) => editResearch({ pain: e.target.value })}
                rows={2}
                style={{ ...inputStyle, marginBottom: '0.75rem' }}
              />
              <label style={{ fontSize: '0.62rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem' }}>
                Gancho ({research.hook_type})
              </label>
              <input
                value={research.hook}
                onChange={(e) => editResearch({ hook: e.target.value })}
                style={{ ...inputStyle, marginBottom: '0.75rem', fontWeight: 600 }}
              />
              <label style={{ fontSize: '0.62rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.35rem' }}>Arco narrativo</label>
              <div className="flex flex-col gap-2" style={{ marginBottom: research.proof ? '0.75rem' : 0 }}>
                {research.narrative_arc.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.6rem', color: '#7aaec7', background: '#7aaec715', padding: '0.3rem 0.4rem', borderRadius: 4, flexShrink: 0, minWidth: 64, textAlign: 'center' }}>
                      {b.beat}
                    </span>
                    <input
                      value={b.note}
                      onChange={(e) => editArcBeat(i, { note: e.target.value })}
                      style={{ ...inputStyle, fontSize: '0.78rem' }}
                    />
                  </div>
                ))}
              </div>
              {research.proof ? (
                <>
                  <label style={{ fontSize: '0.62rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem' }}>Prova/exemplo</label>
                  <input
                    value={research.proof}
                    onChange={(e) => editResearch({ proof: e.target.value })}
                    style={inputStyle}
                  />
                </>
              ) : null}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>Estilo do carrossel</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['reveny', 'quote', 'loud', 'cinema'] as Template[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTemplate(t)}
                    title={TEMPLATE_DESC[t]}
                    style={template === t
                      ? { ...jakarta, flex: 1, background: '#4a7fa5', color: 'white', fontSize: '0.72rem', fontWeight: 700, padding: '0.5rem', borderRadius: 6, border: 'none', cursor: 'pointer' }
                      : { ...jakarta, flex: 1, background: 'transparent', color: 'var(--text-ter)', fontSize: '0.72rem', fontWeight: 700, padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-inner)', cursor: 'pointer' }}
                  >
                    {TEMPLATE_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={generateDraft}
                disabled={busy !== null}
                style={{ ...jakarta, flex: 1, background: '#7aaa4a', color: 'white', fontSize: '0.78rem', fontWeight: 700, padding: '0.6rem', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: busy ? 0.5 : 1 }}
              >
                {busy === 'draft' ? 'Gerando carrossel (~20s)…' : 'Gerar carrossel a partir da pesquisa →'}
              </button>
              <button
                onClick={generateResearch}
                disabled={busy !== null}
                title="Pesquisar de novo"
                style={{ ...jakarta, background: 'transparent', color: 'var(--text-ter)', fontSize: '0.75rem', padding: '0.6rem 0.9rem', borderRadius: 6, border: '1px solid var(--border-inner)', cursor: 'pointer', opacity: busy ? 0.5 : 1 }}
              >
                {busy === 'research' ? '…' : 'Pesquisar de novo'}
              </button>
            </div>
          </>
        )
      ) : (
        <>
          {/* estilo do carrossel — trocar aqui não re-renderiza sozinho,
              precisa "Salvar e re-renderizar" (dirty já considera o template). */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>Estilo do carrossel</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['reveny', 'quote', 'loud', 'cinema'] as Template[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  title={TEMPLATE_DESC[t]}
                  style={template === t
                    ? { ...jakarta, flex: 1, background: '#4a7fa5', color: 'white', fontSize: '0.72rem', fontWeight: 700, padding: '0.5rem', borderRadius: 6, border: 'none', cursor: 'pointer' }
                    : { ...jakarta, flex: 1, background: 'transparent', color: 'var(--text-ter)', fontSize: '0.72rem', fontWeight: 700, padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-inner)', cursor: 'pointer' }}
                >
                  {TEMPLATE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {/* preview dos slides renderizados — cache-bust pelo updated_at: o
              arquivo é sempre upado no MESMO nome (slide-N.png, pra manter o
              link de download estável), então sem isso o navegador continua
              mostrando a imagem antiga em cache até um refresh forçado. */}
          {imgs.length > 0 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: '1rem' }}>
              {imgs.map((u, i) => {
                const versioned = idea.updated_at ? `${u}?v=${encodeURIComponent(idea.updated_at)}` : u;
                return (
                  <a key={u + (idea.updated_at || '')} href={u} download={`slide-${i + 1}.png`} title={`Baixar slide ${i + 1}`} style={{ flexShrink: 0 }}>
                    <img src={versioned} alt={`slide ${i + 1}`} style={{ width: 132, height: 165, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-inner)' }} />
                  </a>
                );
              })}
            </div>
          )}

          {imgs.length > 0 && (
            <button
              onClick={exportZip}
              disabled={busy !== null}
              style={{ ...jakarta, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', background: 'transparent', color: '#4a7fa5', fontSize: '0.75rem', fontWeight: 700, padding: '0.55rem', borderRadius: 6, border: '1px solid var(--border-inner)', cursor: 'pointer', opacity: busy ? 0.5 : 1, marginBottom: '1rem' }}
            >
              <Download size={14} />
              {busy === 'export' ? 'Exportando…' : `Exportar carrossel (${imgs.length} slides, .zip)`}
            </button>
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
                  value={s.kicker || ''}
                  onChange={(e) => editSlide(i, { kicker: e.target.value })}
                  placeholder="Categoria do slide (pill no topo, ex: A CAUSA REAL)"
                  style={{ ...inputStyle, fontSize: '0.68rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}
                />
                <input
                  value={s.headline}
                  onChange={(e) => editSlide(i, { headline: e.target.value })}
                  placeholder={template === 'cinema' && (s.kind || (i === 0 ? 'hook' : '')) === 'hook'
                    ? 'Título do slide — use **palavra** pra destacar em cor'
                    : 'Título do slide'}
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

          {/* imagem de capa (Gemini) só existe nos templates "reveny" e "cinema"
              — quote/loud não desenham foto no slide 1, gerar aqui seria gasto à toa. */}
          {(template === 'reveny' || template === 'cinema') && (
            <div style={{ display: 'flex', gap: 8, marginBottom: '0.6rem' }}>
              {research ? (
                <button
                  onClick={generateCover}
                  disabled={busy !== null}
                  style={{ ...jakarta, flex: 1, background: 'transparent', color: '#4a7fa5', fontSize: '0.75rem', fontWeight: 700, padding: '0.55rem', borderRadius: 6, border: '1px solid var(--border-inner)', cursor: 'pointer', opacity: busy ? 0.5 : 1 }}
                >
                  {busy === 'cover' ? 'Gerando imagem (~1min)…' : 'Gerar imagem de capa →'}
                </button>
              ) : (
                // ideia gerada antes do research.skill existir (sem `research`) — sem
                // isso o botão de capa fica preso pra sempre, já que a etapa de
                // pesquisa só aparecia antes do carrossel existir.
                <button
                  onClick={generateResearch}
                  disabled={busy !== null}
                  title="Essa ideia foi gerada antes da etapa de pesquisa existir — gere a pesquisa pra poder criar a imagem de capa"
                  style={{ ...jakarta, flex: 1, background: 'transparent', color: 'var(--text-ter)', fontSize: '0.75rem', fontWeight: 700, padding: '0.55rem', borderRadius: 6, border: '1px solid var(--border-inner)', cursor: 'pointer', opacity: busy ? 0.5 : 1 }}
                >
                  {busy === 'research' ? 'Pesquisando (~15s)…' : 'Pesquisar (pra habilitar a capa) →'}
                </button>
              )}
            </div>
          )}
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
