import { useState } from 'react';

type Platform = 'linkedin' | 'tweet' | 'story';
type PostStatus = 'rascunho' | 'pronto' | 'publicado';

interface Post {
  id: string;
  platform: Platform;
  content: string;
  status: PostStatus;
  created_at: string;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  linkedin: 'LinkedIn',
  tweet: 'Tweet',
  story: 'Story',
};

const STATUS_COLORS: Record<PostStatus, string> = {
  rascunho: '#f59e0b',
  pronto: '#60a5fa',
  publicado: '#7aaa4a',
};

export default function Conteudo() {
  const [platform, setPlatform] = useState<Platform>('linkedin');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<PostStatus | 'todos'>('todos');

  const filtered = filter === 'todos' ? posts : posts.filter((p) => p.status === filter);

  async function handleGenerate() {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      // TODO: chamar /api/hq/content/generate
      const post: Post = {
        id: Date.now().toString(),
        platform,
        content: `[${PLATFORM_LABELS[platform]}] Rascunho baseado em: "${input}"\n\n_Claude irá gerar o conteúdo real quando a API estiver conectada._`,
        status: 'rascunho',
        created_at: new Date().toISOString(),
      };
      setPosts((prev) => [post, ...prev]);
      setInput('');
    } finally {
      setLoading(false);
    }
  }

  function updateStatus(id: string, status: PostStatus) {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  return (
    <div className="p-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Conteúdo & LinkedIn</h1>
        <p className="mono text-white/30">calendário editorial</p>
      </div>

      {/* Input */}
      <div className="bg-[#141414] border border-white/5 rounded-xl p-5 mb-6">
        <div className="mono text-[#a78bfa]/60 mb-4">● gerar post</div>

        {/* Platform tabs */}
        <div className="flex gap-2 mb-4">
          {(['linkedin', 'tweet', 'story'] as Platform[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                platform === p
                  ? 'bg-[#a78bfa] text-black'
                  : 'border border-white/10 text-white/40 hover:text-white/60'
              }`}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
          placeholder={
            platform === 'linkedin'
              ? 'Ex: estamos lançando templates novos para moda, quero mostrar como a IA gera o banner...'
              : platform === 'tweet'
              ? 'Ex: o que aprendi buildando um gerador de email com IA em 3 meses...'
              : 'Ex: bastidores do desenvolvimento do novo template wellness...'
          }
          rows={3}
          className="w-full bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none resize-none"
        />
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
          <span className="text-white/20 text-xs">voz: direto, sem hype, founder real</span>
          <button
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
            className="bg-[#a78bfa] hover:bg-[#b99ffb] disabled:opacity-40 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Gerando...' : 'Gerar →'}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          {(['todos', 'rascunho', 'pronto', 'publicado'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                filter === f
                  ? 'bg-white/10 text-white'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {posts.length > 0 && (
          <button
            onClick={() => setPosts([])}
            className="text-white/20 text-xs hover:text-white/40 transition-colors"
          >
            limpar tudo
          </button>
        )}
      </div>

      <div className="mono text-white/25 mb-3">posts</div>

      {filtered.length === 0 ? (
        <div className="text-white/20 text-sm text-center py-8">
          {posts.length === 0 ? 'Nenhum post ainda.' : 'Nenhum post nessa categoria.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-[#141414] border border-white/5 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="mono text-[#a78bfa] text-[10px]">
                    {PLATFORM_LABELS[p.platform]}
                  </span>
                  <span
                    className="mono text-[10px] px-2 py-0.5 rounded"
                    style={{
                      color: STATUS_COLORS[p.status],
                      background: `${STATUS_COLORS[p.status]}15`,
                    }}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(p.content)}
                    className="text-white/20 text-xs hover:text-white/50 transition-colors"
                  >
                    copiar
                  </button>
                  <select
                    value={p.status}
                    onChange={(e) => updateStatus(p.id, e.target.value as PostStatus)}
                    className="bg-transparent text-white/25 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="rascunho">rascunho</option>
                    <option value="pronto">pronto</option>
                    <option value="publicado">publicado</option>
                  </select>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">
                {p.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
