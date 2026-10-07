import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { formatDateTime } from '../../utils/format';
import type { Notification } from '../../types';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Notification[]>('/my/notifications')
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: number) {
    await api.put(`/my/notifications/${id}/read`).catch(() => {});
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async function markAll() {
    await api.put('/my/notifications/read-all').catch(() => {});
    setItems((list) => list.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Thông báo</h1>
        <button className="btn-secondary !py-1.5 text-xs" onClick={markAll}>
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="card !p-0">
        {loading ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState message="Chưa có thông báo nào" />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {items.map((n) => (
              <li
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`cursor-pointer px-4 py-3 ${n.read ? 'opacity-70' : 'bg-primary-50/50 dark:bg-primary-900/20'}`}
              >
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{n.title}</p>
                {n.content && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{n.content}</p>}
                <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
