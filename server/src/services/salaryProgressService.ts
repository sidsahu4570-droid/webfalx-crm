import { SalaryConfiguration } from '../models/SalaryConfiguration';
import { ConvertedClient } from '../models/ConvertedClient';
import { SalaryProgress } from '../models/SalaryProgress';
import { BonusProgress } from '../models/BonusProgress';
import { BonusSlab } from '../models/BonusSlab';
import { User } from '../models/User';
import mongoose from 'mongoose';

export const updateSalaryAndBonusProgress = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user || user.role !== 'caller') return;

    // Get current month boundaries
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Only Admin Approved converted clients count
    const approvedSales = await ConvertedClient.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      approvalStatus: 'Approved',
      conversionDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // 1. Get/Calculate Salary Progress
    const salaryConfig = await SalaryConfiguration.findOne({ userId: user._id });
    const monthlyTarget = salaryConfig ? salaryConfig.monthlySalesTarget : 0;
    const minEligible = salaryConfig ? salaryConfig.minimumEligibleSales : 0;
    const remainingSalarySales = Math.max(0, monthlyTarget - approvedSales);
    const isEligible = approvedSales >= minEligible;

    await SalaryProgress.findOneAndUpdate(
      { userId: user._id },
      {
        approvedSales,
        monthlyTarget,
        remainingSales: remainingSalarySales,
        isEligible
      },
      { upsert: true, new: true }
    );

    // 2. Get/Calculate Bonus Progress
    // Find active bonus slabs
    const slabs = await BonusSlab.find({ isActive: true }).sort({ targetSales: 1 });
    
    // Clear old bonus progress for this caller
    await BonusProgress.deleteMany({ userId: user._id });

    // Seed or update bonus progress entries for this caller
    let lastTotalTarget = monthlyTarget;
    for (const slab of slabs) {
      // Determine if configured targetSales is incremental or total
      let totalTarget = slab.targetSales;
      if (slab.targetSales <= monthlyTarget) {
        totalTarget = monthlyTarget + slab.targetSales;
      }
      totalTarget = Math.max(totalTarget, lastTotalTarget);

      const meetsSalaryTarget = approvedSales >= monthlyTarget;
      const remainingBonusSales = Math.max(0, totalTarget - approvedSales);
      const isUnlocked = meetsSalaryTarget && approvedSales >= totalTarget;

      await BonusProgress.create({
        userId: user._id,
        approvedSales,
        targetSales: totalTarget, // Store resolved total target sales
        remainingSales: remainingBonusSales,
        bonusAmount: slab.bonusAmount,
        isUnlocked
      });

      lastTotalTarget = totalTarget;
    }

    console.log(`[Salary/Bonus Progress] Updated metrics for caller: ${user.name} (Approved Sales: ${approvedSales})`);
  } catch (error) {
    console.error('[Salary/Bonus Progress Error] Failed to update:', error);
  }
};
