import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutDashboard, Layers, TrendingUp, Users, PenLine, BookOpen, LogOut, Shield, Sun, Moon, Bot, Megaphone,
} from 'lucide-react';

const NAV = [
  { path: '/',         label: 'Hub',      icon: LayoutDashboard, color: '#7aaec7' },
  { path: '/produto',  label: 'Produto',  icon: Layers,          color: '#7aaa4a' },
  { path: '/pipeline', label: 'Pipeline', icon: TrendingUp,      color: '#f59e0b' },
  { path: '/carteira', label: 'Carteira', icon: Users,           color: '#7aaec7' },
  { path: '/cmo',        label: 'CMO',       icon: Megaphone,      color: '#4a7fa5' },
  { path: '/conteudo',   label: 'Conteúdo',  icon: PenLine,         color: '#a78bfa' },
  { path: '/workspace',  label: 'Workspace', icon: Bot,             color: '#7aaa4a' },
];

const NAV_CONFIG = [
  { path: '/contexto', label: 'Contexto', icon: BookOpen, color: '#7aaec7' },
  { path: '/time',     label: 'Time',     icon: Shield,   color: '#a78bfa' },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { logout, user } = useAuth();
  const { theme, toggle } = useTheme();

  const initials = user?.email
    ? user.email.split('@')[0].slice(0, 2).toUpperCase()
    : '??';

  const emailShort = user?.email
    ? user.email.length > 22 ? user.email.slice(0, 20) + '…' : user.email
    : '';

  function handleNav() {
    onClose?.();
  }

  return (
    <aside
      style={{
        width: 220, minWidth: 220,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-main)',
        display: 'flex', flexDirection: 'column',
        minHeight: '100vh', height: '100%',
      }}
    >
      {/* ── Logo ── */}
      <div style={{
        padding: '1.75rem 1.5rem 1.25rem',
        borderBottom: '1px solid var(--border-inner)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.04em',
          color: 'white', lineHeight: 1,
        }}>
          Rev<span style={{ color: '#7aaec7' }}>e</span>ny
          <span style={{ color: '#4a7fa5', fontWeight: 500, fontSize: '0.7rem', letterSpacing: '0.06em', marginLeft: 5 }}>HQ</span>
        </span>
      </div>

      {/* ── Nav principal ── */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '1rem 0.65rem 0.5rem' }}>
        {NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={handleNav}
          >
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '0.5rem 0.75rem', borderRadius: 7,
                borderLeft: isActive ? `2px solid ${item.color}` : '2px solid transparent',
                background: isActive ? 'var(--nav-bg-active)' : 'transparent',
                cursor: 'pointer', transition: 'all .15s',
              }}
              className={!isActive ? 'hover:bg-white/5' : ''}
              >
                <item.icon size={14} style={{ color: isActive ? item.color : 'var(--nav-icon-inactive)', flexShrink: 0, transition: 'color .15s' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: isActive ? 500 : 400, color: isActive ? 'var(--nav-text-active)' : 'var(--nav-text-inactive)', transition: 'color .15s' }}>
                  {item.label}
                </span>
              </div>
            )}
          </NavLink>
        ))}

        <div style={{ margin: '0.75rem 0.25rem', borderTop: '1px solid var(--border-inner)' }} />

        {NAV_CONFIG.map((item) => (
          <NavLink key={item.path} to={item.path} onClick={handleNav}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '0.45rem 0.75rem', borderRadius: 7,
                borderLeft: isActive ? `2px solid ${item.color}` : '2px solid transparent',
                background: isActive ? 'var(--nav-bg-active)' : 'transparent',
                cursor: 'pointer', transition: 'all .15s',
              }}
              className={!isActive ? 'hover:bg-white/5' : ''}
              >
                <item.icon size={13} style={{ color: isActive ? item.color : 'var(--nav-icon-inactive)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', color: isActive ? 'var(--nav-text-active)' : 'var(--nav-text-inactive)' }}>
                  {item.label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User + Logout ── */}
      <div style={{ padding: '0.85rem', borderTop: '1px solid var(--border-inner)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '0.6rem 0.65rem', borderRadius: 8,
          background: 'var(--nav-bg-active)', border: '1px solid var(--border-main)',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #1e3350, #4a7fa5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,.85)',
          }}>
            {initials}
          </div>
          <span style={{ flex: 1, fontSize: '0.68rem', color: 'var(--text-ter)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {emailShort}
          </span>
          <button onClick={toggle} title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-ter)', padding: 4, borderRadius: 5, display: 'flex', alignItems: 'center', flexShrink: 0 }} className="hover:text-white/55">
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <button onClick={logout} title="Sair" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-ter)', padding: 4, borderRadius: 5, display: 'flex', alignItems: 'center', flexShrink: 0 }} className="hover:text-white/55">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
