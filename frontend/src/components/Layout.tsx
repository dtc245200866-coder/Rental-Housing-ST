import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Icon from './Icon';

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="sidebar-bg hidden w-64 flex-col shadow-[3px_0_20px_rgba(16,20,50,0.16)] lg:flex">
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
            <Icon name="home" className="h-[22px] w-[22px]" />
          </div>
          <div>
            <div className="text-base font-bold leading-tight text-white">Quản Lý Phòng Trọ</div>
            <div className="mt-0.5 text-xs text-[#a5addd]">Rental Housing</div>
          </div>
        </div>
        <Sidebar />
      </aside>

      {/* Sidebar mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <aside className="sidebar-bg absolute left-0 top-0 flex h-full w-64 flex-col">
            <div className="flex items-center justify-between px-5 py-6">
              <div className="text-base font-bold text-white">Quản Lý Phòng Trọ</div>
              <button onClick={() => setMenuOpen(false)} className="text-[#c3c9ec]" aria-label="Đóng">
                ✕
              </button>
            </div>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 sm:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
