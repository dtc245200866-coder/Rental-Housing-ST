import { useEffect, useState } from 'react';
import { api, extractMessage } from '../../api/client';
import type { Invoice, Payment } from '../../types';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '../../utils/constants';
import { formatDate, formatMoney } from '../../utils/format';
import Badge from '../../components/Badge';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceId, setInvoiceId] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const params: Record<string, string> = {};
    if (invoiceId) params.invoiceId = invoiceId;
    api.get<Payment[]>('/payments', { params }).then(({ data }) => setPayments(data)).finally(() => setLoading(false));
  }
  useEffect(load, [invoiceId]);
  useEffect(() => {
    api.get<Invoice[]>('/invoices').then(({ data }) => setInvoices(data)).catch(() => {});
  }, []);

  async function confirm(p: Payment) {
    try {
      await api.put(`/payments/${p.id}/confirm`, { method: p.method, paymentDate: p.paymentDate });
      load();
    } catch (err) {
      alert(extractMessage(err, 'Xác nhận thất bại').message);
    }
  }

  async function cancel(p: Payment) {
    const reason = prompt('Lý do huỷ:');
    if (reason === null) return;
    try {
      await api.put(`/payments/${p.id}/cancel`, { reason });
      load();
    } catch (err) {
      alert(extractMessage(err, 'Huỷ thất bại').message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Thanh toán</h1>

      <select className="input max-w-xs" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
        <option value="">Tất cả hoá đơn</option>
        {invoices.map((i) => <option key={i.id} value={i.id}>{i.code} — {i.roomCode}</option>)}
      </select>

      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : payments.length === 0 ? (
          <EmptyState message="Không có thanh toán nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="table-th">Hoá đơn</th>
                  <th className="table-th">Số tiền</th>
                  <th className="table-th">Ngày trả</th>
                  <th className="table-th">Hình thức</th>
                  <th className="table-th">Trạng thái</th>
                  <th className="table-th">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="table-td font-medium text-gray-900 dark:text-gray-100">{p.invoiceCode ?? p.invoiceId}</td>
                    <td className="table-td">{formatMoney(p.amount)}</td>
                    <td className="table-td">{formatDate(p.paymentDate)}</td>
                    <td className="table-td">{PAYMENT_METHOD_LABELS[p.method]}</td>
                    <td className="table-td"><Badge value={p.status} label={PAYMENT_STATUS_LABELS[p.status]} /></td>
                    <td className="table-td">
                      {p.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button className="text-emerald-600 hover:underline" onClick={() => confirm(p)}>Xác nhận</button>
                          <button className="text-red-600 hover:underline" onClick={() => cancel(p)}>Huỷ</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
