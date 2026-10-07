// Định nghĩa kiểu dữ liệu cho toàn bộ frontend, đánh theo API contract của backend.

export type Role = 'TENANT' | 'LANDLORD' | 'MANAGER' | 'ADMIN';

export type Permission =
  | 'ADMIN_ACCESS'
  | 'BUILDING_MANAGE'
  | 'ROOM_MANAGE'
  | 'SERVICE_MANAGE'
  | 'LISTING_MANAGE'
  | 'CONTRACT_MANAGE'
  | 'METER_MANAGE'
  | 'INVOICE_MANAGE'
  | 'PAYMENT_MANAGE'
  | 'MAINTENANCE_MANAGE'
  | 'REPORT_VIEW'
  | 'PROFILE_VIEW';

export interface AuthUser {
  id: number;
  name: string;
  phone: string;
  email: string;
  role: Role;
  active: boolean;
  mustChangePassword: boolean;
  permissions: Permission[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  role: Role;
  name: string;
  mustChangePassword: boolean;
  userId: number;
}

// --- Toà nhà ---
export interface Building {
  id: number;
  name: string;
  address: string;
  district: string;
  floors: number;
  note: string;
  active: boolean;
  landlordId: number;
  landlordName: string;
  managerId: number | null;
  managerName: string;
  totalRooms: number;
  emptyRooms: number;
}

// --- Phòng ---
export type RoomStatus = 'EMPTY' | 'DEPOSITED' | 'RENTED' | 'STOPPED';

export interface Room {
  id: number;
  code: string;
  buildingId: number;
  buildingName: string;
  floor: number;
  area: number;
  rent: number;
  maxPeople: number;
  status: RoomStatus;
}

// --- Dịch vụ ---
export type CalculationMethod = 'BY_METER' | 'BY_PERSON' | 'FIXED_ROOM';

export interface Service {
  id: number;
  name: string;
  calculationMethod: CalculationMethod;
  unit: string;
  price: number;
  description: string;
  active: boolean;
}

export interface ServicePriceHistory {
  price: number;
  effectiveFrom: string;
}

export interface BuildingService {
  id: number;
  serviceId: number;
  serviceName: string;
  calculationMethod: CalculationMethod;
  price: number;
  effectiveFrom: string;
}

export interface RoomService {
  id: number;
  serviceId: number;
  serviceName: string;
  calculationMethod: CalculationMethod;
  unit: string;
  price: number;
}

export interface RoomImage {
  id: number;
  url: string;
  sortOrder: number;
}

// --- Tin đăng ---
export type ListingStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'RENTED';

export interface Listing {
  id: number;
  roomId: number;
  roomCode: string;
  buildingName: string;
  title: string;
  description: string;
  status: ListingStatus;
  rent: number;
  area: number;
  createdAt: string;
  expiresAt: string;
}

export interface PublicListing {
  id: number;
  title: string;
  roomCode: string;
  buildingName: string;
  district: string;
  address: string;
  rent: number;
  area: number;
  maxPeople: number;
  coverImage: string;
}

export interface PublicListingDetail {
  id: number;
  title: string;
  description: string;
  roomId: number;
  roomCode: string;
  buildingName: string;
  address: string;
  district: string;
  area: number;
  rent: number;
  maxPeople: number;
  depositEstimate: number;
  images: { id: number; url: string }[];
  services: {
    serviceName: string;
    calculationMethod: CalculationMethod;
    unit: string;
    price: number;
  }[];
  estimatedFirstMonth: number;
}

// --- Yêu cầu thuê ---
export type RentalRequestType = 'VIEWING' | 'RENT_NOW';
export type RentalRequestStatus =
  | 'OPEN'
  | 'SCHEDULED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';
export type RejectReason = 'ALREADY_RENTED' | 'PEOPLE_MISMATCH' | 'UNREACHABLE' | 'OTHER';

export interface RentalRequest {
  id: number;
  requestCode: string;
  listingId: number;
  roomCode: string;
  buildingId: number;
  buildingName: string;
  tenantId: number;
  tenantName: string;
  tenantPhone: string;
  type: RentalRequestType;
  desiredDate: string;
  expectedPeople: number;
  message: string;
  status: RentalRequestStatus;
  scheduledAt: string | null;
  rejectReason: RejectReason | null;
  rejectNote: string;
  createdAt: string;
}

export interface RentalRequestHistory {
  fromStatus: string;
  toStatus: string;
  actorName: string;
  note: string;
  createdAt: string;
}

// --- Hợp đồng ---
export type ContractStatus = 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'RENEWED';

export interface Contract {
  id: number;
  code: string;
  tenantId: number;
  tenantName: string;
  tenantPhone: string;
  roomId: number;
  roomCode: string;
  buildingId: number;
  buildingName: string;
  deposit: number;
  rent: number;
  startDate: string;
  endDate: string;
  termMonths: number;
  billingDay: number;
  status: ContractStatus;
}

export interface Roommate {
  id: number;
  name: string;
  phone: string;
  citizenId: string;
  startDate: string;
  moveOutDate: string;
}

export interface ContractRenewal {
  oldEndDate: string;
  newEndDate: string;
  termMonths: number;
  rent: number;
  renewedAt: string;
}

export interface ContractDetail extends Contract {
  roommates: Roommate[];
  renewals: ContractRenewal[];
}

export interface MyContract {
  id: number;
  code: string;
  roomId: number;
  roomCode: string;
  buildingName: string;
  address: string;
  deposit: number;
  rent: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
}

// --- Chỉ số điện nước ---
export type MeterStatus = 'PENDING' | 'FINALIZED';

export interface MeterReadingRow {
  roomId: number;
  roomCode: string;
  floor: number;
  prevElectric: number;
  prevWater: number;
  currentElectric: number | null;
  currentWater: number | null;
  status: MeterStatus;
  recordedAt: string | null;
}

export interface MeterProgress {
  totalRooms: number;
  done: number;
  missing: number;
  missingRooms: string[];
}

// --- Hoá đơn ---
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type InvoiceItemType =
  | 'ROOM_RENT'
  | 'ELECTRICITY'
  | 'WATER'
  | 'SERVICE_FIXED'
  | 'SERVICE_PERSON'
  | 'EXTRA'
  | 'DISCOUNT';

export interface Invoice {
  id: number;
  code: string;
  contractId: number;
  roomId: number;
  roomCode: string;
  buildingName: string;
  tenantName: string;
  period: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
}

export interface InvoiceItem {
  id: number;
  itemType: InvoiceItemType;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

export interface InvoiceDetail extends Invoice {
  items: InvoiceItem[];
  payments: Payment[];
}

export interface MyInvoice {
  id: number;
  code: string;
  roomCode: string;
  buildingName: string;
  period: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
}

// --- Thanh toán ---
export type PaymentMethod = 'CASH' | 'TRANSFER';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Payment {
  id: number;
  invoiceId?: number;
  invoiceCode?: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  status: PaymentStatus;
  proofImageUrl: string;
  note: string;
}

// --- Công nợ ---
export interface DebtRow {
  roomId: number;
  roomCode: string;
  buildingId: number;
  buildingName: string;
  tenantName: string;
  tenantPhone: string;
  outstandingInvoices: number;
  totalRemaining: number;
  maxOverdueDays: number;
}

export interface DebtSummary {
  debts: DebtRow[];
  totalRemaining: number;
  count: number;
}

// --- Báo hỏng ---
export type MaintenanceUrgency = 'NORMAL' | 'URGENT';
export type MaintenanceStatus = 'NEW' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';
export type CostBearer = 'LANDLORD' | 'TENANT';

export interface MaintenanceRequest {
  id: number;
  code: string;
  roomId: number;
  roomCode: string;
  buildingId: number;
  buildingName: string;
  tenantName: string;
  deviceType: string;
  description: string;
  urgency: MaintenanceUrgency;
  status: MaintenanceStatus;
  cost: number;
  costBearer: CostBearer | null;
  note: string;
  createdAt: string;
}

// --- Thông báo ---
export interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  link: string;
  read: boolean;
  createdAt: string;
}

// --- Báo cáo ---
export interface ReportSummary {
  monthly: {
    period: string;
    issued: number;
    collected: number;
    remaining: number;
  }[];
  totalRooms: number;
  rentedRooms: number;
  occupancyRate: number;
}

// --- Hồ sơ cá nhân ---
export interface Profile {
  id: number;
  name: string;
  phone: string;
  email: string;
  role: Role;
  dateOfBirth: string;
  citizenId: string;
  hometown: string;
  job: string;
}

// --- Danh bạ người dùng (hỗ trợ chọn khách thuê khi lập hợp đồng) ---
export interface TenantUser {
  id: number;
  name: string;
  phone: string;
  email: string;
}

// --- Admin ---
export interface AdminUser {
  id: number;
  name: string;
  phone: string;
  email: string;
  role: Role;
  active: boolean;
  mustChangePassword: boolean;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  objectType: string;
  objectId: number;
  beforeData: string;
  afterData: string;
}

// Lỗi chuẩn hoá từ backend
export interface ApiError {
  message: string;
  status?: number;
}
