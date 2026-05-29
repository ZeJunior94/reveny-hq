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
    label: 'PM de Features',
    desc: 'Ideias → ICE Score → backlog organizado entre sessões.',
    color: '#7aaa4a',
    badge: 'PM',
    badgeBg: '#7aaa4a',
  },
  {
    path: '/builder',
    label: 'Builder de Features',
    desc: 'Features aprovadas → PRD completo + tasks para Claude Code.',
    color: '#60a5fa',
    badge: 'B',
    badgeBg: '#60a5fa',
  },
  {
    path: '/pipeline',
    label: 'Pipeline Comercial',
    desc: 'CRM leve — leads, follow-ups e histórico em linguagem natural.',
    color: '#f59e0b',
    badge: 'P',
    badgeBg: '#f59e0b',
  },
  {
    path: '/carteira',
    label: 'Agente de Carteira',
    desc: 'Base ativa — atividade, retenção, churn e saúde da carteira.',
    color: '#34d399',
    badge: 'C',
    badgeBg: '#34d399',
  },
  {
    path: '/conteudo',
    label: 'Conteúdo & LinkedIn',
    desc: 'Posts alinhados ao posicionamento da Reveny, prontos pra publicar.',
    color: '#a78bfa',
    badge: 'C',
    badgeBg: '#a78bfa',
  },
];

function fmt(n: number) {
  if (n >= 1000) return `R$${(n / 1000).toFixed(1)}k`;
  return `R$${n.toFixed(0)}`;
}

export default function Hub() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [stats, setStats] = useState<HubStats | null>(null);

  useEffect(() => {
    fetch(`${PROXY}/api/hq/hub/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { if (!data.error) setStats(data); })
      .catch(() => {/* silencia — mostra 0 */});
  }, [token]);

  const s = stats;

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
          {
            label: 'FEATURES',
            value: s ? String(s.features.total) : '—',
            sub: s ? `${s.features.aprovadas} aprovadas` : '...',
            color: '#7aaa4a',
          },
          {
            label: 'PRDs',
            value: s ? String(s.prds.total) : '—',
            sub: s ? `${s.prds.tasks} tasks` : '...',
            color: '#60a5fa',
          },
          {
            label: 'LEADS',
            value: s ? String(s.leads.total) : '—',
            sub: s ? `${fmt(s.leads.mrr)} MRR est.` : '...',
            color: '#f59e0b',
          },
          {
            label: 'POSTS',
            value: s ? String(s.posts.total) : '—',
            sub: s ? `${s.posts.publicados} publicados` : '...',
            color: '#a78bfa',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#141414] border border-white/5 rounded-xl p-5"
            style={{ borderTop: `2px solid ${stat.color}` }}
          >
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="mono text-white/35">{stat.label}</div>
            <div className="text-xs text-white/25 mt-1">{stat.sub}</div>
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
              <div className="font-semibold text-white text-sm group-hover:text-white transition-colors">
                {a.label}
              </div>
            </div>
            <p className="text-white/40 text-xs leading-relaxed">{a.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
