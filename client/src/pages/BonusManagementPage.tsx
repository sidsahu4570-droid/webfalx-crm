import React, { useState, useEffect } from 'react';
import { bonusService } from '../services/bonusService';
import { BonusSlabRecord } from '../types';
import { LoadingSpinner } from '../components/common/SkeletonLoader';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { Trophy, Plus, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

export const BonusManagementPage: React.FC = () => {
  const { toast } = useToast();
  const [slabs, setSlabs] = useState<BonusSlabRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [targetSales, setTargetSales] = useState<number | ''>('');
  const [bonusAmount, setBonusAmount] = useState<number | ''>('');

  const fetchSlabs = async () => {
    setLoading(true);
    try {
      const res = await bonusService.getBonusSlabs();
      if (res.success) setSlabs(res.slabs);
    } catch (err: any) {
      toast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlabs();
  }, []);

  const handleCreateSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetSales || !bonusAmount) return;
    try {
      const res = await bonusService.createBonusSlab({
        title,
        targetSales: Number(targetSales),
        bonusAmount: Number(bonusAmount)
      });
      if (res.success) {
        toast('Bonus Slab Created', `Configured '${title}' for ${targetSales} Approved Sales`, 'success');
        setModalOpen(false);
        setTitle('');
        setTargetSales('');
        setBonusAmount('');
        fetchSlabs();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      const res = await bonusService.toggleBonusSlab(id, !currentActive);
      if (res.success) {
        toast('Slab Updated', `Slab ${!currentActive ? 'Activated' : 'Deactivated'}`, 'info');
        fetchSlabs();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this bonus slab?')) return;
    try {
      const res = await bonusService.deleteBonusSlab(id);
      if (res.success) {
        toast('Deleted', 'Bonus slab removed', 'info');
        fetchSlabs();
      }
    } catch (err: any) {
      toast('Error', err.message, 'error');
    }
  };

  const formatINR = (val: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30">
            Incentive Management • Dynamic Bonus Slabs
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 flex items-center">
            <Trophy className="w-7 h-7 mr-2 text-amber-400" />
            Caller Bonus & Sales Incentive Plans
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Configure target thresholds for Approved Converted Clients (`approvalStatus == Approved`) and assign cash bonus rewards.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold px-4 py-2.5 rounded-2xl shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bonus Slab</span>
        </button>
      </div>

      {/* Slabs Grid */}
      {loading ? (
        <LoadingSpinner text="Fetching bonus slabs..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {slabs.map((s) => (
            <div
              key={s._id}
              className={`p-6 rounded-3xl border shadow-sm space-y-4 font-mono transition-all ${
                s.isActive
                  ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider font-sans">
                  {s.title}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                    s.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-sans block">Required Approved Deals</span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans block">
                  {s.targetSales} Approved Sales
                </span>
              </div>

              <div className="space-y-1 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-sans font-bold uppercase block">
                  Cash Bonus Reward
                </span>
                <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 block">
                  {formatINR(s.bonusAmount)}
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-sans">
                <button
                  onClick={() => handleToggle(s._id, s.isActive)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-3 py-1.5 rounded-xl hover:bg-slate-200"
                >
                  {s.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(s._id)}
                  className="bg-rose-50 text-rose-600 font-bold px-3 py-1.5 rounded-xl hover:bg-rose-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Sales Bonus Slab"
        subtitle="Deals count towards target ONLY when converted and approved by Admin"
      >
        <form onSubmit={handleCreateSlab} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Slab Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 10 Approved Sales Reward"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Approved Sales *
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetSales}
                onChange={(e) => setTargetSales(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 10"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-extrabold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cash Bonus Reward (₹) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 2000"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-amber-600 dark:text-amber-400 font-extrabold"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl shadow-md"
            >
              Save Bonus Slab
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
