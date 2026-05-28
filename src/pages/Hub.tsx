import { useNavigate } from 'react-router-dom';

const AGENTS = [
  {
    path: '/pm',
    label: 'PM de Features',
    desc: 'Ideias → ICE Score → backlog organizado entre sessões.',
    color: '#7aaa4a',
    badge: 'PM',
    badgeBg: '#7aaa4a',
    tags: ['features', 'aprovadas'],
    tagColors: ['#7aaa4a', '#7aaa4a'],
  },
  {
    path: '/builder',
    label: 'Builder de Features',
    desc: 'Features aprovadas → PRD completo + tasks para Claude Code.',
    color: '#60a5fa',
    badge: 'B',
    badgeBg: '#60a5fa',
    tags: ['PRDs gerados'],
    tagColors: ['#60a5fa'],
  },
  {
    path: '/pipeline',
    label: 'Pipeline Comercial',
    desc: 'CRM leve — leads, follow-ups e histórico em linguagem natural.',
    color: '#f59e0b',
    badge: 'P',
    badgeBg: '#f59e0b',
    tags: ['leads', 'clientes', 'R$0'],
    tagColors: ['#f59e0b', '#f59e0b', '#f59e0b'],
  },
  {
    path: '/carteira',
    label: 'Agente de Carteira',
    desc: 'Base ativa — atividade, retenção, churn e saúde da carteira.',
    color: '#34d399',
    badge: 'C',
    badgeBg: '#34d399',
    tags: ['clientes ativos', 'MRR real'],
    tagColors: ['#34d399', '#34d399'],
  },
  {
    path: '/conteudo',
    label: 'Conteúdo & LinkedIn',
    desc: 'Posts alinhados ao posicionamento da Reveny, prontos pra publicar.',
    color: '#a78bfa',
    badge: 'C',
    badgeBg: '#a78bfa',
    tags: ['posts', 'publicados'],
    tagColors: ['#a78bfa', '#a78bfa'],
  },
];

export default function Hub() {
  const navigate = useNavigate();

  return (
    <div className="p-10 max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
          Reveny HQ
        </h1>
        <p className="mono text-white/30">seu workspace de agentes</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3 mb-10">
        {[
          { label: 'FEATURES', value: '0', sub: '0 aprovadas', color: '#7aaa4a' },
          { label: 'PRDs',     value: '0', sub: '0 tasks',     color: '#60a5fa' },
          { label: 'LEADS',    value: '0', sub: 'R$0 MRR',     color: '#f59e0b' },
          { label: 'POSTS',    value: '0', sub: '0 publicados', color: '#a78bfa' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[#141414] border border-white/5 rounded-xl p-5"
            style={{ borderTop: `2px solid ${s.color}` }}
          >
            <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
            <div className="mono text-white/35">{s.label}</div>
            <div className="text-xs text-white/25 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-2 gap-4">
        {AGENTS.map((a) => (
          <button
            key={a.path}
            onClick={() => navigate(a.path)}
            className="text-left bg-[#141414] border border-white/5 rounded-xl p-6 hover:border-white/10 hover:bg-[#181818] transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-black text-sm flex-shrink-0"
                style={{ background: a.badgeBg }}
              >
                {a.badge}
              </div>
              <div>
                <div className="font-semibold text-white text-sm group-hover:text-white transition-colors">
                  {a.label}
                </div>
              </div>
            </div>
            <p className="text-white/40 text-xs leading-relaxed mb-4">{a.desc}</p>
            <div className="flex gap-2 flex-wrap">
              {a.tags.map((tag, i) => (
                <span
                  key={tag}
                  className="mono px-2 py-0.5 rounded text-[10px]"
                  style={{ color: a.tagColors[i], background: `${a.tagColors[i]}15` }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Activity */}
      <div className="mt-8">
        <div className="mono text-white/25 mb-3">atividade recente</div>
        <div className="text-white/20 text-sm">Nenhuma atividade ainda.</div>
      </div>
    </div>
  );
}
