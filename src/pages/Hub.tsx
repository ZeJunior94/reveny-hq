import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

interface HubStats {
  features: { total: number; aprovadas: number };
  prds: { total: number; tasks: number };
  leads: { total: number; mrr: number; clientes: number };
  posts: { total: number; publicados: number };
}

const AGENTS = [
  {
    path: '/pm',
    abbr: 'PM',
    label: 'PM de Features',
    desc: 'Ideias → ICE Score → backlog organizado entre sessões.',
    color: '#7aaa4a',
  },
  {
    path: '/builder',
    abbr: 'B',
    label: 'Builder de Features',
    desc: 'Features aprovadas → PRD completo + tasks para Claude Code.',
    color: '#60a5fa',
  },
  {
    path: '/pipeline',
    abbr: 'P',
    label: 'Pipeline Comercial',
    desc: 'CRM leve — leads, follow-ups e histórico em linguagem natural.',
    color: '#f59e0b',
  },
  {
    path: '/carteira',
    abbr: 'W',
    label: 'Agente de Carteira',
    desc: 'Base ativa — atividade, retenção, churn e saúde da carteira.',
    color: '#34d399',
  },
  {
    path: '/conteudo',
    abbr: 'C',
    label: 'Conteúdo & LinkedIn',
    desc: 'Posts alinhados ao posicionamento da Reveny, prontos pra publicar.',
    color: '#a78bfa',
  },
];

function Skel({ className }: { className?: string }) {
  return <div className={`bg-white/5 rounded animate-pulse ${className ?? ''}`} />;
}

function fmtMrr(n: number) {
  if (n === 0) return 'R$0';
  if (n >= 1000) return `R$${(n / 1000).toFixed(1)}k`;
  return `R$${n.toFixed(0)}`;
}

function getChips(path: string, s: HubStats) {
  switch (path) {
    case '/pm':       return [
      { label: `${s.features.total} features`,       color: '#7aaa4a' },
      { label: `${s.features.aprovadas} aprovadas`,  color: '#7aaa4a' },
    ];
    case '/builder':  return [
      { label: `${s.prds.total} PRDs gerados`,       color: '#60a5fa' },
    ];
    case '/pipeline': return [
      { label: `${s.leads.total} leads`,             color: '#f59e0b' },
      { label: `${s.leads.clientes} clientes`,       color: '#f59e0b' },
      { label: fmtMrr(s.leads.mrr),                  color: '#34d399' },
    ];
    case '/carteira': return [
      { label: `${s.leads.clientes} clientes ativos`, color: '#34d399' },
    ];
    case '/conteudo': return [
      { label: `${s.posts.total} posts`,             color: '#a78bfa' },
      { label: `${s.posts.publicados} publicados`,   color: '#a78bfa' },
    ];
    default: return [];
  }
}

export default function Hub() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [stats, setStats] = useState<HubStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${PROXY}/api/hq/hub/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { if (!data.error) setStats(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const s = stats;

  const STATS = [
    {
      label: 'FEATURES',
      value: s ? String(s.features.total) : null,
      sub: s ? `${s.features.aprovadas} aprovadas` : null,
      color: '#7aaa4a',
    },
    {
      label: 'PRDs',
      value: s ? String(s.prds.total) : null,
      sub: s ? `${s.prds.tasks} tasks geradas` : null,
      color: '#60a5fa',
    },
    {
      label: 'LEADS',
      value: s ? String(s.leads.total) : null,
      sub: s ? `${s.leads.clientes} clientes · ${fmtMrr(s.leads.mrr)} MRR` : null,
      color: '#f59e0b',
    },
    {
      label: 'POSTS',
      value: s ? String(s.posts.total) : null,
      sub: s ? `${s.posts.publicados} publicados` : null,
      color: '#a78bfa',
    },
  ];

  return (
    <div className="p-10 max-w-5xl">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-3xl font-black tracking-tight mb-1">
          <span style={{ color: '#7aaa4a' }}>R</span>
          <span className="text-white">eveny HQ</span>
        </h1>
        <p className="mono text-white/30 text-sm">seu workspace de agentes</p>
      </div>
      <div className="border-t border-white/5 mb-8" />

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3 mb-10">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#141414] border border-white/5 rounded-xl p-5"
            style={{ borderTop: `2px solid ${stat.color}` }}
          >
            {loading ? (
              <>
                <Skel className="h-7 w-10 mb-2" />
                <Skel className="h-3 w-16 mb-1" />
                <Skel className="h-2.5 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold mb-1" style={{ color: stat.color }}>{stat.value ?? '—'}</div>
                <div className="mono text-white/35 text-[11px] mb-0.5">{stat.label}</div>
                <div className="text-xs text-white/25">{stat.sub ?? '—'}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Agent grid */}
      <div className="mono text-white/25 text-xs mb-3">AGENTES</div>
      <div className="grid grid-cols-2 gap-3 mb-10">
        {AGENTS.map((a) => (
          <button
            key={a.path}
            onClick={() => navigate(a.path)}
            className="text-left bg-[#141414] border border-white/5 rounded-xl p-5 hover:border-white/12 hover:bg-[#181818] transition-all group"
          >
            {/* App icon */}
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                style={{ background: a.color, color: '#000' }}
              >
                {a.abbr}
              </div>
              <span className="opacity-0 group-hover:opacity-60 transition-opacity text-white/60 text-sm mt-1">→</span>
            </div>

            <div className="font-semibold text-white/90 text-sm mb-1">{a.label}</div>
            <p className="text-white/35 text-xs leading-relaxed mb-4">{a.desc}</p>

            {/* Stat chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {loading ? (
                <Skel className="h-4 w-24 rounded-full" />
              ) : stats ? (
                getChips(a.path, stats).map((chip, i) => (
                  <span
                    key={i}
                    className="mono text-[10px] flex items-center gap-1"
                    style={{ color: `${chip.color}90` }}
                  >
                    <span style={{ color: chip.color }}>●</span>
                    {chip.label}
                  </span>
                ))
              ) : null}
            </div>
          </button>
        ))}
      </div>

      {/* Atividade recente */}
      <div className="mono text-white/25 text-xs mb-3">ATIVIDADE RECENTE</div>
      <div className="bg-[#141414] border border-white/5 rounded-xl p-5">
        <p className="text-white/18 text-xs">Nenhuma atividade ainda.</p>
      </div>
    </div>
  );
}
