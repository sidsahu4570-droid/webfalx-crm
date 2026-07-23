import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';

import { ProtectedRoute } from './components/common/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

import { CallerDashboard } from './pages/CallerDashboard';
import { LeadsPage } from './pages/LeadsPage';
import { NewLeadsPage } from './pages/NewLeadsPage';
import { FollowupsPage } from './pages/FollowupsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CallerReportsPage } from './pages/CallerReportsPage';
import { CallerConvertedClientsPage } from './pages/CallerConvertedClientsPage';
import { WebsiteProgressPage } from './pages/WebsiteProgressPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { CallerPaymentsPage } from './pages/CallerPaymentsPage';
import { MeetingsPage } from './pages/MeetingsPage';
import { CallerAttendancePage } from './pages/CallerAttendancePage';
import { CallerBonusDashboard } from './pages/CallerBonusDashboard';

import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminLeadsPage } from './pages/AdminLeadsPage';
import { AdminActivityPage } from './pages/AdminActivityPage';
import { AdminReportsPage } from './pages/AdminReportsPage';
import { AdminConvertedClientsPage } from './pages/AdminConvertedClientsPage';
import { AdminRevenuePage } from './pages/AdminRevenuePage';
import { AppRevenuePage } from './pages/AppRevenuePage';
import { OverallRevenuePage } from './pages/OverallRevenuePage';
import { AdminImportHistoryPage } from './pages/AdminImportHistoryPage';

import { DeletedHistoryPage } from './pages/DeletedHistoryPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AttendancePage } from './pages/AttendancePage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { BonusManagementPage } from './pages/BonusManagementPage';
import { AdminCategoriesPage } from './pages/AdminCategoriesPage';
import { AdminCitiesPage } from './pages/AdminCitiesPage';
import { AdminSalaryManagementPage } from './pages/AdminSalaryManagementPage';
import { CallerSalaryPaymentsPage } from './pages/CallerSalaryPaymentsPage';
import { AdminResourcesPage } from './pages/AdminResourcesPage';
import { CallerResourcesPage } from './pages/CallerResourcesPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Caller Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<CallerDashboard />} />
                  <Route path="new-leads" element={<NewLeadsPage />} />
                  <Route path="leads" element={<LeadsPage />} />
                  <Route path="followups" element={<FollowupsPage />} />
                  <Route path="converted-clients" element={<CallerConvertedClientsPage />} />
                  <Route path="website-progress" element={<WebsiteProgressPage />} />
                  <Route path="payments" element={<CallerPaymentsPage />} />
                  <Route path="my-salary" element={<CallerSalaryPaymentsPage />} />
                  <Route path="meetings" element={<MeetingsPage />} />
                  <Route path="leaderboard" element={<LeaderboardPage />} />
                  <Route path="attendance" element={<CallerAttendancePage />} />
                  <Route path="bonus" element={<CallerBonusDashboard />} />
                  <Route path="reports" element={<CallerReportsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="resources" element={<CallerResourcesPage />} />
                </Route>

                {/* Protected Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="leads" element={<AdminLeadsPage />} />
                  <Route path="new-leads" element={<NewLeadsPage />} />
                  <Route path="converted-clients" element={<AdminConvertedClientsPage />} />
                  <Route path="revenue" element={<AdminRevenuePage />} />
                  <Route path="website-revenue" element={<AdminRevenuePage />} />
                  <Route path="app-revenue" element={<AppRevenuePage />} />
                  <Route path="overall-revenue" element={<OverallRevenuePage />} />
                  <Route path="website-progress" element={<WebsiteProgressPage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="meetings" element={<MeetingsPage />} />
                  <Route path="leaderboard" element={<LeaderboardPage />} />
                  <Route path="deleted-history" element={<DeletedHistoryPage />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="audit-logs" element={<AuditLogsPage />} />
                  <Route path="categories" element={<AdminCategoriesPage />} />
                  <Route path="cities" element={<AdminCitiesPage />} />
                  <Route path="resources" element={<AdminResourcesPage />} />
                  <Route path="salary-management" element={<AdminSalaryManagementPage />} />
                  <Route path="bonuses" element={<BonusManagementPage />} />
                  <Route path="reports" element={<AdminReportsPage />} />
                  <Route path="import-history" element={<AdminImportHistoryPage />} />
                  <Route path="activity" element={<AdminActivityPage />} />
                </Route>

                {/* Direct Leaderboard route */}
                <Route
                  path="/leaderboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<LeaderboardPage />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
