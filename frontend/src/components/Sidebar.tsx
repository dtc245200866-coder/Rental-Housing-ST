import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Icon, { type IconName } from './Icon';
import type { Permission } from '../types';

interface Item {
  to: string;
  label: string;
  icon: IconName;
  permission?: Permission;
}
interface Group {
  title: string;
  items: Item[];
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, hasPermission } = useAuth();
  if (!user) return null;

  const visible = (item: Item) => !item.permission || hasPermission(item.permission);

  const groups: Group[] = [
    { title: 'Tổng quan', items: [{ to: '/dashboard', label: 'Trang chủ', icon: 'home' }] },
  ];

  if (user.role === 'TENANT') {
    groups.push({
      title: 'Của tôi',
      items: [
        { to: '/my/requests', label: 'Yêu cầu của tôi', icon: 'inbox' },
        { to: '/my/contracts', label: 'Hợp đồng của tôi', icon: 'file' },
        { to: '/my/invoices', label: 'Hoá đơn của tôi', icon: 'receipt' },
        { to: '/my/maintenance', label: 'Báo hỏng', icon: 'wrench' },
      ],
    });
  }

  const management: Item[] = [
    { to: '/buildings', label: 'Toà nhà', icon: 'building', permission: 'BUILDING_MANAGE' },
    { to: '/rooms', label: 'Phòng', icon: 'grid', permission: 'ROOM_MANAGE' },
    { to: '/services', label: 'Dịch vụ', icon: 'bolt', permission: 'SERVICE_MANAGE' },
    { to: '/listings', label: 'Tin đăng', icon: 'megaphone', permission: 'LISTING_MANAGE' },
    { to: '/requests', label: 'Yêu cầu thuê', icon: 'inbox', permission: 'LISTING_MANAGE' },
    { to: '/contracts', label: 'Hợp đồng', icon: 'file', permission: 'CONTRACT_MANAGE' },
    { to: '/meter-readings', label: 'Chỉ số điện nước', icon: 'gauge', permission: 'METER_MANAGE' },
    { to: '/invoices', label: 'Hoá đơn', icon: 'receipt', permission: 'INVOICE_MANAGE' },
    { to: '/payments', label: 'Thanh toán', icon: 'dollar', permission: 'PAYMENT_MANAGE' },
    { to: '/debts', label: 'Công nợ', icon: 'alert', permission: 'INVOICE_MANAGE' },
    { to: '/maintenance', label: 'Báo hỏng', icon: 'wrench', permission: 'MAINTENANCE_MANAGE' },
    { to: '/reports', label: 'Báo cáo', icon: 'chart', permission: 'REPORT_VIEW' },
  ];
  if (management.some(visible)) {
    groups.push({ title: 'Quản lý', items: management.filter(visible) });
  }

  if (hasPermission('ADMIN_ACCESS')) {
    groups.push({
      title: 'Hệ thống',
      items: [
        { to: '/admin/users', label: 'Tài khoản', icon: 'users' },
        { to: '/admin/audit-logs', label: 'Nhật ký hoạt động', icon: 'history' },
      ],
    });
  }

  groups.push({
    title: 'Cá nhân',
    items: [{ to: '/profile', label: 'Hồ sơ', icon: 'user' }],
  });

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3.5 pb-6 pt-2.5">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3.5 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-[#8b93c9]">
            {group.title}
          </p>
          <ul className="flex flex-col gap-1">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `side-nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
