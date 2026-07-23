import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Settings,
  Shield,
  UserCheck,
  Layers,
  Activity,
  ChevronRight,
  FileText,
  Briefcase,
  Globe,
  DollarSign,
  Calendar,
  TrendingUp,
  Award,
  Sparkles,
  History,
  Smartphone,
  PieChart,
  Trophy,
  Trash2,
  Clock,
  ShieldCheck,
  MapPin,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const callerNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'New Leads', path: '/dashboard/new-leads', icon: Sparkles },
    { label: 'My Prospects', path: '/dashboard/leads', icon: Users },
    { label: 'Follow-ups Due', path: '/dashboard/followups', icon: CalendarCheck },
    { label: 'Converted Clients', path: '/dashboard/converted-clients', icon: Briefcase },
    { label: 'Website Progress', path: '/dashboard/website-progress', icon: Globe },
    { label: 'My Earnings & Payments', path: '/dashboard/payments', icon: DollarSign },
    { label: 'My Salary & Payments', path: '/dashboard/my-salary', icon: DollarSign },
    { label: 'Meetings Schedule', path: '/dashboard/meetings', icon: Calendar },
    { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { label: 'Attendance', path: '/dashboard/attendance', icon: Clock },
    { label: 'Bonus & Incentives', path: '/dashboard/bonus', icon: Award },
    { label: 'Daily Work Reports', path: '/dashboard/reports', icon: FileText },
    { label: 'Notes & Resources', path: '/dashboard/resources', icon: BookOpen },
    { label: 'Account Settings', path: '/dashboard/settings', icon: Settings }
  ];

  const adminNavItems = [
    { label: 'Admin Overview', path: '/admin', icon: Shield },
    { label: 'Caller Accounts', path: '/admin/users', icon: UserCheck },
    { label: 'All Call Team Leads', path: '/admin/leads', icon: Layers },
    { label: 'New Leads Queue', path: '/admin/new-leads', icon: Sparkles },
    { label: 'Converted Clients', path: '/admin/converted-clients', icon: Briefcase },
    { label: 'Website Revenue', path: '/admin/revenue', icon: TrendingUp },
    { label: 'App Revenue', path: '/admin/app-revenue', icon: Smartphone },
    { label: 'Overall Revenue', path: '/admin/overall-revenue', icon: PieChart },
    { label: 'Website Progress', path: '/admin/website-progress', icon: Globe },
    { label: 'Payment Ledger', path: '/admin/payments', icon: DollarSign },
    { label: 'Meetings Schedule', path: '/admin/meetings', icon: Calendar },
    { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { label: 'Trash Bin History', path: '/admin/deleted-history', icon: Trash2 },
    { label: 'Caller Attendance', path: '/admin/attendance', icon: Clock },
    { label: 'Security Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck },
    { label: 'Lead Categories', path: '/admin/categories', icon: Layers },
    { label: 'City Management', path: '/admin/cities', icon: MapPin },
    { label: 'Notes & Resources', path: '/admin/resources', icon: BookOpen },
    { label: 'Salary Management', path: '/admin/salary-management', icon: DollarSign },
    { label: 'Bonus Slabs', path: '/admin/bonuses', icon: Trophy },
    { label: 'Call Team Reports', path: '/admin/reports', icon: FileText },
    { label: 'Import History', path: '/admin/import-history', icon: History },
    { label: 'Activity Audit Trail', path: '/admin/activity', icon: Activity }
  ];

  return (
    <>
      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 md:top-16 left-0 z-40 w-64 h-screen md:h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Admin Navigation Section */}
          {user.role === 'admin' && (
            <div>
              <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                <Shield className="w-3 h-3 text-indigo-500" />
                <span>Admin Management</span>
              </div>
              <nav className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path === '/admin/revenue' && location.pathname === '/admin/website-revenue');
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Main Caller Navigation */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Caller Workspace
            </div>
            <nav className="space-y-1">
              {callerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};
