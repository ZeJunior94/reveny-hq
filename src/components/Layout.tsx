import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[1px] md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — fixo no mobile quando aberto, estático no desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-250 md:relative md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: 220 }}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-[#0b1520] min-w-0">

        {/* Hamburger — só mobile */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#4a7fa5]/10 sticky top-0 z-20 bg-[#0b1520]">
          <button
            onClick={() => setOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.5)', padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <Menu size={20} />
          </button>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.04em', color: 'white',
          }}>
            Rev<span style={{ color: '#7aaec7' }}>e</span>ny
            <span style={{ color: '#4a7fa5', fontWeight: 500, fontSize: '0.65rem', letterSpacing: '0.06em', marginLeft: 4 }}>HQ</span>
          </span>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
