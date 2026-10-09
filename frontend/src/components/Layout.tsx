import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="sidebar-bg hidden w-64 flex-col lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-4">
          <span className="text-2xl">🏠</span>
          <span className="text-sm font-bold text-white">Quản Lý Phòng Trọ</span>
        </div>
        <Sidebar />
      </aside>

      {/* Sidebar mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <aside className="sidebar-bg absolute left-0 top-0 flex h-full w-64 flex-col">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <span className="text-sm font-bold text-white">Quản Lý Phòng Trọ</span>
              <button onClick={() => setMenuOpen(false)} className="text-[#c3c9ec] hover:text-white" aria-label="Đóng">
                ✕
              </button>
            </div>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
