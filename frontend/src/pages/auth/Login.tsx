import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../auth/AuthContext';
import { extractMessage } from '../../api/client';
import { useToast } from '../../components/ToastProvider';
import Alert from '../../components/Alert';
import FormField from '../../components/FormField';
import AuthLayout from './AuthLayout';

function formatCountdown(totalSeconds: number): string {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  // Đồng hồ đếm ngược khi tài khoản bị khóa tạm.
  useEffect(() => {
    if (!lockedUntil) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const lockedSeconds = lockedUntil
    ? Math.max(0, Math.ceil((new Date(lockedUntil).getTime() - now) / 1000))
    : 0;

  useEffect(() => {
    if (lockedUntil && lockedSeconds === 0) {
      setLockedUntil(null);
      setError('');
    }
  }, [lockedSeconds, lockedUntil]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setRemaining(null);
    setLockedUntil(null);
    setSubmitting(true);
    try {
      const res = await login(identifier.trim(), password);
      toast.show('Đăng nhập thành công', 'success');
      navigate(res.mustChangePassword ? '/change-password' : from, { replace: true });
    } catch (err) {
      setError(extractMessage(err, 'Đăng nhập thất bại').message);
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as
          | { remainingAttempts?: number; lockedUntil?: string }
          | undefined;
        if (typeof data?.remainingAttempts === 'number') {
          setRemaining(data.remainingAttempts);
        }
        if (data?.lockedUntil) {
          setLockedUntil(data.lockedUntil);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isLocked = !!lockedUntil && lockedSeconds > 0;

  return (
    <AuthLayout title="Đăng nhập" subtitle="Số điện thoại hoặc email cùng mật khẩu">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert message={error} onClose={() => setError('')} />}

        {remaining !== null && !isLocked && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            Còn {remaining} lần thử trước khi tài khoản bị khóa.
          </p>
        )}

        {isLocked && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            Tài khoản bị khóa tạm thời. Thử lại sau{' '}
            <span className="font-mono font-semibold tabular-nums">{formatCountdown(lockedSeconds)}</span>.
          </p>
        )}

        <FormField label="Số điện thoại / Email" required>
          <input
            className="input"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="0901234567 hoặc email"
            required
          />
        </FormField>
        <FormField label="Mật khẩu" required>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormField>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline dark:text-primary-400">
            Quên mật khẩu?
          </Link>
        </div>
        <button className="btn-primary w-full" disabled={submitting || isLocked}>
          {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
            Đăng ký
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
