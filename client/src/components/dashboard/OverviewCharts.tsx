import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { DashboardStats } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { getStatusColorHex } from '../../utils/formatters';

interface OverviewChartsProps {
  stats: DashboardStats;
}

export const OverviewCharts: React.FC<OverviewChartsProps> = ({ stats }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const statusPieData = Object.entries(stats.statusCounts || {}).map(([name, value]) => ({
    name,
    value,
    color: getStatusColorHex(name as any)
  }));

  const priorityBarData = Object.entries(stats.priorityCounts || {}).map(([name, count]) => ({
    priority: `${name} Priority`,
    count
  }));

  const callerPerformanceData = stats.callersPerformance || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Lead Status Distribution Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Lead Status Distribution
        </h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {statusPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  borderRadius: '12px',
                  color: isDark ? '#ffffff' : '#0f172a'
                }}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Level Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Prospect Priority Breakdown
        </h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} />
              <XAxis dataKey="priority" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  borderRadius: '12px'
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Callers Performance Leaderboard (Admin Only) */}
      {callerPerformanceData.length > 0 && (
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Caller Performance Leaderboard (Total Assigned Leads vs. Completed Follow-ups)
          </h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={callerPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="name" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px'
                  }}
                />
                <Legend />
                <Bar dataKey="totalLeads" name="Total Assigned Leads" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="completedFollowUps" name="Completed Follow-ups" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="dueFollowUps" name="Follow-ups Due" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
