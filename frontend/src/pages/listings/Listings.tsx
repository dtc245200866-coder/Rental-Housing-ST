import { useEffect, useState, type FormEvent } from 'react';
import { api, extractMessage } from '../../api/client';
import type { Listing, ListingStatus, Room } from '../../types';
import { LISTING_STATUS_LABELS } from '../../utils/constants';
import { formatArea, formatDateTime, formatMoney } from '../../utils/format';
import Badge from '../../components/Badge';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Listings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ roomId: '', title: '', description: '' });
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.get<Listing[]>('/listings').then(({ data }) => setListings(data)).finally(() => setLoading(false));
  }
  useEffect(() => {
    load();
    api.get<Room[]>('/rooms').then(({ data }) => setRooms(data.filter((r) => r.status === 'EMPTY'))).catch(() => {});
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/listings', { roomId: Number(form.roomId), title: form.title, description: form.description });
      setFormOpen(false);
      load();
    } catch (err) {
      setError(extractMessage(err, 'Đăng tin thất bại').message);
    }
  }

  async function setStatus(l: Listing, status: ListingStatus) {
    try {
      await api.put(`/listings/${l.id}/status`, { status });
      load();
    } catch (err) {
      alert(extractMessage(err, 'Đổi trạng thái thất bại').message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Tin đăng</h1>
        <button
          className="btn-primary"
          onClick={() => { setForm({ roomId: '', title: '', description: '' }); setError(''); setFormOpen(true); }}
        >
          + Đăng tin
        </button>
      </div>

      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : listings.length === 0 ? (
          <EmptyState message="Chưa có tin đăng nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="table-th">Tiêu đề</th>
                  <th className="table-th">Phòng</th>
                  <th className="table-th">Giá</th>
                  <th className="table-th">Diện tích</th>
                  <th className="table-th">Trạng thái</th>
                  <th className="table-th">Hết hạn</th>
                  <th className="table-th">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {listings.map((l) => (
                  <tr key={l.id}>
                    <td className="table-td font-medium text-gray-900 dark:text-gray-100">{l.title}</td>
                    <td className="table-td">{l.roomCode} · {l.buildingName}</td>
                    <td className="table-td">{formatMoney(l.rent)}</td>
                    <td className="table-td">{formatArea(l.area)}</td>
                    <td className="table-td"><Badge value={l.status} label={LISTING_STATUS_LABELS[l.status]} /></td>
                    <td className="table-td">{formatDateTime(l.expiresAt)}</td>
                    <td className="table-td">
                      <div className="flex flex-wrap gap-2">
                        {l.status === 'DRAFT' && (
                          <button className="text-emerald-600 hover:underline" onClick={() => setStatus(l, 'PUBLISHED')}>Hiển thị</button>
                        )}
                        {l.status === 'PUBLISHED' && (
                          <button className="text-amber-600 hover:underline" onClick={() => setStatus(l, 'HIDDEN')}>Tạm ẩn</button>
                        )}
                        {l.status === 'HIDDEN' && (
                          <button className="text-emerald-600 hover:underline" onClick={() => setStatus(l, 'PUBLISHED')}>Hiển thị</button>
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

      <Modal
        open={formOpen}
        title="Đăng tin cho thuê"
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)}>Huỷ</button>
            <button className="btn-primary" onClick={save}>Đăng tin</button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4">
          {error && <Alert message={error} onClose={() => setError('')} />}
          <FormField label="Phòng trống" required>
            <select className="input" value={form.roomId} onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))} required>
              <option value="">Chọn phòng trống</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.code} — {r.buildingName} ({formatMoney(r.rent)})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Tiêu đề">
            <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </FormField>
          <FormField label="Mô tả">
            <textarea className="input" rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
