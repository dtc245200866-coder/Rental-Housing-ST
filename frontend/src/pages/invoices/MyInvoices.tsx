import { useEffect, useState } from 'react';
import { api, extractMessage } from '../../api/client';
import type { MyInvoice } from '../../types';
import { INVOICE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../../utils/constants';
import { formatDate, formatMoney } from '../../utils/format';
import Badge from '../../components/Badge';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function MyInvoices() {
  const [invoices, setInvoices] = useState<MyInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [payFor, setPayFor] = useState<MyInvoice | null>(null);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<'CASH' | 'TRANSFER'>('TRANSFER');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.get<MyInvoice[]>('/my/invoices').then(({ data }) => setInvoices(data)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function reportPayment() {
    if (!payFor) return;
    setError('');
    try {
      await api.post('/my/payments', {
        invoiceId: payFor.id,
        amount,
        method,
        note,
      });
      setPayFor(null);
      load();
    } catch (err) {
      setError(extractMessage(err, 'Báo thanh toán thất bại').message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Hoá đơn của tôi</h1>
      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : invoices.length === 0 ? (
          <EmptyState message="Bạn chưa có hoá đơn nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="table-th">Mã</th>
                  <th className="table-th">Phòng</th>
                  <th className="table-th">Kỳ</th>
                  <th className="table-th">Tổng</th>
                  <th className="table-th">Đã trả</th>
                  <th className="table-th">Còn lại</th>
                  <th className="table-th">Hạn</th>
                  <th className="table-th">Trạng thái</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="table-td font-medium text-gray-900 dark:text-gray-100">{inv.code}</td>
                    <td className="table-td">{inv.roomCode}</td>
                    <td className="table-td">{inv.period}</td>
                    <td className="table-td">{formatMoney(inv.totalAmount)}</td>
                    <td className="table-td">{formatMoney(inv.paidAmount)}</td>
                    <td className="table-td text-red-600 dark:text-red-400">{formatMoney(inv.remaining)}</td>
                    <td className="table-td">{formatDate(inv.dueDate)}</td>
                    <td className="table-td"><Badge value={inv.status} label={INVOICE_STATUS_LABELS[inv.status]} /></td>
                    <td className="table-td">
                      {inv.remaining > 0 && (inv.status === 'ISSUED' || inv.status === 'PARTIAL' || inv.status === 'OVERDUE') && (
                        <button className="btn-primary !py-1.5 text-xs" onClick={() => { setPayFor(inv); setAmount(inv.remaining); setError(''); }}>
                          Báo đã trả
                        </button>
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
        open={!!payFor}
        title={`Báo thanh toán — ${payFor?.code ?? ''}`}
        onClose={() => setPayFor(null)}
        footer={<><button className="btn-secondary" onClick={() => setPayFor(null)}>Huỷ</button><button className="btn-primary" onClick={reportPayment}>Gửi</button></>}
      >
        <div className="space-y-4">
          {error && <Alert message={error} onClose={() => setError('')} />}
          <FormField label={`Số tiền đã trả (tối đa ${formatMoney(payFor?.remaining ?? 0)})`} required>
            <input className="input" type="number" min={1} max={payFor?.remaining} value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
          </FormField>
          <FormField label="Hình thức" required>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </FormField>
          <FormField label="Ghi chú">
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
