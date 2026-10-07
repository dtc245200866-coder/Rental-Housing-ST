import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, extractMessage } from '../../api/client';
import type { Building, Room, RoomStatus } from '../../types';
import { ROOM_STATUS_LABELS } from '../../utils/constants';
import { formatArea, formatMoney } from '../../utils/format';
import Badge from '../../components/Badge';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Rooms() {
  const [searchParams, setSearchParams] = useSearchParams();
  const buildingId = searchParams.get('buildingId') || '';

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState({ code: '', buildingId: '', floor: 1, area: 20, rent: 2000000, maxPeople: 2 });
  const [bulk, setBulk] = useState({ buildingId: '', startFloor: 1, floorCount: 1, roomsPerFloor: 2, area: 20, rent: 2000000, maxPeople: 2 });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Building[]>('/buildings').then(({ data }) => setBuildings(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (buildingId) params.buildingId = buildingId;
    api
      .get<Room[]>('/rooms', { params })
      .then(({ data }) => setRooms(data))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, [buildingId]);

  function openCreate() {
    setEditing(null);
    setForm({ code: '', buildingId: buildingId || '', floor: 1, area: 20, rent: 2000000, maxPeople: 2 });
    setError('');
    setFormOpen(true);
  }

  function openEdit(r: Room) {
    setEditing(r);
    setForm({ code: r.code, buildingId: String(r.buildingId), floor: r.floor, area: r.area, rent: r.rent, maxPeople: r.maxPeople });
    setError('');
    setFormOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      buildingId: Number(form.buildingId),
      area: Number(form.area),
      rent: Number(form.rent),
      maxPeople: Number(form.maxPeople),
      floor: Number(form.floor),
    };
    try {
      if (editing) {
        await api.put(`/rooms/${editing.id}`, payload);
      } else {
        await api.post('/rooms', payload);
      }
      setFormOpen(false);
      setSearchParams(buildingId ? { buildingId } : {});
    } catch (err) {
      setError(extractMessage(err, 'Lưu thất bại').message);
    }
  }

  async function saveBulk(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/rooms/bulk', {
        buildingId: Number(bulk.buildingId),
        startFloor: Number(bulk.startFloor),
        floorCount: Number(bulk.floorCount),
        roomsPerFloor: Number(bulk.roomsPerFloor),
        area: Number(bulk.area),
        rent: Number(bulk.rent),
        maxPeople: Number(bulk.maxPeople),
      });
      setBulkOpen(false);
      setSearchParams({ buildingId: bulk.buildingId });
    } catch (err) {
      setError(extractMessage(err, 'Tạo nhanh thất bại').message);
    }
  }

  async function changeStatus(r: Room, status: RoomStatus) {
    try {
      await api.put(`/rooms/${r.id}/status`, { status });
      setRooms((list) => list.map((x) => (x.id === r.id ? { ...x, status } : x)));
    } catch (err) {
      alert(extractMessage(err, 'Đổi trạng thái thất bại').message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Phòng</h1>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => { setBulk({ ...bulk, buildingId: buildingId || '' }); setError(''); setBulkOpen(true); }}>
            Tạo nhanh
          </button>
          <button className="btn-primary" onClick={openCreate}>+ Tạo phòng</button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          className="input max-w-xs"
          value={buildingId}
          onChange={(e) => setSearchParams(e.target.value ? { buildingId: e.target.value } : {})}
        >
          <option value="">Tất cả toà nhà</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : rooms.length === 0 ? (
          <EmptyState message="Chưa có phòng nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="table-th">Mã phòng</th>
                  <th className="table-th">Toà nhà</th>
                  <th className="table-th">Tầng</th>
                  <th className="table-th">Diện tích</th>
                  <th className="table-th">Giá thuê</th>
                  <th className="table-th">Số người</th>
                  <th className="table-th">Trạng thái</th>
                  <th className="table-th">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {rooms.map((r) => (
                  <tr key={r.id}>
                    <td className="table-td font-medium text-gray-900 dark:text-gray-100">{r.code}</td>
                    <td className="table-td">{r.buildingName}</td>
                    <td className="table-td">{r.floor}</td>
                    <td className="table-td">{formatArea(r.area)}</td>
                    <td className="table-td">{formatMoney(r.rent)}</td>
                    <td className="table-td">{r.maxPeople}</td>
                    <td className="table-td">
                      <Badge value={r.status} label={ROOM_STATUS_LABELS[r.status]} />
                    </td>
                    <td className="table-td">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/rooms/${r.id}`} className="text-primary-600 hover:underline dark:text-primary-400">Chi tiết</Link>
                        <button className="text-primary-600 hover:underline dark:text-primary-400" onClick={() => openEdit(r)}>Sửa</button>
                        {r.status === 'EMPTY' && (
                          <button className="text-emerald-600 hover:underline" onClick={() => changeStatus(r, 'STOPPED')}>Ngừng</button>
                        )}
                        {r.status === 'STOPPED' && (
                          <button className="text-emerald-600 hover:underline" onClick={() => changeStatus(r, 'EMPTY')}>Mở lại</button>
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

      {/* Form tạo/sửa phòng */}
      <Modal
        open={formOpen}
        title={editing ? 'Sửa phòng' : 'Tạo phòng'}
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
          <FormField label="Toà nhà" required>
            <select className="input" value={form.buildingId} onChange={(e) => setForm((f) => ({ ...f, buildingId: e.target.value }))} required>
              <option value="">Chọn toà nhà</option>
              {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Mã phòng" required>
              <input className="input" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required />
            </FormField>
            <FormField label="Tầng" required>
              <input className="input" type="number" min={1} value={form.floor} onChange={(e) => setForm((f) => ({ ...f, floor: Number(e.target.value) }))} required />
            </FormField>
            <FormField label="Diện tích (m²)" required>
              <input className="input" type="number" step="0.1" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: Number(e.target.value) }))} required />
            </FormField>
            <FormField label="Số người tối đa" required>
              <input className="input" type="number" min={1} value={form.maxPeople} onChange={(e) => setForm((f) => ({ ...f, maxPeople: Number(e.target.value) }))} required />
            </FormField>
          </div>
          <FormField label="Giá thuê (đ/tháng)" required>
            <input className="input" type="number" min={500000} value={form.rent} onChange={(e) => setForm((f) => ({ ...f, rent: Number(e.target.value) }))} required />
          </FormField>
        </form>
      </Modal>

      {/* Form tạo nhanh */}
      <Modal
        open={bulkOpen}
        title="Tạo nhanh nhiều phòng"
        onClose={() => setBulkOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setBulkOpen(false)}>Huỷ</button>
            <button className="btn-primary" onClick={saveBulk}>Tạo</button>
          </>
        }
      >
        <form onSubmit={saveBulk} className="space-y-4">
          {error && <Alert message={error} onClose={() => setError('')} />}
          <FormField label="Toà nhà" required>
            <select className="input" value={bulk.buildingId} onChange={(e) => setBulk((f) => ({ ...f, buildingId: e.target.value }))} required>
              <option value="">Chọn toà nhà</option>
              {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Tầng bắt đầu" required>
              <input className="input" type="number" min={1} value={bulk.startFloor} onChange={(e) => setBulk((f) => ({ ...f, startFloor: Number(e.target.value) }))} required />
            </FormField>
            <FormField label="Số tầng" required>
              <input className="input" type="number" min={1} value={bulk.floorCount} onChange={(e) => setBulk((f) => ({ ...f, floorCount: Number(e.target.value) }))} required />
            </FormField>
            <FormField label="Phòng/tầng" required>
              <input className="input" type="number" min={1} value={bulk.roomsPerFloor} onChange={(e) => setBulk((f) => ({ ...f, roomsPerFloor: Number(e.target.value) }))} required />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Diện tích (m²)" required>
              <input className="input" type="number" step="0.1" value={bulk.area} onChange={(e) => setBulk((f) => ({ ...f, area: Number(e.target.value) }))} required />
            </FormField>
            <FormField label="Giá thuê (đ)" required>
              <input className="input" type="number" min={500000} value={bulk.rent} onChange={(e) => setBulk((f) => ({ ...f, rent: Number(e.target.value) }))} required />
            </FormField>
            <FormField label="Số người" required>
              <input className="input" type="number" min={1} value={bulk.maxPeople} onChange={(e) => setBulk((f) => ({ ...f, maxPeople: Number(e.target.value) }))} required />
            </FormField>
          </div>
          <p className="text-xs text-gray-400">Mã phòng sinh tự động dạng {`{tầng}{số thứ tự}`} (vd 101, 102…).</p>
        </form>
      </Modal>
    </div>
  );
}
