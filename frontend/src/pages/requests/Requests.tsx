import { useEffect, useState } from 'react';
import { api, extractMessage } from '../../api/client';
import type { Building, RentalRequest, RentalRequestStatus } from '../../types';
import {
  REJECT_REASON_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
} from '../../utils/constants';
import { formatDate } from '../../utils/format';
import Badge from '../../components/Badge';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Requests() {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [buildingId, setBuildingId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selected, setSelected] = useState<RentalRequest | null>(null);
  const [action, setAction] = useState<RentalRequestStatus>('SCHEDULED');
  const [note, setNote] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    const params: Record<string, string> = {};
    if (buildingId) params.buildingId = buildingId;
    if (statusFilter) params.status = statusFilter;
    api.get<RentalRequest[]>('/requests', { params }).then(({ data }) => setRequests(data)).finally(() => setLoading(false));
  }
  useEffect(load, [buildingId, statusFilter]);
  useEffect(() => {
    api.get<Building[]>('/buildings').then(({ data }) => setBuildings(data)).catch(() => {});
  }, []);

  function openAction(r: RentalRequest, status: RentalRequestStatus) {
    setSelected(r);
    setAction(status);
    setNote('');
    setScheduledAt('');
    setRejectReason('');
    setError('');
  }

  async function submit() {
    if (!selected) return;
    setError('');
    const body: Record<string, unknown> = { status: action, note };
    if (action === 'SCHEDULED') body.scheduledAt = scheduledAt;
    if (action === 'REJECTED') body.rejectReason = rejectReason || 'OTHER';
    try {
      await api.put(`/requests/${selected.id}/status`, body);
      setSelected(null);
      load();
    } catch (err) {
      setError(extractMessage(err, 'Cập nhật thất bại').message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Yêu cầu thuê</h1>

      <div className="flex flex-wrap gap-2">
        <select className="input max-w-xs" value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
          <option value="">Tất cả toà nhà</option>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="input max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(REQUEST_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : requests.length === 0 ? (
          <EmptyState message="Không có yêu cầu nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="table-th">Mã</th>
                  <th className="table-th">Khách</th>
                  <th className="table-th">Phòng</th>
                  <th className="table-th">Loại</th>
                  <th className="table-th">Ngày muốn</th>
                  <th className="table-th">Số người</th>
                  <th className="table-th">Trạng thái</th>
                  <th className="table-th">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="table-td font-medium text-gray-900 dark:text-gray-100">{r.requestCode}</td>
                    <td className="table-td">
                      {r.tenantName}
                      <p className="text-xs text-gray-400">{r.tenantPhone}</p>
                    </td>
                    <td className="table-td">{r.roomCode} · {r.buildingName}</td>
                    <td className="table-td">{REQUEST_TYPE_LABELS[r.type]}</td>
                    <td className="table-td">{formatDate(r.desiredDate)}</td>
                    <td className="table-td">{r.expectedPeople}</td>
                    <td className="table-td"><Badge value={r.status} label={REQUEST_STATUS_LABELS[r.status]} /></td>
                    <td className="table-td">
                      {r.status === 'OPEN' && (
                        <div className="flex flex-wrap gap-2">
                          <button className="text-primary-600 hover:underline dark:text-primary-400" onClick={() => openAction(r, 'SCHEDULED')}>Hẹn lịch</button>
                          {r.type === 'RENT_NOW' && (
                            <button className="text-emerald-600 hover:underline" onClick={() => openAction(r, 'ACCEPTED')}>Duyệt</button>
                          )}
                          <button className="text-red-600 hover:underline" onClick={() => openAction(r, 'REJECTED')}>Từ chối</button>
                        </div>
                      )}
                      {r.status === 'SCHEDULED' && (
                        <button className="text-emerald-600 hover:underline" onClick={() => openAction(r, 'ACCEPTED')}>Duyệt</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!selected}
        title={`${REQUEST_STATUS_LABELS[action]} — ${selected?.requestCode ?? ''}`}
        onClose={() => setSelected(null)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setSelected(null)}>Huỷ</button>
            <button className="btn-primary" onClick={submit}>Xác nhận</button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <Alert message={error} onClose={() => setError('')} />}
          {action === 'SCHEDULED' && (
            <FormField label="Ngày giờ hẹn" required>
              <input className="input" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
            </FormField>
          )}
          {action === 'REJECTED' && (
            <FormField label="Lý do từ chối" required>
              <select className="input" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}>
                {Object.entries(REJECT_REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </FormField>
          )}
          <FormField label="Ghi chú">
            <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
