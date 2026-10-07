import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, extractMessage } from '../../api/client';
import type { InvoiceDetail as ID, InvoiceItem } from '../../types';
import {
  INVOICE_ITEM_LABELS,
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from '../../utils/constants';
import { formatDate, formatMoney } from '../../utils/format';
import Badge from '../../components/Badge';
import Loading from '../../components/Loading';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<ID | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [note, setNote] = useState('');
  const [extraName, setExtraName] = useState('');
  const [extraAmount, setExtraAmount] = useState('');
  const [extraType, setExtraType] = useState<'EXTRA' | 'DISCOUNT'>('EXTRA');
  const [extraItems, setExtraItems] = useState<{ name: string; amount: number; type: string }[]>([]);

  function load() {
    setLoading(true);
    api.get<ID>(`/invoices/${id}`).then(({ data }) => setInvoice(data)).finally(() => setLoading(false));
  }
  useEffect(load, [id]);

  async function issue() {
    try {
      await api.put(`/invoices/${id}/issue`);
      load();
    } catch (err) {
      setError(extractMessage(err, 'Phát hành thất bại').message);
    }
  }

  async function cancel() {
    const reason = prompt('Lý do huỷ:');
    if (reason === null) return;
    try {
      await api.put(`/invoices/${id}/cancel`, { reason });
      load();
    } catch (err) {
      setError(extractMessage(err, 'Huỷ thất bại').message);
    }
  }

  function addExtra() {
    if (!extraName || !extraAmount) return;
    setExtraItems((list) => [...list, { name: extraName, amount: Number(extraAmount), type: extraType }]);
    setExtraName('');
    setExtraAmount('');
  }

  async function saveEdit() {
    setError('');
    try {
      await api.put(`/invoices/${id}`, { note, extraItems });
      setEditOpen(false);
      load();
    } catch (err) {
      setError(extractMessage(err, 'Lưu thất bại').message);
    }
  }

  if (loading) return <Loading />;
  if (!invoice) return <div className="py-16 text-center text-gray-400">Không tìm thấy hoá đơn</div>;

  const isDraft = invoice.status === 'DRAFT';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/invoices" className="text-sm text-primary-600 hover:underline dark:text-primary-400">← Hoá đơn</Link>
          <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Hoá đơn {invoice.code}
            <span className="ml-3"><Badge value={invoice.status} label={INVOICE_STATUS_LABELS[invoice.status]} /></span>
          </h1>
        </div>
        {isDraft && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => { setNote(''); setExtraItems([]); setError(''); setEditOpen(true); }}>Sửa nháp</button>
            <button className="btn-danger" onClick={cancel}>Huỷ</button>
            <button className="btn-primary" onClick={issue}>Phát hành</button>
          </div>
        )}
      </div>

      {error && <Alert message={error} onClose={() => setError('')} />}

      <div className="card grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div><p className="text-xs text-gray-400">Phòng</p><p className="font-medium text-gray-800 dark:text-gray-100">{invoice.roomCode}</p></div>
        <div><p className="text-xs text-gray-400">Khách</p><p className="font-medium text-gray-800 dark:text-gray-100">{invoice.tenantName}</p></div>
        <div><p className="text-xs text-gray-400">Kỳ</p><p className="font-medium text-gray-800 dark:text-gray-100">{invoice.period}</p></div>
        <div><p className="text-xs text-gray-400">Hạn thanh toán</p><p className="font-medium text-gray-800 dark:text-gray-100">{formatDate(invoice.dueDate)}</p></div>
      </div>

      <div className="card !p-0">
        <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Chi tiết khoản mục</h2>
        </div>
        <table className="w-full">
          <thead className="border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="table-th">Khoản mục</th>
              <th className="table-th">Số lượng</th>
              <th className="table-th">Đơn giá</th>
              <th className="table-th text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {invoice.items.map((item: InvoiceItem) => (
              <tr key={item.id}>
                <td className="table-td">
                  {item.name}
                  <span className="ml-1 text-xs text-gray-400">{INVOICE_ITEM_LABELS[item.itemType]}</span>
                </td>
                <td className="table-td">{item.quantity} {item.unit}</td>
                <td className="table-td">{formatMoney(item.unitPrice)}</td>
                <td className="table-td text-right tabular-nums">{formatMoney(item.amount)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 dark:bg-gray-800">
              <td colSpan={3} className="table-td font-semibold">Tổng cộng</td>
              <td className="table-td text-right font-semibold">{formatMoney(invoice.totalAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Thanh toán</h2>
        {invoice.payments.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">Chưa có thanh toán nào.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
            {invoice.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-gray-800 dark:text-gray-100">{formatMoney(p.amount)}</span>
                <span className="text-xs text-gray-400">
                  {PAYMENT_METHOD_LABELS[p.method]} · {formatDate(p.paymentDate)} · {PAYMENT_STATUS_LABELS[p.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 border-t border-gray-200 pt-3 text-sm dark:border-gray-700">
          <p className="flex justify-between text-gray-700 dark:text-gray-200">
            <span>Còn phải trả</span>
            <span className="font-semibold text-red-600 dark:text-red-400">{formatMoney(invoice.remaining)}</span>
          </p>
        </div>
      </div>

      <Modal
        open={editOpen}
        title="Sửa hoá đơn nháp"
        onClose={() => setEditOpen(false)}
        footer={<><button className="btn-secondary" onClick={() => setEditOpen(false)}>Huỷ</button><button className="btn-primary" onClick={saveEdit}>Lưu</button></>}
      >
        <div className="space-y-4">
          {error && <Alert message={error} onClose={() => setError('')} />}
          <FormField label="Ghi chú">
            <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </FormField>
          <div>
            <p className="label">Thêm khoản phát sinh / giảm trừ</p>
            <div className="flex gap-2">
              <select className="input max-w-[120px]" value={extraType} onChange={(e) => setExtraType(e.target.value as typeof extraType)}>
                <option value="EXTRA">Phát sinh</option>
                <option value="DISCOUNT">Giảm trừ</option>
              </select>
              <input className="input" placeholder="Tên khoản" value={extraName} onChange={(e) => setExtraName(e.target.value)} />
              <input className="input" type="number" placeholder="Số tiền" value={extraAmount} onChange={(e) => setExtraAmount(e.target.value)} />
              <button className="btn-secondary" type="button" onClick={addExtra}>+</button>
            </div>
            {extraItems.map((it, i) => (
              <div key={i} className="mt-2 flex justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>{it.name} ({it.type === 'DISCOUNT' ? 'Giảm trừ' : 'Phát sinh'})</span>
                <span>{formatMoney(it.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
