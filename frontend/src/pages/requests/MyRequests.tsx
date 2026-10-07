import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { RentalRequest } from '../../types';
import { REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS, REJECT_REASON_LABELS } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/format';
import Badge from '../../components/Badge';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';

export default function MyRequests() {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get<RentalRequest[]>('/my/requests').then(({ data }) => setRequests(data)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function cancel(id: number) {
    if (!confirm('Huỷ yêu cầu này? Huỷ rồi không khôi phục được.')) return;
    await api.post(`/my/requests/${id}/cancel`).catch(() => {});
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Yêu cầu của tôi</h1>

      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : requests.length === 0 ? (
          <EmptyState message="Bạn chưa gửi yêu cầu thuê nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="table-th">Mã</th>
                  <th className="table-th">Phòng</th>
                  <th className="table-th">Loại</th>
                  <th className="table-th">Ngày mong muốn</th>
                  <th className="table-th">Trạng thái</th>
                  <th className="table-th">Ghi chú</th>
                  <th className="table-th">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="table-td font-medium text-gray-900 dark:text-gray-100">{r.requestCode}</td>
                    <td className="table-td">{r.roomCode} · {r.buildingName}</td>
                    <td className="table-td">{REQUEST_TYPE_LABELS[r.type]}</td>
                    <td className="table-td">{formatDate(r.desiredDate)}</td>
                    <td className="table-td"><Badge value={r.status} label={REQUEST_STATUS_LABELS[r.status]} /></td>
                    <td className="table-td text-xs">
                      {r.status === 'REJECTED' && r.rejectReason
                        ? REJECT_REASON_LABELS[r.rejectReason]
                        : r.scheduledAt
                          ? `Hẹn: ${formatDateTime(r.scheduledAt)}`
                          : '—'}
                    </td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <Link to={`/listings/${r.listingId}`} className="text-primary-600 hover:underline dark:text-primary-400">
                          Xem tin
                        </Link>
                        {(r.status === 'OPEN' || r.status === 'SCHEDULED') && (
                          <button className="text-red-600 hover:underline" onClick={() => cancel(r.id)}>Huỷ</button>
                        )}
                      </div>
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
