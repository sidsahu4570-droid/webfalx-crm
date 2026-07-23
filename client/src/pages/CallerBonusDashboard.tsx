import React, { useState, useEffect } from 'react';
import { bonusService } from '../services/bonusService';
import { BonusProgress, BonusSlabRecord } from '../types';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Trophy, Award, Sparkles, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';

export const CallerBonusDashboard: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [progress, setProgress] = useState<BonusProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      const res = await bonusService.getCallerBonusProgress();
      if (res.success) {
        setProgress(res);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => fetchProgress();

    socket.on('bonus_updated', handleRefresh);
    socket.on('client_created', handleRefresh);
    socket.on('client_updated', handleRefresh);
    socket.on('converted_client_updated', handleRefresh);

    return () => {
      socket.off('bonus_updated', handleRefresh);
      socket.off('client_created', handleRefresh);
      socket.off('client_updated', handleRefresh);
      socket.off('converted_client_updated', handleRefresh);
    };
  }, [socket]);

  const formatINR = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return <LoadingSpinner text="Loading Bonus & Incentive Dashboard..." />;
  }

  const approvedSales = progress?.approvedSalesCount || 0;
  const currentSlab = progress?.currentSlab;
  const nextSlab = progress?.nextSlab;
  const salaryTarget = (progress as any)?.salaryTarget || 0;
  const baseSales = (progress as any)?.baseSales || salaryTarget;

  const targetSales = nextSlab ? nextSlab.targetSales : currentSlab ? currentSlab.targetSales : 10;
  const remainingSales = nextSlab ? Math.max(0, nextSlab.targetSales - approvedSales) : 0;

  // Calculate progress percentage relative to targetSales and baseSales
  const meetsSalaryTarget = approvedSales >= salaryTarget;
  let progressPercentage = 0;
  if (meetsSalaryTarget && nextSlab) {
    const slabWidth = nextSlab.targetSales - baseSales;
    const progressInSlab = approvedSales - baseSales;
    progressPercentage = slabWidth > 0 ? Math.min(100, Math.round((progressInSlab / slabWidth) * 100)) : 0;
  } else if (meetsSalaryTarget && !nextSlab && currentSlab) {
    progressPercentage = 100;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-purple-700 to-indigo-900 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-400/20 text-amber-200 px-3 py-1 rounded-full border border-amber-400/30">
            Caller Incentive Dashboard
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 flex items-center">
            <Trophy className="w-8 h-8 mr-2 text-amber-300 animate-bounce" />
            My Sales Bonus & Rewards
          </h2>
          <p className="text-amber-100 text-xs md:text-sm mt-1 max-w-xl">
            Only Approved Converted Clients (`approvalStatus == Approved`) count towards cash bonus slab unlocks!
          </p>
        </div>
      </div>

      {/* Dynamic Bonus Progress Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-indigo-500/15 border border-amber-400/40 dark:border-amber-500/30 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-bold flex items-center justify-center text-xl shadow-lg">
              🏆
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-md border border-amber-400/30">
                Live Target Status
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                {progress?.bannerText}
              </h3>
            </div>
          </div>

          <span className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
            {approvedSales} / {targetSales} Sales
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Overall Bonus Progress ({progressPercentage}%)</span>
            <span>{remainingSales > 0 ? `${remainingSales} Approved Sales Left` : 'Target Unlocked! 🎉'}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-amber-500 via-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-500 shadow-md"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bonus KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Approved Sales Count
          </span>
          <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-2 block">
            {approvedSales}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            Admin Approved Conversions
          </span>
        </div>

        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            Achieved Bonus Cash
          </span>
          <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-2 block">
            {formatINR(currentSlab ? currentSlab.bonusAmount : 0)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block font-mono">
            {currentSlab ? `Unlocked: ${currentSlab.title}` : 'No bonus achieved yet'}
          </span>
        </div>

        <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
            Upcoming Bonus Reward
          </span>
          <span className="text-3xl font-extrabold font-mono text-purple-600 dark:text-purple-400 mt-2 block">
            {formatINR(nextSlab ? nextSlab.bonusAmount : 0)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block font-mono">
            {nextSlab ? `Target: ${nextSlab.targetSales} Sales` : 'Top slab reached!'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
            Remaining Sales Needed
          </span>
          <span className="text-3xl font-extrabold font-mono text-amber-600 mt-2 block">
            {remainingSales}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block font-mono">
            Until next cash payout
          </span>
        </div>
      </div>

      {/* Available Bonus Slabs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
          <Award className="w-4 h-4 mr-2 text-indigo-500" />
          Configured Sales Bonus Slabs History & Targets
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Bonus Slab Title</th>
                <th className="py-3 px-4">Target Sales Required</th>
                <th className="py-3 px-4">Bonus Reward (₹)</th>
                <th className="py-3 px-4">My Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
              {progress?.allSlabs && progress.allSlabs.length > 0 ? (
                progress.allSlabs.map((slab) => {
                  const isAchieved = approvedSales >= slab.targetSales;
                  return (
                    <tr
                      key={slab._id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 ${
                        isAchieved ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <td className="py-4 px-4 font-sans font-bold text-slate-900 dark:text-white">
                        {slab.title}
                      </td>
                      <td className="py-4 px-4 font-sans font-bold text-slate-700 dark:text-slate-300">
                        {slab.targetSales} Approved Deals
                      </td>
                      <td className="py-4 px-4 text-emerald-600 font-extrabold text-sm">
                        {formatINR(slab.bonusAmount)}
                      </td>
                      <td className="py-4 px-4 font-sans">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                            isAchieved
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}
                        >
                          {isAchieved ? '🎉 ACHIEVED & UNLOCKED' : `In Progress (${slab.targetSales - approvedSales} Sales Left)`}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-xs text-slate-400 italic font-sans">
                    No bonus slabs configured yet by Admin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
