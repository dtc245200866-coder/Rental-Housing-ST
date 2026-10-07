import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, extractMessage } from '../../api/client';
import Alert from '../../components/Alert';
import FormField from '../../components/FormField';
import AuthLayout from './AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(extractMessage(err, 'Gửi yêu cầu thất bại').message);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Kiểm tra email">
        <Alert
          type="success"
          message="Liên kết đặt lại mật khẩu đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư."
        />
        <Link to="/login" className="btn-primary mt-4 w-full">
          Quay lại đăng nhập
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Quên mật khẩu" subtitle="Nhập email để nhận liên kết đặt lại">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert message={error} onClose={() => setError('')} />}
        <FormField label="Email" required>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </FormField>
        <button className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Đang gửi…' : 'Gửi liên kết'}
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
