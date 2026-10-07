// Nhãn tiếng Việt cho các enum wire-string và các hằng số dùng chung của UI.

import type {
  CalculationMethod,
  ContractStatus,
  CostBearer,
  InvoiceItemType,
  InvoiceStatus,
  ListingStatus,
  MaintenanceStatus,
  MaintenanceUrgency,
  MeterStatus,
  PaymentMethod,
  PaymentStatus,
  RejectReason,
  RentalRequestStatus,
  RentalRequestType,
  Role,
  RoomStatus,
} from '../types';

export const ROLE_LABELS: Record<Role, string> = {
  TENANT: 'Khách thuê',
  LANDLORD: 'Chủ nhà',
  MANAGER: 'Quản lý toà nhà',
  ADMIN: 'Quản trị hệ thống',
};

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  EMPTY: 'Trống',
  DEPOSITED: 'Đã đặt cọc',
  RENTED: 'Đang thuê',
  STOPPED: 'Ngừng cho thuê',
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đang hiển thị',
  HIDDEN: 'Tạm ẩn',
  RENTED: 'Đã cho thuê',
};

export const CALC_METHOD_LABELS: Record<CalculationMethod, string> = {
  BY_METER: 'Theo chỉ số',
  BY_PERSON: 'Theo đầu người',
  FIXED_ROOM: 'Cố định theo phòng',
};

export const REQUEST_TYPE_LABELS: Record<RentalRequestType, string> = {
  VIEWING: 'Xem phòng',
  RENT_NOW: 'Thuê ngay',
};

export const REQUEST_STATUS_LABELS: Record<RentalRequestStatus, string> = {
  OPEN: 'Mới',
  SCHEDULED: 'Đã hẹn lịch',
  ACCEPTED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã huỷ',
  COMPLETED: 'Đã xong',
};

export const REJECT_REASON_LABELS: Record<RejectReason, string> = {
  ALREADY_RENTED: 'Đã có khách thuê',
  PEOPLE_MISMATCH: 'Không phù hợp số người',
  UNREACHABLE: 'Khách không liên lạc được',
  OTHER: 'Lý do khác',
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ACTIVE: 'Đang hiệu lực',
  EXPIRED: 'Đã hết hạn',
  TERMINATED: 'Đã kết thúc',
  RENEWED: 'Đã gia hạn',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Nháp',
  ISSUED: 'Đã phát hành',
  PARTIAL: 'Trả một phần',
  PAID: 'Đã thanh toán',
  OVERDUE: 'Quá hạn',
  CANCELLED: 'Đã huỷ',
};

export const INVOICE_ITEM_LABELS: Record<InvoiceItemType, string> = {
  ROOM_RENT: 'Tiền phòng',
  ELECTRICITY: 'Tiền điện',
  WATER: 'Tiền nước',
  SERVICE_FIXED: 'Dịch vụ cố định',
  SERVICE_PERSON: 'Dịch vụ theo người',
  EXTRA: 'Phát sinh',
  DISCOUNT: 'Giảm trừ',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Tiền mặt',
  TRANSFER: 'Chuyển khoản',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã huỷ',
};

export const METER_STATUS_LABELS: Record<MeterStatus, string> = {
  PENDING: 'Chưa chốt',
  FINALIZED: 'Đã chốt',
};

export const MAINTENANCE_URGENCY_LABELS: Record<MaintenanceUrgency, string> = {
  NORMAL: 'Thường',
  URGENT: 'Gấp',
};

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  NEW: 'Mới',
  IN_PROGRESS: 'Đang xử lý',
  DONE: 'Đã xong',
  REJECTED: 'Từ chối',
};

export const COST_BEARER_LABELS: Record<CostBearer, string> = {
  LANDLORD: 'Chủ nhà',
  TENANT: 'Khách thuê',
};

export const PERMISSION_LABELS: Record<string, string> = {
  ADMIN_ACCESS: 'Quản trị hệ thống',
  BUILDING_MANAGE: 'Toà nhà',
  ROOM_MANAGE: 'Phòng',
  SERVICE_MANAGE: 'Dịch vụ',
  LISTING_MANAGE: 'Tin đăng',
  CONTRACT_MANAGE: 'Hợp đồng',
  METER_MANAGE: 'Chỉ số điện nước',
  INVOICE_MANAGE: 'Hoá đơn',
  PAYMENT_MANAGE: 'Thanh toán',
  MAINTENANCE_MANAGE: 'Báo hỏng',
  REPORT_VIEW: 'Báo cáo',
  PROFILE_VIEW: 'Hồ sơ',
};

// Sắc thái màu cho Badge theo trạng thái (dùng chung).
export const STATUS_COLOR: Record<string, string> = {
  // Room
  EMPTY: 'bg-emerald-100 text-emerald-700',
  DEPOSITED: 'bg-amber-100 text-amber-700',
  RENTED: 'bg-blue-100 text-blue-700',
  STOPPED: 'bg-gray-200 text-gray-600',
  // Listing
  DRAFT: 'bg-gray-200 text-gray-600',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  HIDDEN: 'bg-amber-100 text-amber-700',
  // RentalRequest
  OPEN: 'bg-blue-100 text-blue-700',
  SCHEDULED: 'bg-violet-100 text-violet-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-200 text-gray-600',
  COMPLETED: 'bg-teal-100 text-teal-700',
  // Contract
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-gray-200 text-gray-600',
  TERMINATED: 'bg-red-100 text-red-700',
  RENEWED: 'bg-blue-100 text-blue-700',
  // Invoice
  ISSUED: 'bg-blue-100 text-blue-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-red-100 text-red-700',
  // Payment
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  // Meter
  FINALIZED: 'bg-emerald-100 text-emerald-700',
  // Maintenance
  NEW: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  DONE: 'bg-emerald-100 text-emerald-700',
  URGENT: 'bg-red-100 text-red-700',
  NORMAL: 'bg-gray-200 text-gray-600',
};
