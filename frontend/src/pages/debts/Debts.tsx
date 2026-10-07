import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Building, DebtSummary } from '../../types';
import { formatMoney } from '../../utils/format';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';

export default function Debts() {
  const [data, setData] = useState<DebtSummary | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingId, setBuildingId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (buildingId) params.buildingId = buildingId;
    api.get<DebtSummary>('/debts', { params }).then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, [buildingId]);

  useEffect(() => {
    api.get<Building[]>('/buildings').then(({ data }) => setBuildings(data)).catch(() => {});
  }, []);

  function exportCsv() {
    if (!data || data.debts.length === 0) return;
    const header = 'Phòng,Toà nhà,Người thuê,Số điện thoại,Số hoá đơn nợ,Tổng còn thiếu,Quá hạn (ngày)';
    const lines = data.debts.map((d) =>
      [d.roomCode, d.buildingName, d.tenantName, d.tenantPhone, d.outstandingInvoices, d.totalRemaining, d.maxOverdueDays].join(',')
    );
    const blob = new Blob(['﻿' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cong-no.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Công nợ</h1>
        <button className="btn-secondary" onClick={exportCsv}>Xuất CSV</button>
      </div>

      <select className="input max-w-xs" value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
        <option value="">Tất cả toà nhà</option>
        {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>

      {data && (
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tổng còn thiếu của tập kết quả:{' '}
            <span className="font-semibold text-red-600 dark:text-red-400">{formatMoney(data.totalRemaining)}</span>{' '}
            ({data.count} phòng)
          </p>
        </div>
      )}

      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : !data || data.debts.length === 0 ? (
          <EmptyState message="Không có công nợ nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="table-th">Phòng</th>
                  <th className="table-th">Toà nhà</th>
                  <th className="table-th">Người thuê</th>
                  <th className="table-th">Số hoá đơn nợ</th>
                  <th className="table-th">Tổng còn thiếu</th>
                  <th className="table-th">Quá hạn dài nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.debts.map((d) => (
                  <tr key={d.roomId}>
                    <td className="table-td font-medium text-gray-900 dark:text-gray-100">{d.roomCode}</td>
                    <td className="table-td">{d.buildingName}</td>
                    <td className="table-td">{d.tenantName}<p className="text-xs text-gray-400">{d.tenantPhone}</p></td>
                    <td className="table-td">{d.outstandingInvoices}</td>
                    <td className="table-td text-red-600 dark:text-red-400">{formatMoney(d.totalRemaining)}</td>
                    <td className="table-td">{d.maxOverdueDays > 0 ? `${d.maxOverdueDays} ngày` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
