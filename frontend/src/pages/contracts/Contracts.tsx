import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, extractMessage } from '../../api/client';
import type { Building, Contract, Room, TenantUser } from '../../types';
import { CONTRACT_STATUS_LABELS } from '../../utils/constants';
import { formatDate, formatMoney } from '../../utils/format';
import Badge from '../../components/Badge';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [buildingId, setBuildingId] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    roomId: '', tenantId: '', rent: '', deposit: '', startDate: '', termMonths: 6, billingDay: '',
  });
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    const params: Record<string, string> = {};
    if (buildingId) params.buildingId = buildingId;
    api.get<Contract[]>('/contracts', { params }).then(({ data }) => setContracts(data)).finally(() => setLoading(false));
  }
  useEffect(load, [buildingId]);

  useEffect(() => {
    api.get<Building[]>('/buildings').then(({ data }) => setBuildings(data)).catch(() => {});
    api.get<Room[]>('/rooms').then(({ data }) => setRooms(data.filter((r) => r.status !== 'RENTED' && r.status !== 'STOPPED'))).catch(() => {});
    api.get<TenantUser[]>('/tenants').then(({ data }) => setTenants(data)).catch(() => {});
  }, []);

  function onRoomChange(roomId: string) {
    const room = rooms.find((r) => r.id === Number(roomId));
    setForm((f) => ({
      ...f,
      roomId,
      rent: room ? String(room.rent) : f.rent,
      deposit: room ? String(room.rent) : f.deposit,
    }));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/contracts', {
        roomId: Number(form.roomId),
        tenantId: Number(form.tenantId),
        rent: Number(form.rent),
        deposit: Number(form.deposit),
        startDate: form.startDate,
        termMonths: Number(form.termMonths),
        billingDay: form.billingDay ? Number(form.billingDay) : undefined,
      });
      setFormOpen(false);
      load();
    } catch (err) {
      setError(extractMessage(err, 'Lập hợp đồng thất bại').message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Hợp đồng</h1>
        <button
          className="btn-primary"
          onClick={() => { setForm({ roomId: '', tenantId: '', rent: '', deposit: '', startDate: new Date().toISOString().slice(0, 10), termMonths: 6, billingDay: '' }); setError(''); setFormOpen(true); }}
        >
          + Lập hợp đồng
        </button>
      </div>

      <select className="input max-w-xs" value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
        <option value="">Tất cả toà nhà</option>
        {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>

      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : contracts.length === 0 ? (
          <EmptyState message="Chưa có hợp đồng nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="table-th">Mã</th>
                  <th className="table-th">Khách</th>
                  <th className="table-th">Phòng</th>
                  <th className="table-th">Giá thuê</th>
                  <th className="table-th">Cọc</th>
                  <th className="table-th">Thời hạn</th>
                  <th className="table-th">Trạng thái</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td className="table-td font-medium text-gray-900 dark:text-gray-100">{c.code}</td>
                    <td className="table-td">{c.tenantName}</td>
                    <td className="table-td">{c.roomCode} · {c.buildingName}</td>
                    <td className="table-td">{formatMoney(c.rent)}</td>
                    <td className="table-td">{formatMoney(c.deposit)}</td>
                    <td className="table-td">{formatDate(c.startDate)} → {formatDate(c.endDate)}</td>
                    <td className="table-td"><Badge value={c.status} label={CONTRACT_STATUS_LABELS[c.status]} /></td>
                    <td className="table-td">
                      <Link to={`/contracts/${c.id}`} className="text-primary-600 hover:underline dark:text-primary-400">Chi tiết</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={formOpen}
        title="Lập hợp đồng thuê"
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)}>Huỷ</button>
            <button className="btn-primary" onClick={save}>Lưu hợp đồng</button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4">
          {error && <Alert message={error} onClose={() => setError('')} />}
          <FormField label="Phòng" required>
            <select className="input" value={form.roomId} onChange={(e) => onRoomChange(e.target.value)} required>
              <option value="">Chọn phòng</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.code} — {r.buildingName} ({formatMoney(r.rent)})</option>)}
            </select>
          </FormField>
          <FormField label="Khách thuê (người đứng tên)" required>
            <select className="input" value={form.tenantId} onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))} required>
              <option value="">Chọn khách thuê</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.phone}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Giá thuê (đ/tháng)" required>
              <input className="input" type="number" min={500000} value={form.rent} onChange={(e) => setForm((f) => ({ ...f, rent: e.target.value }))} required />
            </FormField>
            <FormField label="Tiền cọc (đ)">
              <input className="input" type="number" min={0} value={form.deposit} onChange={(e) => setForm((f) => ({ ...f, deposit: e.target.value }))} />
            </FormField>
            <FormField label="Ngày bắt đầu" required>
              <input className="input" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} required />
            </FormField>
            <FormField label="Kỳ hạn (tháng)" required>
              <input className="input" type="number" min={1} value={form.termMonths} onChange={(e) => setForm((f) => ({ ...f, termMonths: Number(e.target.value) }))} required />
            </FormField>
          </div>
          <FormField label="Ngày chốt hoá đơn (ngày trong tháng)">
            <input className="input" type="number" min={1} max={28} value={form.billingDay} onChange={(e) => setForm((f) => ({ ...f, billingDay: e.target.value }))} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
