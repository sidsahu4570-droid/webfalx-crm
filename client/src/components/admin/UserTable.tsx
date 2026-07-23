import React, { useState } from 'react';
import { User } from '../../types';
import { formatDate } from '../../utils/formatters';
import { UserCheck, Shield, KeyRound, Trash2, Edit, Calendar, CheckCircle2, XCircle, Check, X, CalendarClock } from 'lucide-react';

interface UserTableProps {
  users: User[];
  onEditUser: (user: User) => void;
  onToggleActive: (user: User) => void;
  onResetPassword: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onApproveJoiningDate?: (user: User, status: 'Approved' | 'Rejected', date?: string) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  onEditUser,
  onToggleActive,
  onResetPassword,
  onDeleteUser,
  onApproveJoiningDate
}) => {
  const [editingDateUserId, setEditingDateUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');

  const handleAdminSetDate = (user: User, status: 'Approved' | 'Rejected') => {
    if (onApproveJoiningDate) {
      onApproveJoiningDate(user, status, selectedDate || user.joiningDate);
      setEditingDateUserId(null);
      setSelectedDate('');
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left border-collapse min-w-[850px]">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <th className="py-3.5 px-4">Caller Profile</th>
            <th className="py-3.5 px-4">Role</th>
            <th className="py-3.5 px-4">Account Status</th>
            <th className="py-3.5 px-4">Joining Date & Approval</th>
            <th className="py-3.5 px-4">Leads Assigned</th>
            <th className="py-3.5 px-4">Due Follow-ups</th>
            <th className="py-3.5 px-4 text-right">Admin Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
              <td className="py-4 px-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm border border-indigo-200 dark:border-indigo-800">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </div>
                </div>
              </td>

              <td className="py-4 px-4">
                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    u.role === 'admin'
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                      : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                  }`}
                >
                  {u.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <UserCheck className="w-3 h-3 mr-1" />}
                  <span className="capitalize">{u.role}</span>
                </span>
              </td>

              <td className="py-4 px-4">
                <button
                  type="button"
                  onClick={() => onToggleActive(u)}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                    u.isActive
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/25'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {u.isActive ? 'Active' : 'Disabled'}
                </button>
              </td>

              {/* 📅 Joining Date & Approval Column */}
              <td className="py-4 px-4 font-sans">
                {editingDateUserId === u.id ? (
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-indigo-400 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <button
                      onClick={() => handleAdminSetDate(u, 'Approved')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded-md"
                      title="Save & Approve Date"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingDateUserId(null)}
                      className="bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 p-1 rounded-md"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900 dark:text-white block text-xs">
                        {u.joiningDate ? formatDate(u.joiningDate) : 'Not Submitted'}
                      </span>
                      {onApproveJoiningDate && (
                        <button
                          onClick={() => {
                            setEditingDateUserId(u.id);
                            setSelectedDate(u.joiningDate ? new Date(u.joiningDate).toISOString().split('T')[0] : '');
                          }}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {u.joiningDate ? 'Edit' : '+ Set Date'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          u.joiningDateStatus === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : u.joiningDateStatus === 'Rejected'
                            ? 'bg-rose-500/10 text-rose-600'
                            : 'bg-amber-500/10 text-amber-600 font-bold'
                        }`}
                      >
                        {u.joiningDateStatus || 'Pending Approval'}
                      </span>

                      {onApproveJoiningDate && u.joiningDate && u.joiningDateStatus !== 'Approved' && (
                        <button
                          onClick={() => onApproveJoiningDate(u, 'Approved')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm"
                          title="Approve Joining Date"
                        >
                          Approve
                        </button>
                      )}

                      {onApproveJoiningDate && u.joiningDate && u.joiningDateStatus !== 'Rejected' && (
                        <button
                          onClick={() => onApproveJoiningDate(u, 'Rejected')}
                          className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm"
                          title="Reject Joining Date"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </td>

              <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                {u.leadCount || 0} Leads
              </td>

              <td className="py-4 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                {u.dueFollowUps || 0} Due
              </td>

              <td className="py-4 px-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <button
                    onClick={() => onEditUser(u)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-all"
                    title="Edit Profile"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onResetPassword(u)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-all"
                    title="Reset Password"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>

                  {u.role !== 'admin' && (
                    <button
                      onClick={() => onDeleteUser(u)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
