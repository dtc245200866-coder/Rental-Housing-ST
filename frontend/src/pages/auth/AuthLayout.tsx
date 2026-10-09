import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="login-body flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🏠</span>
            <span className="text-2xl font-bold text-white">Quản Lý Phòng Trọ</span>
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <h1 className="text-center text-2xl font-bold text-[#0f172a]">{title}</h1>
          {subtitle && <p className="mt-1 text-center text-sm text-[#64748b]">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
