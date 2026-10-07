import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS } from '../utils/constants';
import NotificationBell from './NotificationBell';

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#e2e8f0] bg-white px-4 sm:px-7">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-[#64748b] hover:bg-[#f1f5f9] lg:hidden"
          aria-label="Mở menu"
        >
          ☰
        </button>
        <span className="text-[19px] font-bold text-[#0f172a]">Quản Lý Phòng Trọ</span>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="flex items-center gap-3">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#3b82f6] text-base font-bold text-white">
            {initial}
          </div>
          <div className="hidden text-right sm:block">
            <div className="text-sm font-semibold text-[#0f172a]">{user.name}</div>
            <div className="text-xs text-[#64748b]">{ROLE_LABELS[user.role]}</div>
          </div>
          <button onClick={logout} className="btn-secondary btn-sm">
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
