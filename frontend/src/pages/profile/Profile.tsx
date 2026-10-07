import { useEffect, useState, type FormEvent } from 'react';
import { api, extractMessage } from '../../api/client';
import { ROLE_LABELS } from '../../utils/constants';
import type { Profile as ProfileType } from '../../types';
import Loading from '../../components/Loading';
import Alert from '../../components/Alert';
import FormField from '../../components/FormField';

export default function Profile() {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    dateOfBirth: '',
    citizenId: '',
    hometown: '',
    job: '',
  });

  useEffect(() => {
    api
      .get<ProfileType>('/profile')
      .then(({ data }) => {
        setProfile(data);
        setForm({
          name: data.name,
          dateOfBirth: data.dateOfBirth,
          citizenId: data.citizenId,
          hometown: data.hometown,
          job: data.job,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaved('');
    try {
      await api.put('/profile', form);
      setSaved('Cập nhật hồ sơ thành công');
    } catch (err) {
      setError(extractMessage(err, 'Cập nhật thất bại').message);
    }
  }

  if (loading) return <Loading />;
  if (!profile) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Hồ sơ cá nhân</h1>

      <div className="card">
        <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400">Số điện thoại</p>
            <p className="font-medium text-gray-800 dark:text-gray-100">{profile.phone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Email</p>
            <p className="font-medium text-gray-800 dark:text-gray-100">{profile.email || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Vai trò</p>
            <p className="font-medium text-gray-800 dark:text-gray-100">{ROLE_LABELS[profile.role]}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {saved && <Alert type="success" message={saved} onClose={() => setSaved('')} />}
          {error && <Alert message={error} onClose={() => setError('')} />}
          <FormField label="Họ tên" required>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Ngày sinh">
              <input className="input" value={form.dateOfBirth} onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
            </FormField>
            <FormField label="Số căn cước">
              <input className="input" value={form.citizenId} onChange={(e) => setForm((f) => ({ ...f, citizenId: e.target.value }))} placeholder="9 hoặc 12 chữ số" />
            </FormField>
            <FormField label="Quê quán">
              <input className="input" value={form.hometown} onChange={(e) => setForm((f) => ({ ...f, hometown: e.target.value }))} />
            </FormField>
            <FormField label="Nghề nghiệp">
              <input className="input" value={form.job} onChange={(e) => setForm((f) => ({ ...f, job: e.target.value }))} />
            </FormField>
          </div>
          <button className="btn-primary" type="submit">Lưu hồ sơ</button>
        </form>
      </div>
    </div>
  );
}
