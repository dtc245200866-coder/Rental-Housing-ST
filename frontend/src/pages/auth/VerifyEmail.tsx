import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, extractMessage } from '../../api/client';
import Alert from '../../components/Alert';
import FormField from '../../components/FormField';
import AuthLayout from './AuthLayout';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = (location.state as { email?: string })?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/auth/verify-email', { email: email.trim(), otp });
      navigate('/login');
    } catch (err) {
      setError(extractMessage(err, 'Xác minh thất bại').message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Xác minh email" subtitle="Nhập mã OTP đã gửi về email">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert message={error} onClose={() => setError('')} />}
        <FormField label="Email" required>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </FormField>
        <FormField label="Mã xác minh (OTP)" required>
          <input className="input" value={otp} onChange={(e) => setOtp(e.target.value)} required />
        </FormField>
        <button className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Đang xác minh…' : 'Xác minh'}
        </button>
      </form>
    </AuthLayout>
  );
}
