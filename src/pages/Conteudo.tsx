import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

type Platform = 'linkedin' | 'tweet' | 'story';
type PostStatus = 'rascunho' | 'pronto' | 'publicado';

interface Post {
  id: string;
  platform: Platform;
  topic: string;
  content: string;
  status: PostStatus;
  created_at: string;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  linkedin: 'LinkedIn',
  tweet: 'Tweet',
  story: 'Story',
};

const PLATFORM_COLORS: Record<Platform, string> = {
  linkedin: '#60a5fa',
  tweet: '#38bdf8',
  story: '#a78bfa',
};

const STATUS_COLORS: Record<PostStatus, string> = {
  rascunho: '#f59e0b',
  pronto: '#60a5fa',
  publicado: '#7aaa4a',
};

const PLACEHOLDERS: Record<Platform, string> = {
  linkedin: 'Ex: estamos lançando templates novos para moda, quero mostrar como a IA gera o banner...',
  tweet: 'Ex: o que aprendi buildando um gerador de email com IA em 3 meses...',
  story: 'Ex: bastidores do desenvolvimento do novo template wellness...',
};

const INPUT_CLS =
  'w-full bg-[#1a1a1a] border border-white/6 rounded-lg px-3 py-2.5 text-white/80 text-sm leading-relaxed resize-none focus:outline-none focus:border-white/20 focus:bg-[#1e1e1e] transition-all placeholder-white/20';

function Skel({ className }: { className?: string }) {
  return <div className={`bg-white/5 rounded animate-pulse ${className ?? ''}`} />;
}

export default function Conteudo() {
  const { token } = useAuth();
  const [platform, setPlatform] = useState<Platform>('linkedin');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<PostStatus | 'todos'>('todos');
  const [selected, setSelected] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const filtered = filter === 'todos' ? posts : posts.filter((p) => p.status === filter);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`${PROXY}/api/hq/content/posts`, { headers: authHeaders });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Erro ao carregar');
        setPosts(data);
        if (data.length > 0) setSelected(data[0]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar posts');
      } finally {
        setFetching(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${PROXY}/api/hq/content/generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ platform, topic: input.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro na geração');
      setPosts((prev) => [data, ...prev]);
      setSelected(data);
      setInput('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: PostStatus) {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : prev);
    await fetch(`${PROXY}/api/hq/content/posts/${id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status }),
    });
  }

  async function deletePost(id: string) {
    if (!confirm('Remover este post?')) return;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    if (selected?.id === id) setSelected(null);
    await fetch(`${PROXY}/api/hq/content/posts/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  const postsByPlatform = (p: Platform) => posts.filter((x) => x.platform === p).length;

  return (
    <div className="p-10 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Conteúdo & LinkedIn</h1>
          <p className="mono text-white/30 text-sm">calendário editorial</p>
        </div>
        <div className="flex gap-4">
          {(['linkedin', 'tweet', 'story'] as Platform[]).map((p) => (
            <span key={p} className="text-xs text-white/30">
              <span className="font-bold" style={{ color: PLATFORM_COLORS[p] }}>
                {postsByPlatform(p)}
              </span>{' '}
              {PLATFORM_LABELS[p]}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1.2fr] gap-6">
        {/* Left: Input + List */}
        <div className="min-w-0">
          {/* Input */}
          <div className="bg-[#141414] border border-white/5 rounded-xl p-5 mb-4">
            <div className="mono text-xs mb-4" style={{ color: `${PLATFORM_COLORS[platform]}70` }}>● gerar post</div>

            {/* Platform tabs */}
            <div className="flex gap-2 mb-4">
              {(['linkedin', 'tweet', 'story'] as Platform[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={platform === p
                    ? { background: PLATFORM_COLORS[p], color: '#000' }
                    : { border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }
                  }
                >
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
              placeholder={PLACEHOLDERS[platform]}
              rows={3}
              className={INPUT_CLS}
            />
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
              <span className="text-white/20 text-xs">⌘+Enter para gerar</span>
              <button
                onClick={handleGenerate}
                disabled={loading || !input.trim()}
                className="disabled:opacity-40 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                style={{ background: PLATFORM_COLORS[platform] }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border border-black/30 border-t-black/80 rounded-full animate-spin" />
                    Gerando...
                  </span>
                ) : 'Gerar →'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Filter */}
          <div className="flex items-center gap-1.5 mb-3">
            {(['todos', 'rascunho', 'pronto', 'publicado'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors mono ${
                  filter === f ? 'bg-white/8 text-white/70' : 'text-white/25 hover:text-white/45'
                }`}
              >
                {f}
              </button>
            ))}
            {!fetching && (
              <span className="ml-auto mono text-white/18 text-xs">{filtered.length}</span>
            )}
          </div>

          {/* List */}
          {fetching ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#141414] border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Skel className="h-3 w-14" />
                    <Skel className="h-3 w-12" />
                  </div>
                  <Skel className="h-3 w-full mb-1.5" />
                  <Skel className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-white/18 text-sm py-4">
              {posts.length === 0 ? 'Nenhum post ainda.' : 'Nenhum post nessa categoria.'}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`text-left rounded-xl p-4 transition-all border group ${
                    selected?.id === p.id
                      ? 'bg-[#1a1a1a] border-white/12'
                      : 'bg-[#141414] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="mono text-[10px] font-semibold"
                      style={{ color: PLATFORM_COLORS[p.platform] }}
                    >
                      {PLATFORM_LABELS[p.platform]}
                    </span>
                    <span
                      className="mono text-[10px] px-1.5 py-0.5 rounded"
                      style={{ color: STATUS_COLORS[p.status], background: `${STATUS_COLORS[p.status]}15` }}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="text-white/45 text-xs leading-snug line-clamp-2">
                    {p.content}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Selected post detail */}
        <div className="min-w-0">
          {selected ? (
            <div className="bg-[#141414] border border-white/5 rounded-xl p-5 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <span
                  className="mono text-xs font-semibold"
                  style={{ color: PLATFORM_COLORS[selected.platform] }}
                >
                  {PLATFORM_LABELS[selected.platform]}
                </span>
                <div className="flex items-center gap-3">
                  <select
                    value={selected.status}
                    onChange={(e) => updateStatus(selected.id, e.target.value as PostStatus)}
                    className="bg-[#111] text-white/30 text-[10px] focus:outline-none cursor-pointer rounded px-1 py-0.5"
                  >
                    <option value="rascunho">rascunho</option>
                    <option value="pronto">pronto</option>
                    <option value="publicado">publicado</option>
                  </select>
                  <button
                    onClick={() => handleCopy(selected.id, selected.content)}
                    className="text-white/25 text-xs hover:text-white/55 transition-colors"
                  >
                    {copied === selected.id ? '✓ copiado' : 'copiar'}
                  </button>
                  <button
                    onClick={() => deletePost(selected.id)}
                    className="text-white/15 hover:text-red-400 text-xs transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              {selected.topic && (
                <div className="mono text-white/20 text-[10px] mb-3">
                  tema: {selected.topic}
                </div>
              )}

              <p className="text-white/65 text-sm leading-relaxed whitespace-pre-wrap">
                {selected.content}
              </p>

              {selected.platform === 'tweet' && (
                <div className="mt-4 pt-3 border-t border-white/5">
                  <span className={`mono text-[10px] ${selected.content.length > 280 ? 'text-red-400' : 'text-white/20'}`}>
                    {selected.content.length}/280 chars
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#141414] border border-white/5 rounded-xl p-5 flex items-center justify-center min-h-[220px]">
              <span className="text-white/15 text-sm">Selecione um post</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
