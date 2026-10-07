import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS } from '../utils/constants';
import NotificationBell from './NotificationBell';

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Mở menu"
        >
          ☰
        </button>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Hệ thống cho thuê phòng trọ
        </span>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{user.name}</p>
          <p className="text-xs text-gray-400">{ROLE_LABELS[user.role]}</p>
        </div>
        <button
          onClick={logout}
          className="btn-secondary !py-1.5 text-xs"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
