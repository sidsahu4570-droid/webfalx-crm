import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { GlobalSmartSearch } from './GlobalSmartSearch';
import { Lead } from '../../types';
import {
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Shield,
  PhoneCall,
  Wifi,
  WifiOff,
  Plus,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { LeadDetailModal } from '../leads/LeadDetailModal';

interface NavbarProps {
  onOpenAddModal?: () => void;
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  toggleSidebar,
  isSidebarOpen
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isConnected } = useSocket();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchSelectedLead, setSearchSelectedLead] = useState<Lead | null>(null);

  if (!user) return null;

  return (
    <>
      <header className="sticky top-0 z-30 w-full h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between transition-colors">
        {/* Left: Mobile Toggle & Brand title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Navigation Sidebar"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                Prospect<span className="text-indigo-600 dark:text-indigo-400">CRM</span>
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                {user.role === 'admin' ? 'Admin Portal' : 'Caller Workspace'}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Smart Search */}
        <div className="hidden md:flex flex-1 items-center justify-center px-6">
          <GlobalSmartSearch onSelectLead={(lead) => setSearchSelectedLead(lead)} />
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          {/* Socket status dot */}
          <div
            className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            title={isConnected ? 'Live Socket Connected' : 'Socket Reconnecting'}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-500" />
                <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400 font-bold">LIVE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-500" />
                <span className="hidden sm:inline text-amber-600 font-bold">OFFLINE</span>
              </>
            )}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Light / Dark Mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline font-bold text-xs text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                {user.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 py-1 font-sans">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>

                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center space-x-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Detail Drawer for Smart Search */}
      {searchSelectedLead && (
        <LeadDetailModal
          isOpen={!!searchSelectedLead}
          onClose={() => setSearchSelectedLead(null)}
          lead={searchSelectedLead}
          onAddNote={async () => {}}
          onUpdateStatus={async () => {}}
          onCompleteFollowUp={async () => {}}
        />
      )}
    </>
  );
};
