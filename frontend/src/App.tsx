import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { RequireAuth, RequirePermission } from './auth/RequirePermission';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

import PublicSearch from './pages/listings/PublicSearch';
import PublicDetail from './pages/listings/PublicDetail';

import Home from './pages/dashboard/Home';
import Profile from './pages/profile/Profile';
import ChangePassword from './pages/profile/ChangePassword';
import Notifications from './pages/notifications/Notifications';

import MyRequests from './pages/requests/MyRequests';
import MyContracts from './pages/contracts/MyContracts';
import MyInvoices from './pages/invoices/MyInvoices';
import MyMaintenance from './pages/maintenance/MyMaintenance';

import Buildings from './pages/buildings/Buildings';
import Rooms from './pages/rooms/Rooms';
import RoomDetail from './pages/rooms/RoomDetail';
import Services from './pages/services/Services';
import Listings from './pages/listings/Listings';
import Requests from './pages/requests/Requests';
import Contracts from './pages/contracts/Contracts';
import ContractDetail from './pages/contracts/ContractDetail';
import MeterReadings from './pages/meter/MeterReadings';
import Invoices from './pages/invoices/Invoices';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import Payments from './pages/invoices/Payments';
import Debts from './pages/debts/Debts';
import Maintenance from './pages/maintenance/Maintenance';
import Reports from './pages/reports/Reports';
import AdminUsers from './pages/admin/Users';
import AuditLogs from './pages/admin/AuditLogs';

export default function App() {
  return (
    <Routes>
      {/* Công khai */}
      <Route path="/" element={<PublicSearch />} />
      <Route path="/listings/:id" element={<PublicDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Đã đăng nhập */}
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Home />} />
        <Route path="/profile" element={<RequirePermission permission="PROFILE_VIEW"><Profile /></RequirePermission>} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/notifications" element={<Notifications />} />

        {/* Của tôi (tenant) */}
        <Route path="/my/requests" element={<MyRequests />} />
        <Route path="/my/contracts" element={<MyContracts />} />
        <Route path="/my/invoices" element={<MyInvoices />} />
        <Route path="/my/maintenance" element={<MyMaintenance />} />

        {/* Quản lý */}
        <Route path="/buildings" element={<RequirePermission permission="BUILDING_MANAGE"><Buildings /></RequirePermission>} />
        <Route path="/rooms" element={<RequirePermission permission="ROOM_MANAGE"><Rooms /></RequirePermission>} />
        <Route path="/rooms/:id" element={<RequirePermission permission="ROOM_MANAGE"><RoomDetail /></RequirePermission>} />
        <Route path="/services" element={<RequirePermission permission="SERVICE_MANAGE"><Services /></RequirePermission>} />
        <Route path="/listings" element={<RequirePermission permission="LISTING_MANAGE"><Listings /></RequirePermission>} />
        <Route path="/requests" element={<RequirePermission permission="LISTING_MANAGE"><Requests /></RequirePermission>} />
        <Route path="/contracts" element={<RequirePermission permission="CONTRACT_MANAGE"><Contracts /></RequirePermission>} />
        <Route path="/contracts/:id" element={<RequirePermission permission="CONTRACT_MANAGE"><ContractDetail /></RequirePermission>} />
        <Route path="/meter-readings" element={<RequirePermission permission="METER_MANAGE"><MeterReadings /></RequirePermission>} />
        <Route path="/invoices" element={<RequirePermission permission="INVOICE_MANAGE"><Invoices /></RequirePermission>} />
        <Route path="/invoices/:id" element={<RequirePermission permission="INVOICE_MANAGE"><InvoiceDetail /></RequirePermission>} />
        <Route path="/payments" element={<RequirePermission permission="PAYMENT_MANAGE"><Payments /></RequirePermission>} />
        <Route path="/debts" element={<RequirePermission permission="INVOICE_MANAGE"><Debts /></RequirePermission>} />
        <Route path="/maintenance" element={<RequirePermission permission="MAINTENANCE_MANAGE"><Maintenance /></RequirePermission>} />
        <Route path="/reports" element={<RequirePermission permission="REPORT_VIEW"><Reports /></RequirePermission>} />

        {/* Hệ thống */}
        <Route path="/admin/users" element={<RequirePermission permission="ADMIN_ACCESS"><AdminUsers /></RequirePermission>} />
        <Route path="/admin/audit-logs" element={<RequirePermission permission="ADMIN_ACCESS"><AuditLogs /></RequirePermission>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
