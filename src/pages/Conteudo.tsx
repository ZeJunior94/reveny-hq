import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

type Platform = 'linkedin' | 'tweet' | 'story';
type PostStatus = 'rascunho' | 'pronto' | 'publicado';

interface Post { id: string; platform: Platform; topic: string; content: string; status: PostStatus; created_at: string; }

const PLATFORM_LABELS: Record<Platform, string> = { linkedin: 'LinkedIn', tweet: 'Tweet', story: 'Story' };
const PLATFORM_COLORS: Record<Platform, string> = { linkedin: '#4a7fa5', tweet: '#7aaec7', story: '#a78bfa' };
const STATUS_COLORS: Record<PostStatus, string> = { rascunho: '#f59e0b', pronto: '#4a7fa5', publicado: '#7aaa4a' };
const PLACEHOLDERS: Record<Platform, string> = {
  linkedin: 'Ex: estamos lançando templates novos para moda, quero mostrar como a IA gera o banner...',
  tweet: 'Ex: o que aprendi buildando um gerador de email com IA em 3 meses...',
  story: 'Ex: bastidores do desenvolvimento do novo template wellness...',
};
const FILTER_LABELS: Record<PostStatus | 'todos', string> = { todos: 'Todos', rascunho: 'Rascunho', pronto: 'Pronto', publicado: 'Publicado' };

