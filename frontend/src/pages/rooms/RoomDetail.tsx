import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, extractMessage } from '../../api/client';
import type { Room, RoomImage, RoomService, Service } from '../../types';
import { CALC_METHOD_LABELS, ROOM_STATUS_LABELS } from '../../utils/constants';
import { assetUrl, formatArea, formatMoney } from '../../utils/format';
import Badge from '../../components/Badge';
import Loading from '../../components/Loading';
import Alert from '../../components/Alert';

export default function RoomDetail() {
  const { id } = useParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const [room, setRoom] = useState<Room | null>(null);
  const [images, setImages] = useState<RoomImage[]>([]);
  const [services, setServices] = useState<RoomService[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  function load() {
    setLoading(true);
    api.get<Room[]>('/rooms').then(({ data }) => {
      setRoom(data.find((r) => r.id === Number(id)) ?? null);
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    api.get<RoomImage[]>(`/rooms/${id}/images`).then(({ data }) => setImages(data)).catch(() => {});
    api.get<RoomService[]>(`/rooms/${id}/services`).then(({ data }) => setServices(data)).catch(() => {});
    api.get<Service[]>('/services').then(({ data }) => setAllServices(data.filter((s) => s.active))).catch(() => {});
  }, [id]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('images', f));
    try {
      await api.post(`/rooms/${id}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { data } = await api.get<RoomImage[]>(`/rooms/${id}/images`);
      setImages(data);
    } catch (err) {
      setError(extractMessage(err, 'Tải ảnh thất bại').message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function removeImage(imgId: number) {
    if (!confirm('Xoá ảnh này?')) return;
    await api.delete(`/room-images/${imgId}`).catch(() => {});
    setImages((list) => list.filter((i) => i.id !== imgId));
  }

  async function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= images.length) return;
    const reordered = [...images];
    [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
    setImages(reordered);
    await api
      .put('/room-images/order', {
        images: reordered.map((img, i) => ({ id: img.id, sortOrder: i })),
      })
      .catch(() => {});
  }

  async function saveServices(next: { serviceId: number; price: number }[]) {
    setError('');
    try {
      await api.put(`/rooms/${id}/services`, { services: next });
      const { data } = await api.get<RoomService[]>(`/rooms/${id}/services`);
      setServices(data);
    } catch (err) {
      setError(extractMessage(err, 'Lưu dịch vụ thất bại').message);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/rooms" className="text-sm text-primary-600 hover:underline dark:text-primary-400">← Phòng</Link>
          <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Phòng {room?.code ?? id}
            {room && (
              <span className="ml-3">
                <Badge value={room.status} label={ROOM_STATUS_LABELS[room.status]} />
              </span>
            )}
          </h1>
        </div>
      </div>

      {error && <Alert message={error} onClose={() => setError('')} />}

      {room && (
        <div className="card grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-400">Toà nhà</p>
            <p className="font-medium text-gray-800 dark:text-gray-100">{room.buildingName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Tầng</p>
            <p className="font-medium text-gray-800 dark:text-gray-100">{room.floor}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Diện tích</p>
            <p className="font-medium text-gray-800 dark:text-gray-100">{formatArea(room.area)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Giá thuê</p>
            <p className="font-medium text-gray-800 dark:text-gray-100">{formatMoney(room.rent)}</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Ảnh phòng ({images.length})</h2>
          <div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={upload} />
            <button className="btn-primary !py-1.5 text-xs" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Đang tải…' : '+ Tải ảnh'}
            </button>
          </div>
        </div>
        {images.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">Chưa có ảnh.</p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((img, idx) => (
              <div key={img.id} className="relative">
                <img src={assetUrl(img.url)} alt="" className="aspect-square w-full rounded-lg object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex justify-between rounded-b-lg bg-black/50 p-1">
                  <button className="text-white disabled:opacity-30" onClick={() => move(idx, -1)} disabled={idx === 0}>◀</button>
                  <button className="text-white" onClick={() => removeImage(img.id)}>🗑</button>
                  <button className="text-white disabled:opacity-30" onClick={() => move(idx, 1)} disabled={idx === images.length - 1}>▶</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RoomServicesEditor
        current={services}
        all={allServices}
        onSave={saveServices}
      />
    </div>
  );
}

function RoomServicesEditor({
  current,
  all,
  onSave,
}: {
  current: RoomService[];
  all: Service[];
  onSave: (next: { serviceId: number; price: number }[]) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const map: Record<number, number> = {};
    current.forEach((s) => (map[s.serviceId] = s.price));
    setDraft(map);
  }, [current]);

  function toggle(serviceId: number, price: number) {
    setDraft((d) => {
      const next = { ...d };
      if (serviceId in next) delete next[serviceId];
      else next[serviceId] = price;
      return next;
    });
  }

  async function save() {
    setSaving(true);
    const next = Object.entries(draft).map(([serviceId, price]) => ({
      serviceId: Number(serviceId),
      price,
    }));
    await onSave(next);
    setSaving(false);
  }

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Dịch vụ áp dụng cho phòng</h2>
      <div className="mt-3 space-y-2">
        {all.map((s) => {
          const applied = s.id in draft;
          return (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <input
                type="checkbox"
                checked={applied}
                onChange={() => toggle(s.id, s.price)}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{s.name}</p>
                <p className="text-xs text-gray-400">
                  {CALC_METHOD_LABELS[s.calculationMethod]} · đơn vị {s.unit || '—'}
                </p>
              </div>
              {applied && (
                <input
                  className="input max-w-[160px] !py-1.5 text-sm"
                  type="number"
                  min={0}
                  value={draft[s.id]}
                  onChange={(e) => setDraft((d) => ({ ...d, [s.id]: Number(e.target.value) }))}
                />
              )}
            </div>
          );
        })}
      </div>
      <button className="btn-primary mt-4" onClick={save} disabled={saving}>
        {saving ? 'Đang lưu…' : 'Lưu dịch vụ phòng'}
      </button>
    </div>
  );
}
