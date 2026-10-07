import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    api
      .get<{ unreadCount: number }>('/my/notifications/unread-count')
      .then(({ data }) => setCount(data.unreadCount))
      .catch(() => setCount(0));
  }, []);

  return (
    <Link
      to="/notifications"
      className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
      aria-label="Thông báo"
    >
      <span className="text-xl">🔔</span>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
