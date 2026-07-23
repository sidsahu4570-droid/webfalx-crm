import React from 'react';
import { SeparatedReportDashboard } from '../components/reports/SeparatedReportDashboard';

export const CallerReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Daily Work Reports
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Automated performance breakdown split between New Lead activities and My Prospects
        </p>
      </div>

      {/* 📌 Separated Report Dashboard for Caller */}
      <SeparatedReportDashboard isAdmin={false} />
    </div>
  );
};
