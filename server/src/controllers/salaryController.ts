import { Request, Response } from 'express';
import { User } from '../models/User';
import { SalaryConfiguration } from '../models/SalaryConfiguration';
import { SalaryProgress } from '../models/SalaryProgress';
import { BonusProgress } from '../models/BonusProgress';
import { updateSalaryAndBonusProgress } from '../services/salaryProgressService';
import { logActivity } from '../services/activityService';
import { emitToUser, emitToAdmin } from '../socket/socketHandler';

// Admin: Configure Salary Settings for a Caller
export const configureSalary = async (req: Request, res: Response) => {
  try {
    const { userId, monthlySalary, monthlySalesTarget, minimumEligibleSales } = req.body;
    const adminUser = req.user!;

    const caller = await User.findById(userId);
    if (!caller || caller.role !== 'caller') {
      return res.status(404).json({ success: false, message: 'Caller not found' });
    }

    const config = await SalaryConfiguration.findOneAndUpdate(
      { userId },
      {
        monthlySalary: Number(monthlySalary),
        monthlySalesTarget: Number(monthlySalesTarget),
        minimumEligibleSales: Number(minimumEligibleSales)
      },
      { upsert: true, new: true }
    );

    // Recalculate progress metrics
    await updateSalaryAndBonusProgress(userId);

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'CONFIGURE_SALARY',
      details: `Configured salary for ${caller.name}: Target ${monthlySalesTarget}, Min Sales ${minimumEligibleSales}`
    });

    emitToUser(userId, 'salary_progress_updated', { userId });
    emitToAdmin('salary_progress_updated', { userId });

    res.json({ success: true, message: 'Salary configuration updated successfully', config });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Admin: Get all salary configurations
export const getSalaryConfigurations = async (req: Request, res: Response) => {
  try {
    const configs = await SalaryConfiguration.find().populate('userId', 'name email role');
    res.json({ success: true, configs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Get Salary & Bonus Progress metrics for dashboard
export const getSalaryProgress = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const userId = req.query.callerId ? String(req.query.callerId) : user.id;

    // Recalculate progress metrics to keep absolutely live
    await updateSalaryAndBonusProgress(userId);

    const salaryProg = await SalaryProgress.findOne({ userId });
    const bonusProg = await BonusProgress.find({ userId }).sort({ targetSales: 1 });
    const salaryConfig = await SalaryConfiguration.findOne({ userId });
    const dbUser = await User.findById(userId).select('name email');

    res.json({
      success: true,
      user: dbUser,
      salaryProgress: salaryProg || { approvedSales: 0, monthlyTarget: 0, remainingSales: 0, isEligible: false },
      bonusProgress: bonusProg || [],
      salaryConfiguration: salaryConfig || null
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
