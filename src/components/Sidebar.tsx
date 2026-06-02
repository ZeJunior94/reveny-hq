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
  { path: '/carteira', label: 'Carteira',       icon: Users,           color: '#34d399' },
  { path: '/conteudo', label: 'Conteúdo',       icon: PenLine,         color: '#a78bfa' },
];

const NAV_CONFIG = [
  { path: '/contexto', label: 'Contexto', icon: BookOpen, color: '#7aaec7' },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside
      style={{ width: 220, minWidth: 220 }}
      className="flex flex-col border-r border-[#4a7fa5]/10 bg-[#111e30] min-h-screen py-5"
    >
      {/* Logo */}
      <div className="px-5 mb-7 flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1e3350, #4a7fa5)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          R
        </div>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.03em' }} className="text-white">
          Rev<span style={{ color: '#7aaec7' }}>e</span>ny <span style={{ color: '#4a7fa5', fontWeight: 500, fontSize: '0.75rem', letterSpacing: '0.06em' }}>HQ</span>
        </span>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2">
        {NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-[#4a7fa5]/10 text-white border border-[#4a7fa5]/15'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/4 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={15}
                  className="flex-shrink-0 transition-colors"
                  style={{ color: isActive ? item.color : 'rgba(255,255,255,0.25)' }}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Separador */}
        <div className="my-2.5 border-t border-[#4a7fa5]/10 mx-1" />

        {/* Config */}
        {NAV_CONFIG.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                isActive
                  ? 'bg-[#4a7fa5]/10 text-white/70 border border-[#4a7fa5]/15'
                  : 'text-white/25 hover:text-white/50 hover:bg-white/4 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={13}
                  className="flex-shrink-0"
                  style={{ color: isActive ? '#7aaec7' : 'rgba(255,255,255,0.2)' }}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2 mt-4 border-t border-[#4a7fa5]/10 pt-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/25 hover:text-white/55 hover:bg-white/4 transition-all"
        >
          <LogOut size={14} className="flex-shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  );
}
