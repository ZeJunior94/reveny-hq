import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowUpRight } from 'lucide-react';

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
    abbr: 'BD',
    label: 'Builder de Features',
    desc: 'Features aprovadas → PRD completo + tasks para Claude Code.',
    color: '#4a7fa5',
  },
  {
    path: '/pipeline',
    abbr: 'PL',
    label: 'Pipeline Comercial',
    desc: 'CRM leve — leads, follow-ups e histórico em linguagem natural.',
    color: '#f59e0b',
  },
  {
    path: '/carteira',
    abbr: 'CA',
    label: 'Agente de Carteira',
    desc: 'Base ativa — atividade, retenção, churn e saúde da carteira.',
    color: '#7aaec7',
  },
  {
    path: '/conteudo',
    abbr: 'CO',
    label: 'Conteúdo & LinkedIn',
    desc: 'Posts alinhados ao posicionamento da Reveny, prontos pra publicar.',
    color: '#a78bfa',
  },
];

function Skel({ className }: { className?: string }) {
  return <div className={`rounded animate-pulse ${className ?? ''}`} style={{ background: 'rgba(74,127,165,.08)' }} />;
}

function fmtMrr(n: number) {
  if (n === 0) return 'R$0';
  if (n >= 1000) return `R$${(n / 1000).toFixed(1)}k`;
  return `R$${n.toFixed(0)}`;
}

function getChips(path: string, s: HubStats) {
  switch (path) {
    case '/pm':       return [
      { label: `${s.features.total} features`,        color: '#7aaa4a' },
      { label: `${s.features.aprovadas} aprovadas`,   color: '#7aaa4a' },
    ];
    case '/builder':  return [
      { label: `${s.prds.total} PRDs gerados`,        color: '#4a7fa5' },
    ];
    case '/pipeline': return [
      { label: `${s.leads.total} leads`,              color: '#f59e0b' },
      { label: `${s.leads.clientes} clientes`,        color: '#f59e0b' },
      { label: fmtMrr(s.leads.mrr),                   color: '#7aaa4a' },
    ];
    case '/carteira': return [
      { label: `${s.leads.clientes} clientes ativos`, color: '#7aaec7' },
    ];
    case '/conteudo': return [
      { label: `${s.posts.total} posts`,              color: '#a78bfa' },
      { label: `${s.posts.publicados} publicados`,    color: '#a78bfa' },
    ];
    default: return [];
  }
}

const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

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
      label: 'Features',
      value: s ? String(s.features.total) : null,
      sub: s ? `${s.features.aprovadas} aprovadas` : null,
      color: '#7aaa4a',
    },
    {
      label: 'PRDs',
      value: s ? String(s.prds.total) : null,
      sub: s ? `${s.prds.tasks} tasks geradas` : null,
      color: '#4a7fa5',
    },
    {
      label: 'Leads',
      value: s ? String(s.leads.total) : null,
      sub: s ? `${s.leads.clientes} clientes · ${fmtMrr(s.leads.mrr)} MRR` : null,
      color: '#f59e0b',
    },
    {
      label: 'Posts',
      value: s ? String(s.posts.total) : null,
      sub: s ? `${s.posts.publicados} publicados` : null,
      color: '#a78bfa',
    },
  ];

  return (
    <div className="p-8 max-w-5xl">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 style={{ ...jakarta, fontWeight: 800, fontSize: '1.9rem', letterSpacing: '-0.04em', color: 'white', lineHeight: 1.1 }}>
          Rev<span style={{ color: '#7aaec7' }}>e</span>ny HQ
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.3)', marginTop: '0.35rem', letterSpacing: '0.02em' }}>
          Seu workspace de agentes
        </p>
        <div style={{ marginTop: '1.5rem', borderBottom: '1px solid rgba(74,127,165,.1)' }} />
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-4 gap-3 mb-10">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'rgba(17,30,48,.7)',
              border: '1px solid rgba(74,127,165,.12)',
              borderLeft: `3px solid ${stat.color}`,
              borderRadius: 8,
              padding: '1.25rem 1rem',
            }}
          >
            {loading ? (
              <>
                <Skel className="h-8 w-12 mb-2" />
                <Skel className="h-3 w-14 mb-1.5" />
                <Skel className="h-2.5 w-20" />
              </>
            ) : (
              <>
                <div style={{ ...jakarta, fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.04em', color: 'white', lineHeight: 1, marginBottom: '0.4rem' }}>
                  {stat.value ?? '—'}
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: stat.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.3)' }}>
                  {stat.sub ?? '—'}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Agent grid ── */}
      <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(74,127,165,.6)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '0.85rem' }}>
        Agentes
      </div>

      <div className="grid grid-cols-2 gap-3 mb-10">
        {AGENTS.map((a) => (
          <button
            key={a.path}
            onClick={() => navigate(a.path)}
            className="text-left transition-all group"
            style={{
              background: 'rgba(17,30,48,.6)',
              border: '1px solid rgba(74,127,165,.1)',
              borderRadius: 8,
              padding: '1.25rem',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLElement).style.border = `1px solid rgba(74,127,165,.3)`;
              (e.currentTarget as HTMLElement).style.background = 'rgba(30,51,80,.5)';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLElement).style.border = '1px solid rgba(74,127,165,.1)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(17,30,48,.6)';
            }}
          >
            <div className="flex items-start justify-between mb-3.5">
              {/* Ícone sutil */}
              <div style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                background: `rgba(${hexToRgb(a.color)}, .12)`,
                border: `1px solid rgba(${hexToRgb(a.color)}, .25)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.03em',
                color: a.color,
              }}>
                {a.abbr}
              </div>
              <ArrowUpRight
                size={14}
                className="opacity-0 group-hover:opacity-60 transition-opacity mt-0.5"
                style={{ color: '#7aaec7' }}
              />
            </div>

            <div style={{ ...jakarta, fontWeight: 700, fontSize: '0.88rem', color: 'rgba(255,255,255,.9)', marginBottom: '0.3rem' }}>
              {a.label}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,.35)', lineHeight: 1.6, marginBottom: '1rem' }}>
              {a.desc}
            </p>

            {/* Chips */}
            <div className="flex items-center gap-3 flex-wrap">
              {loading ? (
                <Skel className="h-3.5 w-24 rounded-full" />
              ) : stats ? (
                getChips(a.path, stats).map((chip, i) => (
                  <span key={i} style={{ fontSize: '0.68rem', fontWeight: 500, color: `${chip.color}99`, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: chip.color, fontSize: '0.45rem' }}>●</span>
                    {chip.label}
                  </span>
                ))
              ) : null}
            </div>
          </button>
        ))}
      </div>

      {/* ── Atividade recente ── */}
      <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(74,127,165,.6)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '0.85rem' }}>
        Atividade recente
      </div>
      <div style={{ background: 'rgba(17,30,48,.4)', border: '1px solid rgba(74,127,165,.08)', borderRadius: 8, padding: '1.25rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,.18)' }}>Nenhuma atividade ainda.</p>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
