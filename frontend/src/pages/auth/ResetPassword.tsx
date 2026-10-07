import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, extractMessage } from '../../api/client';
import Alert from '../../components/Alert';
import FormField from '../../components/FormField';
import AuthLayout from './AuthLayout';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      navigate('/login');
    } catch (err) {
      setError(extractMessage(err, 'Đặt lại mật khẩu thất bại').message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Đặt lại mật khẩu">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert message={error} onClose={() => setError('')} />}
        <FormField label="Mật khẩu mới" required>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </FormField>
        <FormField label="Xác nhận mật khẩu" required>
          <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </FormField>
        <button className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Đang xử lý…' : 'Đặt lại mật khẩu'}
        </button>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          <Link to="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
            Quay lại đăng nhập
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