const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
const card = { background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 8 };
const sectionLabel: React.CSSProperties = { fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.18em' };

function Skel({ className }: { className?: string }) {
  return <div className={`rounded animate-pulse ${className ?? ''}`} style={{ background: 'var(--skel-bg)' }} />;
}

export default function Conteudo() {
  const { token } = useAuth();
  const [platform, setPlatform] = useState<Platform>('linkedin');
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [posts, setPosts]       = useState<Post[]>([]);
  const [filter, setFilter]     = useState<PostStatus | 'todos'>('todos');
  const [selected, setSelected] = useState<Post | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [copied, setCopied]     = useState<string | null>(null);

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const filtered = filter === 'todos' ? posts : posts.filter(p => p.status === filter);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`${PROXY}/api/hq/content/posts`, { headers: authHeaders });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Erro ao carregar');
        setPosts(data);
        if (data.length > 0) setSelected(data[0]);
      } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro ao carregar posts'); }
      finally { setFetching(false); }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate() {
    if (!input.trim() || loading) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${PROXY}/api/hq/content/generate`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify({ platform, topic: input.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro');
      setPosts(prev => [data, ...prev]);
      setSelected(data);
      setInput('');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro'); }
    finally { setLoading(false); }
  }

  async function updateStatus(id: string, status: PostStatus) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev);
    await fetch(`${PROXY}/api/hq/content/posts/${id}`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ status }) });
  }

  async function deletePost(id: string) {
    if (!confirm('Remover este post?')) return;
    setPosts(prev => prev.filter(p => p.id !== id));
    if (selected?.id === id) setSelected(null);
    await fetch(`${PROXY}/api/hq/content/posts/${id}`, { method: 'DELETE', headers: authHeaders });
  }

  async function clearAll() {
    if (!confirm('Remover todos os posts?')) return;
    const ids = posts.map(p => p.id);
    setPosts([]); setSelected(null);
    await Promise.all(ids.map(id => fetch(`${PROXY}/api/hq/content/posts/${id}`, { method: 'DELETE', headers: authHeaders })));
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  const postsByPlatform = (p: Platform) => posts.filter(x => x.platform === p).length;

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ ...jakarta, fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.04em', color: 'var(--text-pri)', lineHeight: 1.1 }}>
              Conteúdo & LinkedIn
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-ter)', marginTop: '0.3rem' }}>
              Calendário editorial
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {(['linkedin', 'tweet', 'story'] as Platform[]).map(p => (
              <span key={p} style={{ fontSize: '0.72rem', color: 'var(--text-ter)' }}>
                <span style={{ ...jakarta, fontWeight: 800, color: PLATFORM_COLORS[p] }}>{postsByPlatform(p)}</span>{' '}{PLATFORM_LABELS[p]}
              </span>
            ))}
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', borderBottom: '1px solid var(--border-main)' }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-4 md:gap-6">
        {/* Left */}
        <div className="min-w-0">
          {/* Input */}
          <div style={{ ...card, padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ ...sectionLabel, color: `${PLATFORM_COLORS[platform]}99`, marginBottom: '0.85rem' }}>● Gerar post</div>
            <div style={{ borderBottom: '1px solid var(--border-inner)', marginBottom: '1rem' }} />

            <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
              {(['linkedin', 'tweet', 'story'] as Platform[]).map(p => (
                <button key={p} onClick={() => setPlatform(p)} style={platform === p
                  ? { background: PLATFORM_COLORS[p], color: p === 'tweet' ? '#0b1520' : 'white', fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: 6, border: 'none', cursor: 'pointer' }
                  : { border: `1px solid ${PLATFORM_COLORS[p]}30`, color: `${PLATFORM_COLORS[p]}70`, fontSize: '0.72rem', padding: '0.3rem 0.75rem', borderRadius: 6, background: 'transparent', cursor: 'pointer' }
                }>{PLATFORM_LABELS[p]}</button>
              ))}
            </div>

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
              placeholder={PLACEHOLDERS[platform]}
              rows={3}
              className="w-full bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none resize-none leading-relaxed"
              style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-inner)', borderRadius: 6, padding: '0.65rem 0.85rem', color: 'var(--text-sec)', fontSize: '0.82rem', resize: 'none', width: '100%', outline: 'none', lineHeight: 1.6 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-inner)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-ter)' }}>voz: direto, sem hype, founder real</span>
              <button
                onClick={handleGenerate}
                disabled={loading || !input.trim()}
                style={{ background: PLATFORM_COLORS[platform], color: platform === 'tweet' ? '#0b1520' : 'white', fontSize: '0.75rem', fontWeight: 700, padding: '0.45rem 1rem', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: loading || !input.trim() ? 0.4 : 1 }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="w-3 h-3 border border-white/30 border-t-white/80 rounded-full animate-spin" />
                    Gerando...
                  </span>
                ) : 'Gerar →'}
              </button>
            </div>
          </div>

          {error && <div style={{ marginBottom: '1rem', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 6, padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.82rem' }}>{error}</div>}

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1rem' }}>
            {(['todos', 'rascunho', 'pronto', 'publicado'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={filter === f
                ? { background: 'rgba(74,127,165,.15)', color: 'var(--text-pri)', border: '1px solid rgba(74,127,165,.25)', fontSize: '0.72rem', fontWeight: 500, padding: '0.3rem 0.75rem', borderRadius: 6, cursor: 'pointer' }
                : { border: '1px solid var(--border-inner)', color: 'var(--text-ter)', fontSize: '0.72rem', padding: '0.3rem 0.75rem', borderRadius: 6, background: 'transparent', cursor: 'pointer' }
              }>{FILTER_LABELS[f]}</button>
            ))}
          </div>

          {/* Posts header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={sectionLabel}>Posts</span>
            {!fetching && posts.length > 0 && (
              <button onClick={clearAll} style={{ fontSize: '0.68rem', color: 'var(--text-sec)', background: 'transparent', border: '1px solid var(--border-main)', borderRadius: 6, padding: '0.25rem 0.65rem', cursor: 'pointer' }}>limpar tudo</button>
            )}
          </div>

          {/* List */}
          {fetching ? (
            <div className="flex flex-col gap-2">
              {[1,2,3].map(i => (
                <div key={i} style={{ ...card, padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: '0.5rem' }}><Skel className="h-3 w-14" /><Skel className="h-3 w-12" /></div>
                  <Skel className="h-3 w-full mb-1.5" /><Skel className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-ter)', padding: '1rem 0' }}>
              {posts.length === 0 ? 'Nenhum post ainda.' : 'Nenhum post nessa categoria.'}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map(p => (
                <button key={p.id} onClick={() => setSelected(p)} className="text-left transition-all" style={selected?.id === p.id
                  ? { background: 'var(--bg-inner)', border: '1px solid rgba(74,127,165,.25)', borderRadius: 8, padding: '1rem' }
                  : { ...card, padding: '1rem' }
                }>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: PLATFORM_COLORS[p.platform] }}>{PLATFORM_LABELS[p.platform]}</span>
                    <span style={{ fontSize: '0.62rem', color: STATUS_COLORS[p.status], background: `${STATUS_COLORS[p.status]}15`, padding: '0.1rem 0.4rem', borderRadius: 4 }}>{p.status}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-ter)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.content}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Detail */}
        <div className="min-w-0">
          {selected ? (
            <div style={{ ...card, padding: '1.25rem' }} className="sticky top-6">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: PLATFORM_COLORS[selected.platform] }}>{PLATFORM_LABELS[selected.platform]}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <select value={selected.status} onChange={e => updateStatus(selected.id, e.target.value as PostStatus)}
                    style={{ background: 'var(--input-bg)', color: 'var(--text-sec)', fontSize: '0.65rem', border: 'none', cursor: 'pointer', borderRadius: 4, padding: '0.15rem 0.4rem' }}>
                    <option value="rascunho">rascunho</option>
                    <option value="pronto">pronto</option>
                    <option value="publicado">publicado</option>
                  </select>
                  <button onClick={() => handleCopy(selected.id, selected.content)} style={{ fontSize: '0.72rem', color: 'var(--text-ter)', background: 'none', border: 'none', cursor: 'pointer' }} className="hover:text-white/60 transition-colors">
                    {copied === selected.id ? '✓ copiado' : 'copiar'}
                  </button>
                  <button onClick={() => deletePost(selected.id)} style={{ fontSize: '0.9rem', color: 'var(--text-ter)', background: 'none', border: 'none', cursor: 'pointer' }} className="hover:text-red-400 transition-colors">×</button>
                </div>
              </div>
              {selected.topic && <div style={{ fontSize: '0.65rem', color: 'var(--text-ter)', marginBottom: '0.85rem' }}>tema: {selected.topic}</div>}
              <p style={{ fontSize: '0.82rem', color: 'var(--text-sec)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.content}</p>
              {selected.platform === 'tweet' && (
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-main)' }}>
                  <span style={{ fontSize: '0.65rem', color: selected.content.length > 280 ? '#f87171' : 'var(--text-ter)' }}>
                    {selected.content.length}/280 chars
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ ...card, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-ter)' }}>Selecione um post</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
