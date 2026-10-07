import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, extractMessage } from '../../api/client';
import type { ContractDetail as CD, Roommate } from '../../types';
import { CONTRACT_STATUS_LABELS } from '../../utils/constants';
import { formatDate, formatDateTime, formatMoney } from '../../utils/format';
import Badge from '../../components/Badge';
import Loading from '../../components/Loading';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

interface Settlement {
  finalInvoiceId: number;
  finalInvoiceTotal: number;
  outstandingDebt: number;
  deposit: number;
  totalDeductions: number;
  deductions: { name: string; amount: number }[];
  refund: number;
}

export default function ContractDetail() {
  const { id } = useParams();
  const [contract, setContract] = useState<CD | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [roommateOpen, setRoommateOpen] = useState(false);
  const [roommate, setRoommate] = useState({ name: '', phone: '', citizenId: '' });

  const [renewOpen, setRenewOpen] = useState(false);
  const [renew, setRenew] = useState({ termMonths: 6, rent: '' });

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkout, setCheckout] = useState({
    moveOutDate: new Date().toISOString().slice(0, 10),
    finalElectric: 0,
    finalWater: 0,
    penalty: 0,
    deductions: [] as { name: string; amount: number }[],
  });
  const [deductionName, setDeductionName] = useState('');
  const [deductionAmount, setDeductionAmount] = useState('');
  const [settlement, setSettlement] = useState<Settlement | null>(null);

  function load() {
    setLoading(true);
    api.get<CD>(`/contracts/${id}`).then(({ data }) => setContract(data)).finally(() => setLoading(false));
  }
  useEffect(load, [id]);

  async function addRoommate() {
    setError('');
    try {
      await api.post(`/contracts/${id}/roommates`, roommate);
      setRoommateOpen(false);
      setRoommate({ name: '', phone: '', citizenId: '' });
      load();
    } catch (err) {
      setError(extractMessage(err, 'Thêm người ở thất bại').message);
    }
  }

  async function moveOutRoommate(r: Roommate) {
    if (!confirm(`Ghi nhận ${r.name} chuyển đi?`)) return;
    await api.put(`/contracts/roommates/${r.id}/move-out`, {}).catch(() => {});
    load();
  }

  async function doRenew() {
    setError('');
    try {
      await api.put(`/contracts/${id}/renew`, {
        termMonths: Number(renew.termMonths),
        rent: renew.rent ? Number(renew.rent) : 0,
      });
      setRenewOpen(false);
      load();
    } catch (err) {
      setError(extractMessage(err, 'Gia hạn thất bại').message);
    }
  }

  function addDeduction() {
    if (!deductionName || !deductionAmount) return;
    setCheckout((c) => ({ ...c, deductions: [...c.deductions, { name: deductionName, amount: Number(deductionAmount) }] }));
    setDeductionName('');
    setDeductionAmount('');
  }

  async function doCheckout() {
    setError('');
    setSettlement(null);
    try {
      const { data } = await api.post<Settlement>(`/contracts/${id}/checkout`, {
        moveOutDate: checkout.moveOutDate,
        finalElectric: Number(checkout.finalElectric),
        finalWater: Number(checkout.finalWater),
        penalty: Number(checkout.penalty),
        deductions: checkout.deductions,
      });
      setSettlement(data);
    } catch (err) {
      setError(extractMessage(err, 'Trả phòng thất bại').message);
    }
  }

  if (loading) return <Loading />;
  if (!contract) return <EmptyState message="Không tìm thấy hợp đồng" />;

  const canAct = contract.status === 'ACTIVE' || contract.status === 'RENEWED';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/contracts" className="text-sm text-primary-600 hover:underline dark:text-primary-400">← Hợp đồng</Link>
          <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Hợp đồng {contract.code}
            <span className="ml-3"><Badge value={contract.status} label={CONTRACT_STATUS_LABELS[contract.status]} /></span>
          </h1>
        </div>
        {canAct && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => { setRenew({ termMonths: 6, rent: '' }); setError(''); setRenewOpen(true); }}>Gia hạn</button>
            <button className="btn-danger" onClick={() => { setCheckout({ moveOutDate: new Date().toISOString().slice(0, 10), finalElectric: 0, finalWater: 0, penalty: 0, deductions: [] }); setSettlement(null); setError(''); setCheckoutOpen(true); }}>
              Trả phòng
            </button>
          </div>
        )}
      </div>

      {error && <Alert message={error} onClose={() => setError('')} />}

      <div className="card grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div><p className="text-xs text-gray-400">Khách thuê</p><p className="font-medium text-gray-800 dark:text-gray-100">{contract.tenantName}</p><p className="text-xs text-gray-400">{contract.tenantPhone}</p></div>
        <div><p className="text-xs text-gray-400">Phòng</p><p className="font-medium text-gray-800 dark:text-gray-100">{contract.roomCode}</p><p className="text-xs text-gray-400">{contract.buildingName}</p></div>
        <div><p className="text-xs text-gray-400">Giá thuê / Cọc</p><p className="font-medium text-gray-800 dark:text-gray-100">{formatMoney(contract.rent)}</p><p className="text-xs text-gray-400">Cọc {formatMoney(contract.deposit)}</p></div>
        <div><p className="text-xs text-gray-400">Thời hạn</p><p className="font-medium text-gray-800 dark:text-gray-100">{formatDate(contract.startDate)} → {formatDate(contract.endDate)}</p><p className="text-xs text-gray-400">{contract.termMonths} tháng</p></div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Người ở ghép ({contract.roommates.length})</h2>
          {canAct && (
            <button className="btn-primary !py-1.5 text-xs" onClick={() => { setRoommate({ name: '', phone: '', citizenId: '' }); setError(''); setRoommateOpen(true); }}>
              + Thêm người ở
            </button>
          )}
        </div>
        {contract.roommates.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">Chưa có người ở ghép.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
            {contract.roommates.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-100">{r.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{r.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {r.moveOutDate ? `Đã chuyển đi ${formatDate(r.moveOutDate)}` : `Ở từ ${formatDate(r.startDate)}`}
                  {canAct && !r.moveOutDate && (
                    <button className="text-red-600 hover:underline" onClick={() => moveOutRoommate(r)}>Chuyển đi</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {contract.renewals.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Lịch sử gia hạn</h2>
          <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
            {contract.renewals.map((rn, i) => (
              <li key={i} className="flex justify-between py-2 text-sm text-gray-600 dark:text-gray-300">
                <span>{formatDate(rn.oldEndDate)} → {formatDate(rn.newEndDate)} (+{rn.termMonths} tháng)</span>
                <span className="tabular-nums">{formatMoney(rn.rent)} · {formatDateTime(rn.renewedAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal thêm người ở */}
      <Modal open={roommateOpen} title="Thêm người ở ghép" onClose={() => setRoommateOpen(false)} footer={<><button className="btn-secondary" onClick={() => setRoommateOpen(false)}>Huỷ</button><button className="btn-primary" onClick={addRoommate}>Thêm</button></>}>
        <div className="space-y-4">
          {error && <Alert message={error} onClose={() => setError('')} />}
          <FormField label="Họ tên" required><input className="input" value={roommate.name} onChange={(e) => setRoommate((f) => ({ ...f, name: e.target.value }))} required /></FormField>
          <FormField label="Số điện thoại"><input className="input" value={roommate.phone} onChange={(e) => setRoommate((f) => ({ ...f, phone: e.target.value }))} /></FormField>
          <FormField label="Số căn cước"><input className="input" value={roommate.citizenId} onChange={(e) => setRoommate((f) => ({ ...f, citizenId: e.target.value }))} /></FormField>
        </div>
      </Modal>

      {/* Modal gia hạn */}
      <Modal open={renewOpen} title="Gia hạn hợp đồng" onClose={() => setRenewOpen(false)} footer={<><button className="btn-secondary" onClick={() => setRenewOpen(false)}>Huỷ</button><button className="btn-primary" onClick={doRenew}>Gia hạn</button></>}>
        <div className="space-y-4">
          {error && <Alert message={error} onClose={() => setError('')} />}
          <FormField label="Kỳ hạn thêm (tháng)" required><input className="input" type="number" min={1} value={renew.termMonths} onChange={(e) => setRenew((f) => ({ ...f, termMonths: Number(e.target.value) }))} required /></FormField>
          <FormField label="Giá thuê mới (đ, bỏ trống giữ nguyên)"><input className="input" type="number" value={renew.rent} onChange={(e) => setRenew((f) => ({ ...f, rent: e.target.value }))} /></FormField>
        </div>
      </Modal>

      {/* Modal trả phòng / tất toán */}
      <Modal open={checkoutOpen} title="Trả phòng & tất toán cọc" onClose={() => setCheckoutOpen(false)} footer={<><button className="btn-secondary" onClick={() => setCheckoutOpen(false)}>Đóng</button>{!settlement && <button className="btn-danger" onClick={doCheckout}>Xác nhận trả phòng</button>}</>}>
        <div className="space-y-4">
          {error && <Alert message={error} onClose={() => setError('')} />}
          {settlement ? (
            <div className="space-y-3 text-sm">
              <Alert type="success" message="Đã tất toán xong. Hợp đồng kết thúc, phòng về trống." />
              <Row label="Tiền cọc" value={settlement.deposit} />
              <Row label="Hoá đơn kỳ cuối" value={settlement.finalInvoiceTotal} />
              <Row label="Công nợ các kỳ trước" value={settlement.outstandingDebt} />
              <Row label="Tổng khấu trừ" value={settlement.totalDeductions} />
              {settlement.deductions.map((d, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-500"><span>— {d.name}</span><span>{formatMoney(d.amount)}</span></div>
              ))}
              <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                <div className="flex justify-between font-semibold">
                  <span>{settlement.refund >= 0 ? 'Tiền hoàn cho khách' : 'Khách còn phải trả thêm'}</span>
                  <span className={settlement.refund >= 0 ? 'text-emerald-600' : 'text-red-600'}>{formatMoney(Math.abs(settlement.refund))}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <FormField label="Ngày trả thực tế" required><input className="input" type="date" value={checkout.moveOutDate} onChange={(e) => setCheckout((f) => ({ ...f, moveOutDate: e.target.value }))} required /></FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Chỉ số điện cuối"><input className="input" type="number" min={0} value={checkout.finalElectric} onChange={(e) => setCheckout((f) => ({ ...f, finalElectric: Number(e.target.value) }))} /></FormField>
                <FormField label="Chỉ số nước cuối"><input className="input" type="number" min={0} value={checkout.finalWater} onChange={(e) => setCheckout((f) => ({ ...f, finalWater: Number(e.target.value) }))} /></FormField>
              </div>
              <FormField label="Phạt cọc (đ, nếu có)"><input className="input" type="number" min={0} value={checkout.penalty} onChange={(e) => setCheckout((f) => ({ ...f, penalty: Number(e.target.value) }))} /></FormField>
              <div>
                <p className="label">Các khoản khấu trừ hư hỏng</p>
                <div className="flex gap-2">
                  <input className="input" placeholder="Tên khoản" value={deductionName} onChange={(e) => setDeductionName(e.target.value)} />
                  <input className="input" type="number" placeholder="Số tiền" value={deductionAmount} onChange={(e) => setDeductionAmount(e.target.value)} />
                  <button className="btn-secondary" type="button" onClick={addDeduction}>+</button>
                </div>
                {checkout.deductions.map((d, i) => (
                  <div key={i} className="mt-2 flex justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>{d.name}</span>
                    <span>{formatMoney(d.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-gray-700 dark:text-gray-200">
      <span>{label}</span>
      <span className="tabular-nums">{formatMoney(value)}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="py-16 text-center text-gray-400">{message}</div>;
}
