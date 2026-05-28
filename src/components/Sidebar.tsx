import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  color: string;
  badge?: number;
}

const NAV: NavItem[] = [
  { path: '/',          label: 'Hub',            color: '#e5e5e5' },
  { path: '/pm',        label: 'PM de Features', color: '#7aaa4a' },
  { path: '/builder',   label: 'Builder',        color: '#60a5fa' },
  { path: '/pipeline',  label: 'Pipeline',       color: '#f59e0b' },
  { path: '/carteira',  label: 'Carteira',       color: '#34d399' },
  { path: '/conteudo',  label: 'Conteúdo',       color: '#a78bfa' },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside
      style={{ width: 220, minWidth: 220 }}
      className="flex flex-col border-r border-white/5 bg-[#111111] min-h-screen py-5"
    >
      {/* Logo */}
      <div className="px-5 mb-8 flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-[#7aaa4a] flex items-center justify-center font-bold text-black text-sm">
          R
        </div>
        <span className="font-semibold text-white tracking-tight">
          REVENY <span className="text-[#7aaa4a]">HQ</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2">
        {NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-white/8 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/4'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: isActive ? item.color : '#ffffff30' }}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2 mt-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-white/30 hover:text-white/60 hover:bg-white/4 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-white/10 flex-shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  );
}
