import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Permission } from '../types';

interface Item {
  to: string;
  label: string;
  icon: string;
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
    { title: 'Tổng quan', items: [{ to: '/dashboard', label: 'Trang chủ', icon: '🏠' }] },
  ];

  if (user.role === 'TENANT') {
    groups.push({
      title: 'Của tôi',
      items: [
        { to: '/my/requests', label: 'Yêu cầu của tôi', icon: '📋' },
        { to: '/my/contracts', label: 'Hợp đồng của tôi', icon: '📄' },
        { to: '/my/invoices', label: 'Hoá đơn của tôi', icon: '🧾' },
        { to: '/my/maintenance', label: 'Báo hỏng', icon: '🔧' },
      ],
    });
  }

  const management = [
    { to: '/buildings', label: 'Toà nhà', icon: '🏢', permission: 'BUILDING_MANAGE' },
    { to: '/rooms', label: 'Phòng', icon: '🚪', permission: 'ROOM_MANAGE' },
    { to: '/services', label: 'Dịch vụ', icon: '⚡', permission: 'SERVICE_MANAGE' },
    { to: '/listings', label: 'Tin đăng', icon: '📢', permission: 'LISTING_MANAGE' },
    { to: '/requests', label: 'Yêu cầu thuê', icon: '📥', permission: 'LISTING_MANAGE' },
    { to: '/contracts', label: 'Hợp đồng', icon: '📄', permission: 'CONTRACT_MANAGE' },
    { to: '/meter-readings', label: 'Chỉ số điện nước', icon: '🔢', permission: 'METER_MANAGE' },
    { to: '/invoices', label: 'Hoá đơn', icon: '🧾', permission: 'INVOICE_MANAGE' },
    { to: '/payments', label: 'Thanh toán', icon: '💵', permission: 'PAYMENT_MANAGE' },
    { to: '/debts', label: 'Công nợ', icon: '⚠️', permission: 'INVOICE_MANAGE' },
    { to: '/maintenance', label: 'Báo hỏng', icon: '🔧', permission: 'MAINTENANCE_MANAGE' },
    { to: '/reports', label: 'Báo cáo', icon: '📊', permission: 'REPORT_VIEW' },
  ] as Item[];
  if (management.some(visible)) {
    groups.push({ title: 'Quản lý', items: management.filter(visible) });
  }

  if (hasPermission('ADMIN_ACCESS')) {
    groups.push({
      title: 'Hệ thống',
      items: [
        { to: '/admin/users', label: 'Tài khoản', icon: '👥' },
        { to: '/admin/audit-logs', label: 'Nhật ký hoạt động', icon: '🕘' },
      ],
    });
  }

  groups.push({
    title: 'Cá nhân',
    items: [{ to: '/profile', label: 'Hồ sơ', icon: '👤' }],
  });

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto p-4">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {group.title}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                    }`
                  }
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
