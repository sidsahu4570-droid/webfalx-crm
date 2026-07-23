import React, { useState, useEffect } from 'react';
import { leaderboardService } from '../services/leaderboardService';
import { LeaderboardItem } from '../types';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { Trophy, Award, Crown, TrendingUp, PhoneCall, Calendar, CheckCircle2 } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all_time'>('monthly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [topCallerOfWeek, setTopCallerOfWeek] = useState('N/A');
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await leaderboardService.getLeaderboard(timeframe);
      if (res.success) {
        setLeaderboard(res.leaderboard);
        setTopCallerOfWeek(res.topCallerOfWeek);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const formatINR = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-purple-700 to-indigo-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-400/20 text-amber-200 px-3 py-1 rounded-full border border-amber-400/30">
            Performance Rankings • Approved Sales Only
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 flex items-center">
            <Trophy className="w-8 h-8 mr-2 text-amber-300" />
            Caller Leaderboard
          </h2>
          <p className="text-amber-100 text-xs md:text-sm mt-1 max-w-xl">
            Real-time sales leaderboard based strictly on Approved Converted Clients, revenue generated, and caller activity.
          </p>
        </div>

        {/* Timeframe selector tabs */}
        <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/10 text-xs font-bold shrink-0">
          {(['weekly', 'monthly', 'quarterly', 'yearly', 'all_time'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
                timeframe === tf ? 'bg-amber-500 text-white shadow-md' : 'text-amber-200 hover:text-white'
              }`}
            >
              {tf.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Highlights: Top Caller Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 border border-amber-300 dark:border-amber-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase text-amber-600 dark:text-amber-400 tracking-wider block">
              🥇 Top Caller of the Week
            </span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {topCallerOfWeek}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Highest Approved Deals & Activity</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow-lg">
            👑
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 via-white to-white dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900 border border-purple-300 dark:border-purple-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase text-purple-600 dark:text-purple-400 tracking-wider block">
              🏆 Top Caller of Month
            </span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {leaderboard.length > 0 ? leaderboard[0].callerName : 'N/A'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Rank #1 Leaderboard Champion</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-2xl shadow-lg">
            🥇
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <LoadingSpinner text="Calculating caller rankings..." />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Caller Name</th>
                  <th className="py-3 px-4">Approved Sales</th>
                  <th className="py-3 px-4">Conversion Rate</th>
                  <th className="py-3 px-4">Revenue Brought (₹)</th>
                  <th className="py-3 px-4">Cash Collected (₹)</th>
                  <th className="py-3 px-4">Calls Made</th>
                  <th className="py-3 px-4">Meetings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
                {leaderboard.map((item) => (
                  <tr
                    key={item.callerId}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 ${
                      item.rank === 1 ? 'bg-amber-500/5' : item.rank === 2 ? 'bg-slate-500/5' : ''
                    }`}
                  >
                    <td className="py-4 px-4 font-sans font-extrabold text-base">
                      {item.rank === 1 ? (
                        <span className="text-amber-500 flex items-center">🥇 #1</span>
                      ) : item.rank === 2 ? (
                        <span className="text-slate-400 flex items-center">🥈 #2</span>
                      ) : item.rank === 3 ? (
                        <span className="text-amber-700 flex items-center">🥉 #3</span>
                      ) : (
                        `#${item.rank}`
                      )}
                    </td>
                    <td className="py-4 px-4 font-sans font-bold text-slate-900 dark:text-white">
                      {item.callerName}
                      <span className="text-[10px] text-slate-400 block font-normal">{item.callerEmail}</span>
                    </td>
                    <td className="py-4 px-4 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm font-sans">
                      {item.approvedSales} Sales
                    </td>
                    <td className="py-4 px-4 font-sans font-bold text-emerald-600">
                      {item.conversionRate}%
                    </td>
                    <td className="py-4 px-4 font-extrabold text-slate-900 dark:text-white">
                      {formatINR(item.revenueGenerated)}
                    </td>
                    <td className="py-4 px-4 text-emerald-600 font-extrabold">
                      {formatINR(item.paymentsCollected)}
                    </td>
                    <td className="py-4 px-4 font-sans text-slate-600 dark:text-slate-300">
                      {item.totalCalls}
                    </td>
                    <td className="py-4 px-4 font-sans text-slate-600 dark:text-slate-300">
                      {item.meetingsBooked}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
