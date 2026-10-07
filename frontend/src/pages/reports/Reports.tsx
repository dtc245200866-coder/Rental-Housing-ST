import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Building, ReportSummary } from '../../types';
import { formatMoney } from '../../utils/format';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';

export default function Reports() {
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingId, setBuildingId] = useState('');
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { months };
    if (buildingId) params.buildingId = buildingId;
    api.get<ReportSummary>('/reports/summary', { params }).then(({ data }) => setReport(data)).finally(() => setLoading(false));
  }, [buildingId, months]);

  useEffect(() => {
    api.get<Building[]>('/buildings').then(({ data }) => setBuildings(data)).catch(() => {});
  }, []);

  const maxIssued = report ? Math.max(1, ...report.monthly.map((m) => m.issued)) : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Báo cáo doanh thu & lấp đầy</h1>

      <div className="flex flex-wrap gap-2">
        <select className="input max-w-xs" value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
          <option value="">Tất cả toà nhà</option>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="input max-w-xs" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
          {[3, 6, 12].map((n) => <option key={n} value={n}>{n} tháng gần nhất</option>)}
        </select>
      </div>

      {loading ? (
        <Loading />
      ) : !report ? (
        <EmptyState message="Chưa có dữ liệu báo cáo" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tổng phòng</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{report.totalRooms}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Đang cho thuê</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{report.rentedRooms}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tỉ lệ lấp đầy</p>
              <p className="mt-1 text-2xl font-bold text-primary-600 dark:text-primary-400">{report.occupancyRate}%</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Doanh thu đã phát hành ({report.monthly.length} tháng)</h2>
            <div className="mt-4 flex items-end gap-3" style={{ height: '160px' }}>
              {report.monthly.map((m) => (
                <div key={m.period} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-xs tabular-nums text-gray-500">{Math.round(m.issued / 1000000)}tr</span>
                  <div
                    className="w-full rounded-t bg-primary-500"
                    style={{ height: `${(m.issued / maxIssued) * 100}%` }}
                    title={formatMoney(m.issued)}
                  />
                  <span className="text-xs text-gray-400">{m.period.slice(5)}/{m.period.slice(2, 4)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card !p-0">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="table-th">Kỳ</th>
                  <th className="table-th text-right">Đã phát hành</th>
                  <th className="table-th text-right">Đã thu</th>
                  <th className="table-th text-right">Còn phải thu</th>
                  <th className="table-th text-right">Tỉ lệ thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {report.monthly.map((m) => (
                  <tr key={m.period}>
                    <td className="table-td font-medium text-gray-900 dark:text-gray-100">{m.period}</td>
                    <td className="table-td text-right tabular-nums">{formatMoney(m.issued)}</td>
                    <td className="table-td text-right tabular-nums">{formatMoney(m.collected)}</td>
                    <td className="table-td text-right tabular-nums text-red-600 dark:text-red-400">{formatMoney(m.remaining)}</td>
                    <td className="table-td text-right tabular-nums">
                      {m.issued === 0 ? '—' : `${Math.round((m.collected / m.issued) * 100)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
