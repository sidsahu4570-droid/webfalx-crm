import { Request, Response } from 'express';
import { BonusSlab } from '../models/BonusSlab';
import { ConvertedClient } from '../models/ConvertedClient';
import { SalaryConfiguration } from '../models/SalaryConfiguration';
import { logActivity } from '../services/activityService';
import { emitToAdmin, emitToUser } from '../socket/socketHandler';

export const getBonusSlabs = async (req: Request, res: Response) => {
  try {
    const slabs = await BonusSlab.find().sort({ targetSales: 1 });
    res.json({ success: true, slabs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBonusSlab = async (req: Request, res: Response) => {
  try {
    const adminUser = req.user!;
    const { title, targetSales, bonusAmount, applicableCallers } = req.body;

    if (!title || !targetSales || !bonusAmount) {
      return res.status(400).json({ success: false, message: 'Title, target sales, and bonus amount required' });
    }

    const slab = await BonusSlab.create({
      title,
      targetSales: Number(targetSales),
      bonusAmount: Number(bonusAmount),
      applicableCallers: applicableCallers || [],
      createdBy: adminUser.name
    });

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'CREATE_BONUS_SLAB',
      details: `Created Bonus Slab: ${title} (${targetSales} Approved Sales → ₹${bonusAmount})`
    });

    emitToAdmin('bonus_updated', slab);

    res.status(201).json({ success: true, slab });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleBonusSlab = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const slab = await BonusSlab.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!slab) {
      return res.status(404).json({ success: false, message: 'Bonus slab not found' });
    }

    res.json({ success: true, slab });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBonusSlab = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await BonusSlab.findByIdAndDelete(id);
    res.json({ success: true, message: 'Bonus slab removed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCallerBonusProgress = async (req: Request, res: Response) => {
  try {
    const callerId = req.user!.role === 'caller' ? req.user!.id : req.query.callerId || req.user!.id;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Strict Bonus Counting Logic: Count ONLY deals where approvalStatus == 'Approved' in current month
    const approvedSalesCount = await ConvertedClient.countDocuments({
      userId: callerId,
      approvalStatus: 'Approved',
      conversionDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const salaryConfig = await SalaryConfiguration.findOne({ userId: callerId });
    const salaryTarget = salaryConfig ? salaryConfig.monthlySalesTarget : 0;

    // Fetch active slabs
    const slabs = await BonusSlab.find({ isActive: true }).sort({ targetSales: 1 });

    let currentSlab = null;
    let nextSlab = null;

    // Resolve total targets for all active slabs
    let lastTotalTarget = salaryTarget;
    const resolvedSlabs = slabs.map((slab) => {
      let totalTarget = slab.targetSales;
      if (slab.targetSales <= salaryTarget) {
        totalTarget = salaryTarget + slab.targetSales;
      }
      totalTarget = Math.max(totalTarget, lastTotalTarget);
      
      const resSlab = {
        _id: slab._id,
        title: slab.title,
        targetSales: totalTarget, // resolved total target sales
        bonusAmount: slab.bonusAmount,
        isActive: slab.isActive
      };
      
      lastTotalTarget = totalTarget;
      return resSlab;
    });

    // Base for the next slab starts at salaryTarget
    let baseSales = salaryTarget;

    for (let i = 0; i < resolvedSlabs.length; i++) {
      if (approvedSalesCount >= resolvedSlabs[i].targetSales) {
        currentSlab = resolvedSlabs[i];
        baseSales = resolvedSlabs[i].targetSales;
      } else {
        nextSlab = resolvedSlabs[i];
        break;
      }
    }

    const meetsSalaryTarget = approvedSalesCount >= salaryTarget;
    const salesNeeded = nextSlab ? Math.max(0, nextSlab.targetSales - approvedSalesCount) : 0;
    
    let bannerText = '';
    if (!meetsSalaryTarget) {
      bannerText = 'Complete your salary target to unlock bonus progress.';
    } else if (nextSlab) {
      bannerText = `Only ${salesNeeded} Approved ${salesNeeded === 1 ? 'Sale' : 'Sales'} left to earn ₹${new Intl.NumberFormat('en-IN').format(nextSlab.bonusAmount)} Bonus!`;
    } else if (currentSlab) {
      bannerText = `🎉 Target Reached! You achieved the top ₹${new Intl.NumberFormat('en-IN').format(currentSlab.bonusAmount)} Bonus Slab!`;
    } else {
      bannerText = 'Start converting leads to unlock cash bonus rewards!';
    }

    res.json({
      success: true,
      approvedSalesCount,
      currentSlab,
      nextSlab,
      salesNeeded,
      bannerText,
      salaryTarget,
      baseSales,
      allSlabs: resolvedSlabs
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
