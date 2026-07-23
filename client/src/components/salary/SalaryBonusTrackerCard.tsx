import React from 'react';
import { SalaryProgress, SalaryBonusProgress, SalaryConfiguration } from '../../types';
import { Award, CheckCircle, Lock, Target, TrendingUp } from 'lucide-react';

interface SalaryBonusTrackerCardProps {
  salaryProgress: SalaryProgress | null;
  bonusProgress: SalaryBonusProgress[];
  salaryConfig: SalaryConfiguration | null;
}

export const SalaryBonusTrackerCard: React.FC<SalaryBonusTrackerCardProps> = ({
  salaryProgress,
  bonusProgress,
  salaryConfig
}) => {
  if (!salaryProgress) return null;

  const approvedSales = salaryProgress.approvedSales || 0;
  const targetSales = salaryProgress.monthlyTarget || 0;
  const minEligible = salaryConfig?.minimumEligibleSales || 0;
  const isEligible = salaryProgress.isEligible;
  const remainingSales = salaryProgress.remainingSales;

  // Percentage calculations
  const salaryPercent = targetSales > 0 ? Math.min(100, (approvedSales / targetSales) * 100) : 0;
  const meetsSalaryTarget = approvedSales >= targetSales;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Salary Progress Tracker */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Salary Target Progress
            </h3>
          </div>
          {isEligible ? (
            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900 px-2 py-0.5 rounded-full text-[10px] font-bold">
              ✓ Eligible for Salary
            </span>
          ) : (
            <span className="bg-rose-50 text-rose-700 dark:bg-rose-955 dark:text-rose-400 border border-rose-250 dark:border-rose-900 px-2 py-0.5 rounded-full text-[10px] font-bold">
              ✕ Target Not Reached
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-500">Approved Sales: {approvedSales} / {targetSales}</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{Math.round(salaryPercent)}%</span>
          </div>

          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                meetsSalaryTarget ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${salaryPercent}%` }}
            />
            {/* Minimum Eligible Sales Threshold Indicator Marker */}
            {minEligible > 0 && minEligible < targetSales && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 cursor-help"
                style={{ left: `${(minEligible / targetSales) * 100}%` }}
                title={`Minimum Eligibility Threshold: ${minEligible} Sales`}
              />
            )}
          </div>

          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Min Eligible: {minEligible} Sales</span>
            {remainingSales > 0 ? (
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                Only {remainingSales} Approved Sales Remaining
              </span>
            ) : (
              <span className="font-bold text-emerald-600">Monthly Target Completed!</span>
            )}
          </div>
        </div>
      </div>

      {/* Bonus Progress Tracker */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-855 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Bonus Slab Progress
            </h3>
          </div>
          <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-250 dark:border-indigo-900 px-2 py-0.5 rounded-full text-[10px] font-bold">
            Bonus Slabs
          </span>
        </div>

        {!meetsSalaryTarget ? (
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-xs text-slate-500 flex items-start space-x-2.5">
            <Lock className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold block text-slate-700 dark:text-slate-300">Bonus Tracking Locked</span>
              <span>Salary Target ({targetSales} Approved Sales) must be achieved first to begin tracking and unlocking bonus incentives.</span>
            </div>
          </div>
        ) : bonusProgress.length === 0 ? (
          <div className="text-xs text-slate-400 py-4 text-center">No active bonus slabs configured.</div>
        ) : (
          <div className="space-y-3 max-h-[140px] overflow-y-auto pr-1">
            {(() => {
              let lastTarget = targetSales; // Starts from Salary Target (T_0)
              return bonusProgress.map((slab, index) => {
                let totalTarget = slab.targetSales;
                if (slab.targetSales <= targetSales) {
                  totalTarget = targetSales + slab.targetSales;
                }
                totalTarget = Math.max(totalTarget, lastTarget);

                const meetsSalaryTarget = approvedSales >= targetSales;
                const slabWidth = Math.max(0, totalTarget - lastTarget);
                
                let progressInSlab = 0;
                if (meetsSalaryTarget) {
                  if (approvedSales >= totalTarget) {
                    progressInSlab = slabWidth;
                  } else if (approvedSales > lastTarget) {
                    progressInSlab = approvedSales - lastTarget;
                  }
                }
                
                const slabPercent = slabWidth > 0 ? Math.min(100, (progressInSlab / slabWidth) * 100) : 0;
                const isUnlocked = meetsSalaryTarget && approvedSales >= totalTarget;
                const remainingInSlab = Math.max(0, totalTarget - approvedSales);
                             lastTarget = totalTarget;

                return (
                  <div key={index} className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-205 dark:border-slate-700/70">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 block">
                          Slab Target: {totalTarget} Sales
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 block font-medium">
                          {progressInSlab} of {slabWidth} Bonus Sales Completed
                        </span>
                      </div>
                      <div className="text-right">
                        {isUnlocked ? (
                          <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900 px-2.5 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                            ✓ Unlocked!
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">
                            Reward: <strong className="text-indigo-650 dark:text-indigo-300 font-extrabold">₹{slab.bonusAmount.toLocaleString()}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden relative border border-slate-200/50 dark:border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isUnlocked ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${slabPercent}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-600 dark:text-slate-300 font-bold">
                      <span>Progress: {Math.round(slabPercent)}%</span>
                      {!isUnlocked && (
                        <span className="text-indigo-600 dark:text-indigo-350">
                          {remainingInSlab} Sales remaining to unlock reward
                        </span>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
