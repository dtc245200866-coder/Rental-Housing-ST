import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, extractMessage } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import type { Building, BuildingService } from '../../types';
import { CALC_METHOD_LABELS } from '../../utils/constants';
import { formatDate, formatMoney } from '../../utils/format';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Buildings() {
  const { user } = useAuth();
  const isLandlord = user?.role === 'LANDLORD' || user?.role === 'ADMIN';

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [form, setForm] = useState({ name: '', address: '', district: '', floors: 1, note: '' });
  const [error, setError] = useState('');

  // Cấu hình dịch vụ theo toà
  const [svcBuilding, setSvcBuilding] = useState<Building | null>(null);
  const [buildingServices, setBuildingServices] = useState<BuildingService[]>([]);
  const [svcLoading, setSvcLoading] = useState(false);

  function load() {
    setLoading(true);
    api
      .get<Building[]>('/buildings')
      .then(({ data }) => setBuildings(data))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', address: '', district: '', floors: 1, note: '' });
    setError('');
    setFormOpen(true);
  }

  function openEdit(b: Building) {
    setEditing(b);
    setForm({ name: b.name, address: b.address, district: b.district, floors: b.floors, note: b.note });
    setError('');
    setFormOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/buildings/${editing.id}`, form);
      } else {
        await api.post('/buildings', form);
      }
      setFormOpen(false);
      load();
    } catch (err) {
      setError(extractMessage(err, 'Lưu thất bại').message);
    }
  }

  async function openServices(b: Building) {
    setSvcBuilding(b);
    setSvcLoading(true);
    setError('');
    try {
      const { data } = await api.get<BuildingService[]>(`/buildings/${b.id}/services`);
      setBuildingServices(data);
    } finally {
      setSvcLoading(false);
    }
  }

  async function saveBuildingService(bs: BuildingService, calculationMethod: string, price: number) {
    await api.put(`/buildings/${svcBuilding!.id}/services/${bs.serviceId}`, {
      calculationMethod,
      price,
      effectiveFrom: new Date().toISOString().slice(0, 10),
    });
    const { data } = await api.get<BuildingService[]>(`/buildings/${svcBuilding!.id}/services`);
    setBuildingServices(data);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Toà nhà</h1>
        {isLandlord && (
          <button className="btn-primary" onClick={openCreate}>+ Tạo toà nhà</button>
        )}
      </div>

      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : buildings.length === 0 ? (
          <EmptyState message="Chưa có toà nhà nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="table-th">Tên</th>
                  <th className="table-th">Địa chỉ</th>
                  <th className="table-th">Quận</th>
                  <th className="table-th">Số tầng</th>
                  <th className="table-th">Phòng trống</th>
                  <th className="table-th">Người quản lý</th>
                  <th className="table-th">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {buildings.map((b) => (
                  <tr key={b.id}>
                    <td className="table-td font-medium text-gray-900 dark:text-gray-100">{b.name}</td>
                    <td className="table-td">{b.address}</td>
                    <td className="table-td">{b.district || '—'}</td>
                    <td className="table-td">{b.floors}</td>
                    <td className="table-td">
                      {b.emptyRooms}/{b.totalRooms}
                    </td>
                    <td className="table-td">{b.managerName || '—'}</td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <Link to={`/rooms?buildingId=${b.id}`} className="text-primary-600 hover:underline dark:text-primary-400">
                          Phòng
                        </Link>
                        {isLandlord && (
                          <>
                            <button className="text-primary-600 hover:underline dark:text-primary-400" onClick={() => openEdit(b)}>
                              Sửa
                            </button>
                            <button className="text-primary-600 hover:underline dark:text-primary-400" onClick={() => openServices(b)}>
                              Dịch vụ
                            </button>
                          </>
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

      {/* Form tạo/sửa */}
      <Modal
        open={formOpen}
        title={editing ? 'Sửa toà nhà' : 'Tạo toà nhà'}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)}>Huỷ</button>
            <button className="btn-primary" onClick={save}>Lưu</button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4">
          {error && <Alert message={error} onClose={() => setError('')} />}
          <FormField label="Tên toà nhà" required>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </FormField>
          <FormField label="Địa chỉ" required>
            <input className="input" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} required />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Quận / huyện">
              <input className="input" value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} />
            </FormField>
            <FormField label="Số tầng" required>
              <input className="input" type="number" min={1} value={form.floors} onChange={(e) => setForm((f) => ({ ...f, floors: Number(e.target.value) }))} required />
            </FormField>
          </div>
          <FormField label="Ghi chú">
            <textarea className="input" rows={2} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          </FormField>
        </form>
      </Modal>

      {/* Cấu hình dịch vụ theo toà */}
      <Modal
        open={!!svcBuilding}
        title={`Dịch vụ — ${svcBuilding?.name ?? ''}`}
        onClose={() => setSvcBuilding(null)}
      >
        {svcLoading ? (
          <Loading />
        ) : (
          <div className="space-y-3">
            {buildingServices.length === 0 && <p className="text-sm text-gray-400">Chưa cấu hình dịch vụ cho toà này.</p>}
            {buildingServices.map((bs) => (
              <BuildingServiceRow key={bs.id} bs={bs} onSave={saveBuildingService} />
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function BuildingServiceRow({
  bs,
  onSave,
}: {
  bs: BuildingService;
  onSave: (bs: BuildingService, method: string, price: number) => Promise<void>;
}) {
  const [method, setMethod] = useState(bs.calculationMethod);
  const [price, setPrice] = useState(bs.price);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      await onSave(bs, method, price);
      setMsg('Đã lưu');
    } catch {
      setMsg('Lỗi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{bs.serviceName}</span>
        <span className="text-xs text-gray-400">hiệu lực từ {formatDate(bs.effectiveFrom)}</span>
      </div>
      <div className="mt-2 flex gap-2">
        <select
          className="input !py-1.5 text-xs"
          value={method}
          onChange={(e) => setMethod(e.target.value as BuildingService['calculationMethod'])}
        >
          <option value="BY_METER">Theo chỉ số</option>
          <option value="BY_PERSON">Theo đầu người</option>
          <option value="FIXED_ROOM">Cố định theo phòng</option>
        </select>
        <input
          className="input !py-1.5 text-xs"
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <button className="btn-primary !py-1.5 text-xs" onClick={save} disabled={saving}>
          Lưu
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        Cách tính: {CALC_METHOD_LABELS[method as keyof typeof CALC_METHOD_LABELS]} · Đơn giá: {formatMoney(price)}
        {msg && <span className="ml-2 text-emerald-600">{msg}</span>}
      </p>
    </div>
  );
}
