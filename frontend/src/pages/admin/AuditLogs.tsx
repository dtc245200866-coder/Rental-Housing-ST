import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { AuditLog } from '../../types';
import { formatDateTime } from '../../utils/format';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [objectType, setObjectType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (objectType) params.objectType = objectType;
    api.get<AuditLog[]>('/audit-logs', { params }).then(({ data }) => setLogs(data)).finally(() => setLoading(false));
  }, [objectType]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Nhật ký hoạt động</h1>

      <select className="input max-w-xs" value={objectType} onChange={(e) => setObjectType(e.target.value)}>
        <option value="">Tất cả đối tượng</option>
        {['ROOM', 'SERVICE', 'CONTRACT', 'METER', 'INVOICE', 'PAYMENT'].map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : logs.length === 0 ? (
          <EmptyState message="Không có nhật ký nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="table-th">Thời điểm</th>
                  <th className="table-th">Người thực hiện</th>
                  <th className="table-th">Hành động</th>
                  <th className="table-th">Đối tượng</th>
                  <th className="table-th">Thay đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="table-td whitespace-nowrap">{formatDateTime(l.timestamp)}</td>
                    <td className="table-td">{l.actorName}<p className="text-xs text-gray-400">{l.actorRole}</p></td>
                    <td className="table-td"><BadgeInline action={l.action} /></td>
                    <td className="table-td">{l.objectType} #{l.objectId}</td>
                    <td className="table-td">
                      {l.beforeData && l.afterData ? (
                        <button
                          className="text-primary-600 hover:underline dark:text-primary-400"
                          onClick={() => alert(`Trước: ${l.beforeData}\nSau: ${l.afterData}`)}
                        >
                          Xem
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
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

function BadgeInline({ action }: { action: string }) {
  const colors: Record<string, string> = {
    CREATE: 'bg-emerald-100 text-emerald-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[action] ?? 'bg-gray-200 text-gray-600'}`}>
      {action}
    </span>
  );
}
