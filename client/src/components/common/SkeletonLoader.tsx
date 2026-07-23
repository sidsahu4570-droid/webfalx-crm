import React from 'react';

export const LoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Loading data...' }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    {text && <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">{text}</p>}
  </div>
);

export const SkeletonRow: React.FC = () => (
  <div className="animate-pulse flex items-center space-x-4 p-4 border-b border-slate-100 dark:border-slate-800">
    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
    </div>
    <div className="w-20 h-6 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
    <div className="w-16 h-6 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="animate-pulse bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-16"></div>
    </div>
    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
    </div>
  </div>
);
