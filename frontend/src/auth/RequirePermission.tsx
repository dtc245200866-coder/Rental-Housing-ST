import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Permission } from '../types';

/** Yêu cầu đã đăng nhập; chưa đăng nhập thì chuyển về /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-400">Đang tải…</div>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

/** Yêu cầu quyền cụ thể; thiếu quyền hiện trang báo lỗi 403. */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="text-6xl">🚫</div>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Không đủ quyền truy cập
        </h1>
        <p className="max-w-md text-sm text-gray-500">
          Bạn không có quyền xem trang này. Liên hệ quản trị hệ thống nếu bạn cho rằng đây là nhầm lẫn.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
