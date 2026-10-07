import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, extractMessage } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import Alert from '../../components/Alert';
import FormField from '../../components/FormField';

export default function ChangePassword() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (form.next !== form.confirm) {
      setError('Mật khẩu mới xác nhận không khớp');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.current,
        newPassword: form.next,
      });
      // Nếu là buộc đổi lần đầu thì đăng xuất để đăng nhập lại; ngược lại quay về.
      if (user?.mustChangePassword) {
        logout();
        navigate('/login');
      } else {
        navigate('/profile');
      }
    } catch (err) {
      setError(extractMessage(err, 'Đổi mật khẩu thất bại').message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Đổi mật khẩu</h1>
      {user?.mustChangePassword && (
        <Alert
          type="info"
          message="Tài khoản của bạn cần đổi mật khẩu trước khi tiếp tục sử dụng."
        />
      )}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert message={error} onClose={() => setError('')} />}
          <FormField label="Mật khẩu hiện tại" required>
            <input className="input" type="password" value={form.current} onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))} required />
          </FormField>
          <FormField label="Mật khẩu mới" required>
            <input className="input" type="password" value={form.next} onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))} required />
          </FormField>
          <FormField label="Xác nhận mật khẩu mới" required>
            <input className="input" type="password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} required />
          </FormField>
          <button className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Đang xử lý…' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}
