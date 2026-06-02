import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Lightbulb, Wrench, TrendingUp, Users, PenLine, BookOpen, LogOut,
} from 'lucide-react';

const NAV = [
  { path: '/',         label: 'Hub',            icon: LayoutDashboard, color: '#7aaec7' },
  { path: '/pm',       label: 'PM de Features', icon: Lightbulb,       color: '#7aaa4a' },
  { path: '/builder',  label: 'Builder',        icon: Wrench,          color: '#4a7fa5' },
  { path: '/pipeline', label: 'Pipeline',       icon: TrendingUp,      color: '#f59e0b' },
  { path: '/carteira', label: 'Carteira',       icon: Users,           color: '#7aaec7' },
  { path: '/conteudo', label: 'Conteúdo',       icon: PenLine,         color: '#a78bfa' },
];

const NAV_CONFIG = [
  { path: '/contexto', label: 'Contexto', icon: BookOpen, color: '#7aaec7' },
];

export default function Sidebar() {
  const { logout, user } = useAuth();

  const initials = user?.email
    ? user.email.split('@')[0].slice(0, 2).toUpperCase()
    : '??';

  const emailShort = user?.email
    ? user.email.length > 22 ? user.email.slice(0, 20) + '…' : user.email
    : '';

  return (
    <aside
      style={{
        width: 220, minWidth: 220,
        background: '#0f1c2e',
        borderRight: '1px solid rgba(74,127,165,.1)',
        display: 'flex', flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* ── Logo ── */}
      <div style={{
        padding: '1.75rem 1.5rem 1.25rem',
        borderBottom: '1px solid rgba(74,127,165,.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img
          src="/logo.svg"
          alt="Reveny"
          style={{ height: 30, width: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* ── Nav principal ── */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '1rem 0.65rem 0.5rem' }}>
        {NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
          >
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '0.5rem 0.75rem',
                borderRadius: 7,
                borderLeft: isActive ? `2px solid ${item.color}` : '2px solid transparent',
                background: isActive ? 'rgba(74,127,165,.1)' : 'transparent',
                cursor: 'pointer',
                transition: 'all .15s',
              }}
              className={!isActive ? 'hover:bg-white/5' : ''}
              >
                <item.icon
                  size={14}
                  style={{
                    color: isActive ? item.color : 'rgba(255,255,255,0.22)',
                    flexShrink: 0,
                    transition: 'color .15s',
                  }}
                />
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.4)',
                  transition: 'color .15s',
                }}>
                  {item.label}
                </span>
              </div>
            )}
          </NavLink>
        ))}

        {/* ── Separador ── */}
        <div style={{ margin: '0.75rem 0.25rem', borderTop: '1px solid rgba(74,127,165,.08)' }} />

        {/* ── Config ── */}
        {NAV_CONFIG.map((item) => (
          <NavLink key={item.path} to={item.path}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '0.45rem 0.75rem',
                borderRadius: 7,
                borderLeft: isActive ? `2px solid ${item.color}` : '2px solid transparent',
                background: isActive ? 'rgba(74,127,165,.08)' : 'transparent',
                cursor: 'pointer',
                transition: 'all .15s',
              }}
              className={!isActive ? 'hover:bg-white/5' : ''}
              >
                <item.icon
                  size={13}
                  style={{
                    color: isActive ? item.color : 'rgba(255,255,255,.18)',
                    flexShrink: 0,
                  }}
                />
                <span style={{
                  fontSize: '0.75rem',
                  color: isActive ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.28)',
                }}>
                  {item.label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User + Logout ── */}
      <div style={{
        padding: '0.85rem 0.85rem',
        borderTop: '1px solid rgba(74,127,165,.08)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '0.6rem 0.65rem',
          borderRadius: 8,
          background: 'rgba(74,127,165,.06)',
          border: '1px solid rgba(74,127,165,.1)',
        }}>
          {/* Avatar */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #1e3350, #4a7fa5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,.85)',
            letterSpacing: '0.02em',
          }}>
            {initials}
          </div>

          {/* Email */}
          <span style={{
            flex: 1, fontSize: '0.68rem', color: 'rgba(255,255,255,.35)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {emailShort}
          </span>

          {/* Logout */}
          <button
            onClick={logout}
            title="Sair"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,.2)', padding: 4, borderRadius: 5,
              display: 'flex', alignItems: 'center', flexShrink: 0,
              transition: 'color .15s',
            }}
            className="hover:text-white/55"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
