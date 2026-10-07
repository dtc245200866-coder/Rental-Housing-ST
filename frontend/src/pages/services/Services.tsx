import { useEffect, useState, type FormEvent } from 'react';
import { api, extractMessage } from '../../api/client';
import type { Service, ServicePriceHistory } from '../../types';
import { CALC_METHOD_LABELS } from '../../utils/constants';
import { formatDate, formatMoney } from '../../utils/format';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', calculationMethod: 'FIXED_ROOM', unit: '', price: 0, description: '' });
  const [error, setError] = useState('');

  const [priceFor, setPriceFor] = useState<Service | null>(null);
  const [newPrice, setNewPrice] = useState(0);

  const [historyFor, setHistoryFor] = useState<Service | null>(null);
  const [history, setHistory] = useState<ServicePriceHistory[]>([]);

  function load() {
    setLoading(true);
    api.get<Service[]>('/services').then(({ data }) => setServices(data)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/services', { ...form, price: Number(form.price) });
      setFormOpen(false);
      load();
    } catch (err) {
      setError(extractMessage(err, 'Lưu thất bại').message);
    }
  }

  async function updatePrice() {
    if (!priceFor) return;
    setError('');
    try {
      await api.put(`/services/${priceFor.id}/price`, {
        price: newPrice,
        effectiveFrom: new Date().toISOString().slice(0, 10),
      });
      setPriceFor(null);
      load();
    } catch (err) {
      setError(extractMessage(err, 'Cập nhật giá thất bại').message);
    }
  }

  async function openHistory(s: Service) {
    setHistoryFor(s);
    const { data } = await api.get<ServicePriceHistory[]>(`/services/${s.id}/price-history`);
    setHistory(data);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Dịch vụ</h1>
        <button
          className="btn-primary"
          onClick={() => { setForm({ name: '', calculationMethod: 'FIXED_ROOM', unit: '', price: 0, description: '' }); setError(''); setFormOpen(true); }}
        >
          + Tạo dịch vụ
        </button>
      </div>

      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : services.length === 0 ? (
          <EmptyState message="Chưa có dịch vụ nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="table-th">Tên</th>
                  <th className="table-th">Cách tính</th>
                  <th className="table-th">Đơn vị</th>
                  <th className="table-th">Đơn giá</th>
                  <th className="table-th">Trạng thái</th>
                  <th className="table-th">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {services.map((s) => (
                  <tr key={s.id}>
                    <td className="table-td font-medium text-gray-900 dark:text-gray-100">{s.name}</td>
                    <td className="table-td">{CALC_METHOD_LABELS[s.calculationMethod]}</td>
                    <td className="table-td">{s.unit || '—'}</td>
                    <td className="table-td">{formatMoney(s.price)}</td>
                    <td className="table-td">
                      <span className={`text-xs font-medium ${s.active ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {s.active ? 'Đang áp dụng' : 'Ngừng'}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button className="text-primary-600 hover:underline dark:text-primary-400" onClick={() => { setPriceFor(s); setNewPrice(s.price); setError(''); }}>
                          Đổi giá
                        </button>
                        <button className="text-primary-600 hover:underline dark:text-primary-400" onClick={() => openHistory(s)}>
                          Lịch sử giá
                        </button>
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
        title="Tạo dịch vụ"
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
          <FormField label="Tên dịch vụ" required>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Cách tính" required>
              <select className="input" value={form.calculationMethod} onChange={(e) => setForm((f) => ({ ...f, calculationMethod: e.target.value }))}>
                <option value="BY_METER">Theo chỉ số</option>
                <option value="BY_PERSON">Theo đầu người</option>
                <option value="FIXED_ROOM">Cố định theo phòng</option>
              </select>
            </FormField>
            <FormField label="Đơn vị">
              <input className="input" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="kWh, m3, người…" />
            </FormField>
          </div>
          <FormField label="Đơn giá (đ)" required>
            <input className="input" type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} required />
          </FormField>
          <FormField label="Mô tả">
            <input className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </FormField>
        </form>
      </Modal>

      <Modal
        open={!!priceFor}
        title={`Đổi giá — ${priceFor?.name ?? ''}`}
        onClose={() => setPriceFor(null)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setPriceFor(null)}>Huỷ</button>
            <button className="btn-primary" onClick={updatePrice}>Lưu</button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <Alert message={error} onClose={() => setError('')} />}
          <FormField label="Đơn giá mới (đ)" required>
            <input className="input" type="number" min={0} value={newPrice} onChange={(e) => setNewPrice(Number(e.target.value))} />
          </FormField>
          <p className="text-xs text-gray-400">Ngày hiệu lực là hôm nay. Hoá đơn đã phát hành trước đó giữ nguyên đơn giá cũ.</p>
        </div>
      </Modal>

      <Modal open={!!historyFor} title={`Lịch sử giá — ${historyFor?.name ?? ''}`} onClose={() => setHistoryFor(null)}>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">Chưa có lịch sử giá.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Đơn giá</th>
                <th className="table-th">Hiệu lực từ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {history.map((h, i) => (
                <tr key={i}>
                  <td className="table-td">{formatMoney(h.price)}</td>
                  <td className="table-td">{formatDate(h.effectiveFrom)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}
