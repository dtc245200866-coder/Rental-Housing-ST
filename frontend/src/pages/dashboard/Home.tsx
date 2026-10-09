import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { formatMoney } from '../../utils/format';
import { ROLE_LABELS } from '../../utils/constants';
import type { DebtSummary, ReportSummary } from '../../types';
import Icon from '../../components/Icon';

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

  const stats: { icon: Parameters<typeof Icon>[0]['name']; tint: string; value: string; label: string }[] = [];
  if (report) {
    stats.push({ icon: 'building', tint: 'tint-blue', value: `${report.occupancyRate}%`, label: 'Tỉ lệ lấp đầy' });
    stats.push({ icon: 'grid', tint: 'tint-green', value: `${report.rentedRooms}/${report.totalRooms}`, label: 'Phòng đang thuê' });
  }
  if (debt) {
    stats.push({ icon: 'alert', tint: 'tint-rose', value: formatMoney(debt.totalRemaining), label: 'Tổng công nợ' });
    stats.push({ icon: 'dollar', tint: 'tint-amber', value: String(debt.count), label: 'Phòng đang nợ' });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Tổng quan</h1>
          <p className="mt-0.5 text-sm text-[#64748b]">
            Xin chào, {user.name} — {ROLE_LABELS[user.role]}.
          </p>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="card flex items-center gap-3.5 !p-[18px] transition-transform hover:-translate-y-0.5 hover:shadow-md">
              <div className={`stat-icon-box ${s.tint}`}>
                <Icon name={s.icon} />
              </div>
              <div>
                <div className="text-[22px] font-bold leading-tight text-[#0f172a]">{s.value}</div>
                <div className="text-[13px] text-[#64748b]">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="panel-title">Truy cập nhanh</h2>
        <div className="mt-3 flex flex-col gap-1.5 text-sm">
          {user.role === 'TENANT' ? (
            <>
              <Link to="/my/invoices" className="text-[#3b82f6] hover:underline">Hoá đơn của tôi</Link>
              <Link to="/my/requests" className="text-[#3b82f6] hover:underline">Yêu cầu thuê của tôi</Link>
              <Link to="/my/maintenance" className="text-[#3b82f6] hover:underline">Báo hỏng</Link>
            </>
          ) : (
            <>
              <Link to="/listings" className="text-[#3b82f6] hover:underline">Quản lý tin đăng</Link>
              <Link to="/invoices" className="text-[#3b82f6] hover:underline">Phát hành hoá đơn</Link>
              <Link to="/requests" className="text-[#3b82f6] hover:underline">Yêu cầu thuê</Link>
            </>
          )}
        </div>
      </div>

      {user.role === 'TENANT' && (
        <div className="card">
          <h2 className="panel-title">Tìm phòng mới?</h2>
          <p className="mt-1 text-sm text-[#64748b]">
            Xem các tin đăng đang hiển thị và gửi yêu cầu thuê ngay.
          </p>
          <Link to="/" className="btn-primary mt-3">Tìm phòng</Link>
        </div>
      )}
    </div>
  );
}
