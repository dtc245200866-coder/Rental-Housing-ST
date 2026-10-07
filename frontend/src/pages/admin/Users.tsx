import { useEffect, useState, type FormEvent } from 'react';
import { api, extractMessage } from '../../api/client';
import type { AdminUser, Role } from '../../types';
import { ROLE_LABELS } from '../../utils/constants';
import Badge from '../../components/Badge';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: 'LANDLORD' });
  const [tempPassword, setTempPassword] = useState('');
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    const params: Record<string, string> = {};
    if (role) params.role = role;
    api.get<AdminUser[]>('/admin/users', { params }).then(({ data }) => setUsers(data)).finally(() => setLoading(false));
  }
  useEffect(load, [role]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError('');
    setTempPassword('');
    try {
      const { data } = await api.post('/admin/users', form);
      setTempPassword(data.temporaryPassword);
      load();
    } catch (err) {
      setError(extractMessage(err, 'Tạo tài khoản thất bại').message);
    }
  }

  async function toggleLock(u: AdminUser) {
    try {
      await api.put(`/admin/users/${u.id}/${u.active ? 'lock' : 'unlock'}`);
      load();
    } catch (err) {
      alert(extractMessage(err, 'Thao tác thất bại').message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Tài khoản</h1>
        <button className="btn-primary" onClick={() => { setForm({ name: '', phone: '', email: '', role: 'LANDLORD' }); setTempPassword(''); setError(''); setFormOpen(true); }}>
          + Tạo tài khoản
        </button>
      </div>

      <select className="input max-w-xs" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="">Tất cả vai trò</option>
        {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>

      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : users.length === 0 ? (
          <EmptyState message="Không có tài khoản nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="table-th">Tên</th>
                  <th className="table-th">SĐT</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Vai trò</th>
                  <th className="table-th">Trạng thái</th>
                  <th className="table-th">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="table-td font-medium text-gray-900 dark:text-gray-100">{u.name}</td>
                    <td className="table-td">{u.phone}</td>
                    <td className="table-td">{u.email || '—'}</td>
                    <td className="table-td">{ROLE_LABELS[u.role]}</td>
                    <td className="table-td">
                      <Badge value={u.active ? 'ACTIVE' : 'LOCKED'} label={u.active ? 'Hoạt động' : 'Đã khoá'} />
                    </td>
                    <td className="table-td">
                      <button
                        className={u.active ? 'text-red-600 hover:underline' : 'text-emerald-600 hover:underline'}
                        onClick={() => toggleLock(u)}
                      >
                        {u.active ? 'Khoá' : 'Mở khoá'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={formOpen}
        title="Tạo tài khoản"
        onClose={() => setFormOpen(false)}
        footer={tempPassword ? <button className="btn-primary" onClick={() => setFormOpen(false)}>Đóng</button> : <><button className="btn-secondary" onClick={() => setFormOpen(false)}>Huỷ</button><button className="btn-primary" onClick={create}>Tạo</button></>}
      >
        {tempPassword ? (
          <div className="space-y-3">
            <Alert type="success" message="Tạo tài khoản thành công." />
            <p className="text-sm text-gray-700 dark:text-gray-200">
              Mật khẩu tạm: <b className="select-all font-mono">{tempPassword}</b>
            </p>
            <p className="text-xs text-gray-400">Mật khẩu cũng được gửi qua email. Người dùng phải đổi ở lần đăng nhập đầu.</p>
          </div>
        ) : (
          <form onSubmit={create} className="space-y-4">
            {error && <Alert message={error} onClose={() => setError('')} />}
            <FormField label="Họ tên" required><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></FormField>
            <FormField label="Số điện thoại" required><input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="0xxxxxxxxx" required /></FormField>
            <FormField label="Email"><input className="input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></FormField>
            <FormField label="Vai trò" required>
              <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}>
                <option value="LANDLORD">Chủ nhà</option>
                <option value="MANAGER">Quản lý toà nhà</option>
                <option value="ADMIN">Quản trị hệ thống</option>
              </select>
            </FormField>
          </form>
        )}
      </Modal>
    </div>
  );
}
