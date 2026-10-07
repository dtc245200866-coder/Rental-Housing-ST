import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, extractMessage } from '../../api/client';
import Alert from '../../components/Alert';
import FormField from '../../components/FormField';
import AuthLayout from './AuthLayout';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!/^0\d{9}$/.test(form.phone.trim())) {
      setError('Số điện thoại phải gồm 10 chữ số bắt đầu bằng số 0');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/register', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/verify-email', { state: { email: form.email.trim() } });
    } catch (err) {
      setError(extractMessage(err, 'Đăng ký thất bại').message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Đăng ký tài khoản" subtitle="Dành cho khách thuê tìm phòng">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert message={error} onClose={() => setError('')} />}
        <FormField label="Họ tên" required>
          <input className="input" value={form.name} onChange={set('name')} placeholder="NGUYEN VAN A" required />
        </FormField>
        <FormField label="Số điện thoại" required>
          <input className="input" value={form.phone} onChange={set('phone')} placeholder="Bắt đầu bằng 0" required />
        </FormField>
        <FormField label="Email" required>
          <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="example@email.com" required />
        </FormField>
        <FormField label="Mật khẩu" required>
          <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Mật khẩu dài ít nhất 8 ký tự" required />
        </FormField>
        <FormField label="Xác nhận mật khẩu" required>
          <input className="input" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Xác nhận mật khẩu" required />
        </FormField>
        <button className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Đang đăng ký…' : 'Đăng ký'}
        </button>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
