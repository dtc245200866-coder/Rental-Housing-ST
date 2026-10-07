import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { formatMoney } from '../../utils/format';
import { ROLE_LABELS } from '../../utils/constants';
import type { DebtSummary, ReportSummary } from '../../types';

export default function Home() {
  const { user, hasPermission } = useAuth();
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [debt, setDebt] = useState<DebtSummary | null>(null);

  useEffect(() => {
    if (hasPermission('REPORT_VIEW')) {
      api.get<ReportSummary>('/reports/summary').then(({ data }) => setReport(data)).catch(() => {});
    }
    if (hasPermission('INVOICE_MANAGE')) {
      api.get<DebtSummary>('/debts').then(({ data }) => setDebt(data)).catch(() => {});
    }
  }, [hasPermission]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Xin chào, {user.name} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Bạn đang đăng nhập với vai trò {ROLE_LABELS[user.role]}.
        </p>
      </div>

      {(report || debt) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {report && (
            <>
              <div className="card">
                <p className="text-sm text-gray-500 dark:text-gray-400">Tỉ lệ lấp đầy</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {report.occupancyRate}%
                </p>
                <p className="text-xs text-gray-400">
                  {report.rentedRooms}/{report.totalRooms} phòng đang thuê
                </p>
              </div>
            </>
          )}
          {debt && (
            <div className="card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tổng công nợ</p>
              <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                {formatMoney(debt.totalRemaining)}
              </p>
              <p className="text-xs text-gray-400">{debt.count} phòng đang nợ</p>
            </div>
          )}
          <div className="card">
            <p className="text-sm text-gray-500 dark:text-gray-400">Truy cập nhanh</p>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              {user.role === 'TENANT' ? (
                <>
                  <Link to="/my/invoices" className="text-primary-600 hover:underline dark:text-primary-400">Hoá đơn của tôi</Link>
                  <Link to="/my/requests" className="text-primary-600 hover:underline dark:text-primary-400">Yêu cầu thuê của tôi</Link>
                  <Link to="/my/maintenance" className="text-primary-600 hover:underline dark:text-primary-400">Báo hỏng</Link>
                </>
              ) : (
                <>
                  <Link to="/listings" className="text-primary-600 hover:underline dark:text-primary-400">Quản lý tin đăng</Link>
                  <Link to="/invoices" className="text-primary-600 hover:underline dark:text-primary-400">Phát hành hoá đơn</Link>
                  <Link to="/requests" className="text-primary-600 hover:underline dark:text-primary-400">Yêu cầu thuê</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {user.role === 'TENANT' && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Tìm phòng mới?</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Xem các tin đăng đang hiển thị và gửi yêu cầu thuê ngay.
          </p>
          <Link to="/" className="btn-primary mt-3">Tìm phòng</Link>
        </div>
      )}
    </div>
  );
}
