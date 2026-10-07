import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Icon from './Icon';

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
      className="relative rounded-lg p-2 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
      aria-label="Thông báo"
    >
      <Icon name="bell" className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#dc2626] px-1 text-xs font-semibold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
