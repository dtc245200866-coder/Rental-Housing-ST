import { useEffect, useState } from 'react';
import { api, extractMessage } from '../../api/client';
import type { MaintenanceRequest, MyContract } from '../../types';
import { MAINTENANCE_STATUS_LABELS, MAINTENANCE_URGENCY_LABELS, COST_BEARER_LABELS } from '../../utils/constants';
import { formatDateTime, formatMoney } from '../../utils/format';
import Badge from '../../components/Badge';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function MyMaintenance() {
  const [items, setItems] = useState<MaintenanceRequest[]>([]);
  const [contracts, setContracts] = useState<MyContract[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ roomId: '', deviceType: '', description: '', urgency: 'NORMAL' });
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.get<MaintenanceRequest[]>('/my/maintenance').then(({ data }) => setItems(data)).finally(() => setLoading(false));
  }
  useEffect(() => {
    load();
    api.get<MyContract[]>('/my/contracts').then(({ data }) => setContracts(data.filter((c) => c.status === 'ACTIVE' || c.status === 'RENEWED'))).catch(() => {});
  }, []);

  async function submit() {
    setError('');
    try {
      await api.post('/my/maintenance', { ...form, roomId: Number(form.roomId) });
      setFormOpen(false);
      load();
    } catch (err) {
      setError(extractMessage(err, 'Báo hỏng thất bại').message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Báo hỏng của tôi</h1>
        <button className="btn-primary" onClick={() => { setForm({ roomId: contracts[0] ? String(contracts[0].roomId) : '', deviceType: '', description: '', urgency: 'NORMAL' }); setError(''); setFormOpen(true); }}>
          + Báo hỏng
        </button>
      </div>

      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState message="Bạn chưa báo hỏng nào" />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {items.map((m) => (
              <div key={m.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{m.code} — {m.deviceType}</span>
                  <div className="flex gap-2">
                    <Badge value={m.urgency} label={MAINTENANCE_URGENCY_LABELS[m.urgency]} />
                    <Badge value={m.status} label={MAINTENANCE_STATUS_LABELS[m.status]} />
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{m.description}</p>
                <p className="mt-1 text-xs text-gray-400">
                  Phòng {m.roomCode} · {formatDateTime(m.createdAt)}
                  {m.cost > 0 && <> · Chi phí {formatMoney(m.cost)} ({m.costBearer ? COST_BEARER_LABELS[m.costBearer] : '—'})</>}
                </p>
                {m.note && <p className="mt-1 text-xs text-gray-500">Ghi chú: {m.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={formOpen}
        title="Báo hỏng thiết bị"
        onClose={() => setFormOpen(false)}
        footer={<><button className="btn-secondary" onClick={() => setFormOpen(false)}>Huỷ</button><button className="btn-primary" onClick={submit}>Gửi</button></>}
      >
        <div className="space-y-4">
          {error && <Alert message={error} onClose={() => setError('')} />}
          <FormField label="Phòng" required>
            <select className="input" value={form.roomId} onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))} required>
              <option value="">Chọn phòng đang thuê</option>
              {contracts.map((c) => <option key={c.id} value={c.roomId}>{c.roomCode} — {c.buildingName}</option>)}
            </select>
          </FormField>
          <FormField label="Loại thiết bị" required>
            <input className="input" value={form.deviceType} onChange={(e) => setForm((f) => ({ ...f, deviceType: e.target.value }))} placeholder="Bình nóng lạnh, điều hoà…" required />
          </FormField>
          <FormField label="Mô tả sự cố" required>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
          </FormField>
          <FormField label="Mức độ khẩn" required>
            <select className="input" value={form.urgency} onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}>
              <option value="NORMAL">Thường</option>
              <option value="URGENT">Gấp</option>
            </select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
