import { useEffect, useState } from 'react';
import { api, extractMessage } from '../../api/client';
import type { Building, MaintenanceRequest, MaintenanceStatus } from '../../types';
import { MAINTENANCE_STATUS_LABELS, MAINTENANCE_URGENCY_LABELS, COST_BEARER_LABELS } from '../../utils/constants';
import { formatDateTime, formatMoney } from '../../utils/format';
import Badge from '../../components/Badge';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Maintenance() {
  const [items, setItems] = useState<MaintenanceRequest[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [buildingId, setBuildingId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);
  const [action, setAction] = useState<MaintenanceStatus>('IN_PROGRESS');
  const [cost, setCost] = useState(0);
  const [costBearer, setCostBearer] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    const params: Record<string, string> = {};
    if (buildingId) params.buildingId = buildingId;
    if (statusFilter) params.status = statusFilter;
    api.get<MaintenanceRequest[]>('/maintenance', { params }).then(({ data }) => setItems(data)).finally(() => setLoading(false));
  }
  useEffect(load, [buildingId, statusFilter]);
  useEffect(() => {
    api.get<Building[]>('/buildings').then(({ data }) => setBuildings(data)).catch(() => {});
  }, []);

  function openAction(m: MaintenanceRequest, status: MaintenanceStatus) {
    setSelected(m);
    setAction(status);
    setCost(m.cost);
    setCostBearer(m.costBearer ?? '');
    setNote('');
    setError('');
  }

  async function submit() {
    if (!selected) return;
    setError('');
    try {
      await api.put(`/maintenance/${selected.id}/status`, {
        status: action,
        cost: Number(cost),
        costBearer: costBearer || undefined,
        note,
      });
      setSelected(null);
      load();
    } catch (err) {
      setError(extractMessage(err, 'Cập nhật thất bại').message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Báo hỏng & bảo trì</h1>

      <div className="flex flex-wrap gap-2">
        <select className="input max-w-xs" value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
          <option value="">Tất cả toà nhà</option>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="input max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(MAINTENANCE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState message="Không có báo hỏng nào" />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {items.map((m) => (
              <div key={m.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{m.code} — {m.deviceType}</span>
                    <span className="ml-2 text-xs text-gray-400">{m.roomCode} · {m.buildingName} · {m.tenantName}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge value={m.urgency} label={MAINTENANCE_URGENCY_LABELS[m.urgency]} />
                    <Badge value={m.status} label={MAINTENANCE_STATUS_LABELS[m.status]} />
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{m.description}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {formatDateTime(m.createdAt)}
                  {m.cost > 0 && <> · {formatMoney(m.cost)} ({m.costBearer ? COST_BEARER_LABELS[m.costBearer] : '—'})</>}
                </p>
                <div className="mt-2 flex gap-2">
                  {m.status === 'NEW' && (
                    <>
                      <button className="btn-primary !py-1.5 text-xs" onClick={() => openAction(m, 'IN_PROGRESS')}>Tiếp nhận</button>
                      <button className="btn-secondary !py-1.5 text-xs" onClick={() => openAction(m, 'REJECTED')}>Từ chối</button>
                    </>
                  )}
                  {m.status === 'IN_PROGRESS' && (
                    <button className="btn-primary !py-1.5 text-xs" onClick={() => openAction(m, 'DONE')}>Hoàn thành</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!selected}
        title={`${MAINTENANCE_STATUS_LABELS[action]} — ${selected?.code ?? ''}`}
        onClose={() => setSelected(null)}
        footer={<><button className="btn-secondary" onClick={() => setSelected(null)}>Huỷ</button><button className="btn-primary" onClick={submit}>Lưu</button></>}
      >
        <div className="space-y-4">
          {error && <Alert message={error} onClose={() => setError('')} />}
          {action === 'DONE' && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Chi phí sửa chữa (đ)">
                <input className="input" type="number" min={0} value={cost} onChange={(e) => setCost(Number(e.target.value))} />
              </FormField>
              <FormField label="Bên chịu chi phí">
                <select className="input" value={costBearer} onChange={(e) => setCostBearer(e.target.value)}>
                  <option value="">—</option>
                  <option value="LANDLORD">Chủ nhà</option>
                  <option value="TENANT">Khách thuê</option>
                </select>
              </FormField>
            </div>
          )}
          <FormField label="Ghi chú" required>
            <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} required />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
