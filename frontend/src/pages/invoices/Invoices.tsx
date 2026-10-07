import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, extractMessage } from '../../api/client';
import type { Building, Invoice } from '../../types';
import { INVOICE_STATUS_LABELS } from '../../utils/constants';
import { formatMoney } from '../../utils/format';
import Badge from '../../components/Badge';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [buildingId, setBuildingId] = useState('');
  const [period, setPeriod] = useState('');

  const [genOpen, setGenOpen] = useState(false);
  const [genForm, setGenForm] = useState({ buildingId: '', period: new Date().toISOString().slice(0, 7) });
  const [genResult, setGenResult] = useState<{ created: string[]; skipped: string[] } | null>(null);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    const params: Record<string, string> = {};
    if (buildingId && period) { params.buildingId = buildingId; params.period = period; }
    else if (period) params.period = period;
    api.get<Invoice[]>('/invoices', { params }).then(({ data }) => setInvoices(data)).finally(() => setLoading(false));
  }
  useEffect(load, [buildingId, period]);

  useEffect(() => {
    api.get<Building[]>('/buildings').then(({ data }) => setBuildings(data)).catch(() => {});
  }, []);

  async function generate() {
    setError('');
    setGenResult(null);
    try {
      const { data } = await api.post('/invoices/generate', {
        buildingId: Number(genForm.buildingId),
        period: genForm.period,
      });
      setGenResult(data.result);
      load();
    } catch (err) {
      setError(extractMessage(err, 'Phát hành thất bại').message);
    }
  }

  async function issue(inv: Invoice) {
    try {
      await api.put(`/invoices/${inv.id}/issue`);
      load();
    } catch (err) {
      alert(extractMessage(err, 'Phát hành thất bại').message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Hoá đơn</h1>
        <button
          className="btn-primary"
          onClick={() => { setGenForm({ buildingId: buildings[0] ? String(buildings[0].id) : '', period: new Date().toISOString().slice(0, 7) }); setGenResult(null); setError(''); setGenOpen(true); }}
        >
          Phát hành hàng loạt
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select className="input max-w-xs" value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
          <option value="">Tất cả toà nhà</option>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input className="input max-w-xs" type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
      </div>

      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : invoices.length === 0 ? (
          <EmptyState message="Không có hoá đơn nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="table-th">Mã</th>
                  <th className="table-th">Phòng</th>
                  <th className="table-th">Khách</th>
                  <th className="table-th">Kỳ</th>
                  <th className="table-th">Tổng</th>
                  <th className="table-th">Đã trả</th>
                  <th className="table-th">Còn lại</th>
                  <th className="table-th">Trạng thái</th>
                  <th className="table-th">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="table-td font-medium text-gray-900 dark:text-gray-100">{inv.code}</td>
                    <td className="table-td">{inv.roomCode}</td>
                    <td className="table-td">{inv.tenantName}</td>
                    <td className="table-td">{inv.period}</td>
                    <td className="table-td">{formatMoney(inv.totalAmount)}</td>
                    <td className="table-td">{formatMoney(inv.paidAmount)}</td>
                    <td className="table-td text-red-600 dark:text-red-400">{formatMoney(inv.remaining)}</td>
                    <td className="table-td"><Badge value={inv.status} label={INVOICE_STATUS_LABELS[inv.status]} /></td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <Link to={`/invoices/${inv.id}`} className="text-primary-600 hover:underline dark:text-primary-400">Chi tiết</Link>
                        {inv.status === 'DRAFT' && (
                          <button className="text-emerald-600 hover:underline" onClick={() => issue(inv)}>Phát hành</button>
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
        open={genOpen}
        title="Phát hành hoá đơn hàng loạt"
        onClose={() => setGenOpen(false)}
        footer={!genResult ? <><button className="btn-secondary" onClick={() => setGenOpen(false)}>Huỷ</button><button className="btn-primary" onClick={generate}>Phát hành</button></> : <button className="btn-primary" onClick={() => setGenOpen(false)}>Đóng</button>}
      >
        <div className="space-y-4">
          {error && <Alert message={error} onClose={() => setError('')} />}
          {genResult ? (
            <div className="space-y-2 text-sm">
              <p className="text-emerald-600">Đã tạo {genResult.created.length} hoá đơn.</p>
              {genResult.created.length > 0 && <p className="text-xs text-gray-500">Phòng: {genResult.created.join(', ')}</p>}
              {genResult.skipped.length > 0 && (
                <>
                  <p className="text-amber-600">Bỏ qua {genResult.skipped.length} phòng:</p>
                  <ul className="list-disc pl-5 text-xs text-gray-500">
                    {genResult.skipped.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <>
              <FormField label="Toà nhà" required>
                <select className="input" value={genForm.buildingId} onChange={(e) => setGenForm((f) => ({ ...f, buildingId: e.target.value }))} required>
                  <option value="">Chọn toà nhà</option>
                  {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </FormField>
              <FormField label="Kỳ (yyyy-MM)" required>
                <input className="input" type="month" value={genForm.period} onChange={(e) => setGenForm((f) => ({ ...f, period: e.target.value }))} required />
              </FormField>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
