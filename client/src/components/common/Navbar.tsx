import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
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
  const navigate = useNavigate();
  const { user, accounts, switchAccount, logoutCurrent, logoutAll } = useAuth();
  const { toast } = useToast();
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
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl z-50 py-2 font-sans text-slate-100">
                {/* Header: Current Account */}
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Current Account</p>
                  <p className="text-xs font-bold text-white truncate mt-1">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>

                {/* Switch Account List */}
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">Switch Account</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {accounts.map((acc) => {
                      const isActive = acc.email === user.email;
                      return (
                        <button
                          key={acc.email}
                          onClick={() => {
                            if (!isActive) {
                              switchAccount(acc.email);
                              setDropdownOpen(false);
                              toast('Account Switched', `Logged in as ${acc.name}`, 'success');
                              if (acc.role === 'admin') {
                                navigate('/admin');
                              } else {
                                navigate('/dashboard');
                              }
                            }
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                            isActive
                              ? 'bg-indigo-600/20 border border-indigo-500/30 text-white cursor-default'
                              : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-[10px] text-white">
                              {acc.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold leading-tight">{acc.name}</p>
                              <p className="text-[9px] text-slate-400 leading-tight">{acc.email}</p>
                            </div>
                          </div>
                          {isActive && (
                            <span className="text-emerald-500 font-bold text-xs">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Another Account */}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/login');
                    }}
                    className="w-full mt-3 p-2 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Account</span>
                  </button>
                </div>

                {/* Logouts */}
                <div className="px-2 pt-2">
                  <button
                    onClick={() => {
                      logoutCurrent();
                      setDropdownOpen(false);
                      const remaining = accounts.filter((acc) => acc.email !== user.email);
                      if (remaining.length === 0) {
                        navigate('/login');
                      } else {
                        const next = remaining[0];
                        if (next.role === 'admin') {
                          navigate('/admin');
                        } else {
                          navigate('/dashboard');
                        }
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center space-x-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out Current Account</span>
                  </button>
                  <button
                    onClick={() => {
                      logoutAll();
                      setDropdownOpen(false);
                      navigate('/login');
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-600/15 rounded-xl flex items-center space-x-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out All Accounts</span>
                  </button>
                </div>
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
