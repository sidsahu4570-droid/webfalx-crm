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

  const adminCategories = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      items: [
        { label: 'Admin Overview', path: '/admin', icon: Shield }
      ]
    },
    {
      id: 'lead_management',
      title: 'Lead Management',
      icon: Users,
      items: [
        { label: 'Caller Accounts', path: '/admin/users', icon: UserCheck },
        { label: 'All Call Team Leads', path: '/admin/leads', icon: Layers },
        { label: 'New Leads Queue', path: '/admin/new-leads', icon: Sparkles },
        { label: 'Converted Clients', path: '/admin/converted-clients', icon: Briefcase },
        { label: 'Lead Categories', path: '/admin/categories', icon: Layers },
        { label: 'City Management', path: '/admin/cities', icon: MapPin },
        { label: 'Import History', path: '/admin/import-history', icon: History }
      ]
    },
    {
      id: 'revenue_finance',
      title: 'Revenue & Finance',
      icon: DollarSign,
      items: [
        { label: 'Website Revenue', path: '/admin/revenue', icon: TrendingUp },
        { label: 'App Revenue', path: '/admin/app-revenue', icon: Smartphone },
        { label: 'Overall Revenue', path: '/admin/overall-revenue', icon: PieChart },
        { label: 'Payment Ledger', path: '/admin/payments', icon: DollarSign }
      ]
    },
    {
      id: 'project_management',
      title: 'Project Management',
      icon: Briefcase,
      items: [
        { label: 'Website Progress', path: '/admin/website-progress', icon: Globe },
        { label: 'Meetings Schedule', path: '/admin/meetings', icon: Calendar }
      ]
    },
    {
      id: 'hr_payroll',
      title: 'HR & Payroll',
      icon: UserCheck,
      items: [
        { label: 'Caller Attendance', path: '/admin/attendance', icon: Clock },
        { label: 'Salary Management', path: '/admin/salary-management', icon: DollarSign },
        { label: 'Bonus Slabs', path: '/admin/bonuses', icon: Trophy },
        { label: 'Leaderboard', path: '/leaderboard', icon: Trophy }
      ]
    },
    {
      id: 'resources',
      title: 'Resources',
      icon: BookOpen,
      items: [
        { label: 'Notes & Resources', path: '/admin/resources', icon: BookOpen }
      ]
    },
    {
      id: 'reports_analytics',
      title: 'Reports & Analytics',
      icon: FileText,
      items: [
        { label: 'Call Team Reports', path: '/admin/reports', icon: FileText }
      ]
    },
    {
      id: 'security_audit',
      title: 'Security & Audit',
      icon: ShieldCheck,
      items: [
        { label: 'Security Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck },
        { label: 'Activity Audit Trail', path: '/admin/activity', icon: Activity },
        { label: 'Trash Bin History', path: '/admin/deleted-history', icon: Trash2 }
      ]
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      items: [
        { label: 'Account Settings', path: '/dashboard/settings', icon: Settings }
      ]
    }
  ];

  if (!user) return null;

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
            <div className="space-y-4">
              <div className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                <Shield className="w-3 h-3 text-indigo-500" />
                <span>Admin Management</span>
              </div>
              <div className="space-y-4">
                {adminCategories.map((category) => {
                  const CategoryIcon = category.icon;
                  const hasActiveChild = category.items.some(item =>
                    location.pathname === item.path ||
                    (item.path === '/admin/revenue' && location.pathname === '/admin/website-revenue')
                  );

                  return (
                    <div key={category.id} className="space-y-1">
                      {/* Static Category Header */}
                      <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest flex items-center space-x-2">
                        <CategoryIcon className={`w-3.5 h-3.5 ${hasActiveChild ? 'text-indigo-500' : 'text-slate-400'}`} />
                        <span className={hasActiveChild ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}>
                          {category.title}
                        </span>
                      </div>

                      {/* Category Items (Indented & Bordered Group) */}
                      <div className="ml-4 pl-2.5 border-l border-slate-200/50 dark:border-slate-800/30 space-y-0.5 mt-1 mb-2">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          const isActive =
                            location.pathname === item.path ||
                            (item.path === '/admin/revenue' && location.pathname === '/admin/website-revenue');
                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              onClick={onClose}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                                isActive
                                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                <span>{item.label}</span>
                              </div>
                              {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
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
