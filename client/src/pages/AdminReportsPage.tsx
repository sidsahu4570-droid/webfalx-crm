import React, { useState, useEffect } from 'react';
import { SeparatedReportDashboard } from '../components/reports/SeparatedReportDashboard';
import { userService } from '../services/userService';
import { User } from '../types';
import { Users } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [callers, setCallers] = useState<User[]>([]);
  const [selectedCallerId, setSelectedCallerId] = useState<string>('');

  useEffect(() => {
    userService.getUsers().then((res) => {
      if (res.success) {
        setCallers(res.users.filter((u) => u.role === 'caller'));
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Team Work Reports & Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Admin oversight with strict separation between New Lead reports and Existing Lead (My Prospects) reports
          </p>
        </div>

        {/* Filter by Caller */}
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Users className="w-4 h-4 text-indigo-500 ml-1" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter Caller:</span>
          <select
            value={selectedCallerId}
            onChange={(e) => setSelectedCallerId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Callers</option>
            {callers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 📌 Separated Report Dashboard for Admin */}
      <SeparatedReportDashboard isAdmin={true} callerIdFilter={selectedCallerId || undefined} />
    </div>
  );
};
