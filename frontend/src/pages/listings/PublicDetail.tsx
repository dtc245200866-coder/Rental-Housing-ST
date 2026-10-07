import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, extractMessage } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { assetUrl, formatArea, formatMoney } from '../../utils/format';
import { CALC_METHOD_LABELS } from '../../utils/constants';
import type { PublicListingDetail } from '../../types';
import Loading from '../../components/Loading';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function PublicDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<PublicListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form gửi yêu cầu
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'VIEWING' | 'RENT_NOW'>('VIEWING');
  const [desiredDate, setDesiredDate] = useState('');
  const [expectedPeople, setExpectedPeople] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultCode, setResultCode] = useState('');

  useEffect(() => {
    if (!id) return;
    api
      .get<PublicListingDetail>(`/public/listings/${id}`)
      .then(({ data }) => setListing(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  function openRequest() {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/listings/${id}` } } });
      return;
    }
    setError('');
    setResultCode('');
    setDesiredDate('');
    setOpen(true);
  }

  async function submitRequest() {
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/my/requests', {
        listingId: Number(id),
        type,
        desiredDate,
        expectedPeople,
        message,
      });
      setResultCode(data.requestCode);
    } catch (err) {
      setError(extractMessage(err, 'Gửi yêu cầu thất bại').message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-8"><Loading /></div>;
  if (notFound || !listing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="text-6xl">🔍</div>
        <p className="text-gray-500">Không tìm thấy tin đăng này.</p>
        <Link to="/" className="btn-primary">Quay lại tìm phòng</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            ← Quay lại
          </Link>
          {!user && (
            <Link to="/login" className="btn-secondary !py-1.5 text-xs">Đăng nhập</Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="card !p-0 overflow-hidden">
              {listing.images.length > 0 ? (
                <img
                  src={assetUrl(listing.images[0].url)}
                  alt={listing.title}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-gray-200 text-6xl">🏠</div>
              )}
              <div className="p-5">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {listing.title}
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {listing.address} · {listing.district}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-200">
                  <span>📐 {formatArea(listing.area)}</span>
                  <span>👥 Tối đa {listing.maxPeople} người</span>
                  <span>🏢 {listing.buildingName}</span>
                </div>
                {listing.description && (
                  <div className="mt-4">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Mô tả</h2>
                    <p className="mt-1 whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">
                      {listing.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {listing.images.length > 1 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {listing.images.slice(1).map((img) => (
                  <img
                    key={img.id}
                    src={assetUrl(img.url)}
                    alt=""
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="card">
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {formatMoney(listing.rent)}
                <span className="text-sm font-normal text-gray-400">/tháng</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Tiền cọc dự kiến: {formatMoney(listing.depositEstimate)}
              </p>

              <button className="btn-primary mt-4 w-full" onClick={openRequest}>
                {user ? 'Gửi yêu cầu / Đặt lịch xem' : 'Đăng nhập để gửi yêu cầu'}
              </button>
            </div>

            <div className="card mt-4">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Dịch vụ kèm theo</h2>
              {listing.services.length === 0 ? (
                <p className="mt-2 text-sm text-gray-400">Chưa cấu hình dịch vụ.</p>
              ) : (
                <ul className="mt-2 space-y-2 text-sm">
                  {listing.services.map((s, i) => (
                    <li key={i} className="flex justify-between text-gray-700 dark:text-gray-200">
                      <span>
                        {s.serviceName}
                        <span className="text-xs text-gray-400"> · {CALC_METHOD_LABELS[s.calculationMethod]}</span>
                      </span>
                      <span className="tabular-nums">
                        {s.calculationMethod === 'BY_METER'
                          ? `${formatMoney(s.price)}/${s.unit}`
                          : formatMoney(s.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 border-t border-gray-200 pt-3 text-sm dark:border-gray-700">
                <p className="flex justify-between text-gray-700 dark:text-gray-200">
                  <span>Ước tính tháng đầu:</span>
                  <span className="font-semibold">{formatMoney(listing.estimatedFirstMonth)}</span>
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Chưa bao gồm điện nước theo thực tế sử dụng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Modal
        open={open}
        title="Gửi yêu cầu thuê"
        onClose={() => setOpen(false)}
        footer={
          resultCode ? (
            <button className="btn-primary" onClick={() => setOpen(false)}>Đóng</button>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => setOpen(false)}>Huỷ</button>
              <button className="btn-primary" onClick={submitRequest} disabled={submitting}>
                {submitting ? 'Đang gửi…' : 'Gửi yêu cầu'}
              </button>
            </>
          )
        }
      >
        {resultCode ? (
          <div className="text-center">
            <Alert type="success" message={`Gửi yêu cầu thành công. Mã yêu cầu: ${resultCode}`} />
            <button className="btn-secondary mt-4" onClick={() => navigate('/my/requests')}>
              Xem yêu cầu của tôi
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && <Alert message={error} onClose={() => setError('')} />}
            <FormField label="Loại yêu cầu" required>
              <select className="input" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                <option value="VIEWING">Xem phòng</option>
                <option value="RENT_NOW">Thuê ngay</option>
              </select>
            </FormField>
            <FormField label="Ngày mong muốn" required>
              <input
                className="input"
                type="date"
                value={desiredDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDesiredDate(e.target.value)}
                required
              />
            </FormField>
            <FormField label={`Số người dự kiến ở (tối đa ${listing.maxPeople})`} required>
              <input
                className="input"
                type="number"
                min={1}
                max={listing.maxPeople}
                value={expectedPeople}
                onChange={(e) => setExpectedPeople(Number(e.target.value))}
              />
            </FormField>
            <FormField label="Lời nhắn">
              <textarea
                className="input"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </FormField>
          </div>
        )}
      </Modal>
    </div>
  );
}
