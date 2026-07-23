import { Request, Response } from 'express';
import { SalaryPayment } from '../models/SalaryPayment';
import { SalaryConfiguration } from '../models/SalaryConfiguration';
import { User } from '../models/User';
import { logActivity } from '../services/activityService';
import { emitToUser, emitToAdmin } from '../socket/socketHandler';
import mongoose from 'mongoose';

// Admin: Record a salary payment
export const recordSalaryPayment = async (req: Request, res: Response) => {
  try {
    const { callerId, month, salaryPaid, bonusPaid, deduction, paymentMethod, notes, paidAt } = req.body;
    const adminUser = req.user!;

    if (!callerId || !month || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Caller ID, month, and payment method are required' });
    }

    const caller = await User.findById(callerId);
    if (!caller || caller.role !== 'caller') {
      return res.status(404).json({ success: false, message: 'Caller not found' });
    }

    const config = await SalaryConfiguration.findOne({ userId: callerId });
    const monthlySalary = config ? config.monthlySalary : 0;

    const sPaid = Number(salaryPaid) || 0;
    const bPaid = Number(bonusPaid) || 0;
    const ded = Number(deduction) || 0;
    const netPaid = sPaid + bPaid;

    const paymentDate = paidAt ? new Date(paidAt) : new Date();

    const payment = await SalaryPayment.create({
      callerId,
      callerName: caller.name,
      month,
      monthlySalary,
      salaryPaid: sPaid,
      bonusPaid: bPaid,
      deduction: ded,
      netPaid,
      paymentMethod,
      notes: notes || '',
      paidBy: adminUser.id,
      paidAt: paymentDate
    });

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'RECORD_SALARY_PAYMENT',
      details: `Paid salary to ${caller.name} for ${month}: Salary Paid ₹${sPaid.toLocaleString()}, Bonus ₹${bPaid.toLocaleString()}, Deduction ₹${ded.toLocaleString()}`
    });

    // Real-time Socket events
    emitToUser(callerId, 'salary_payment_added', payment);
    emitToAdmin('salary_payment_added', payment);
    emitToUser(callerId, 'revenue_updated', {});
    emitToAdmin('revenue_updated', {});

    res.json({ success: true, message: 'Salary payment recorded successfully', payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Get personal salary payments (Caller) or query payments for a specific caller (Admin)
export const getCallerSalaryPayments = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const callerId = user.role === 'caller' ? user.id : req.query.callerId || user.id;

    const payments = await SalaryPayment.find({ callerId })
      .populate('paidBy', 'name email')
      .sort({ paidAt: -1 });

    res.json({ success: true, payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Admin: Get all salary payments ever recorded
export const getAllSalaryPayments = async (req: Request, res: Response) => {
  try {
    const payments = await SalaryPayment.find()
      .populate('paidBy', 'name email')
      .sort({ paidAt: -1 });

    res.json({ success: true, payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Get current month salary summary metrics for a caller
export const getCallerSalarySummary = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const callerId = user.role === 'caller' ? user.id : req.query.callerId || user.id;

    // Get current month in format YYYY-MM
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const selectedMonth = req.query.month ? String(req.query.month) : currentMonthStr;

    // Fetch config
    const config = await SalaryConfiguration.findOne({ userId: callerId });
    const monthlySalary = config ? config.monthlySalary : 0;

    // Aggregate monthly payments
    const payments = await SalaryPayment.find({ callerId, month: selectedMonth });

    const salaryPaid = payments.reduce((sum, p) => sum + (p.salaryPaid || 0), 0);
    const bonusPaid = payments.reduce((sum, p) => sum + (p.bonusPaid || 0), 0);
    const deduction = payments.reduce((sum, p) => sum + (p.deduction || 0), 0);
    const netReceived = salaryPaid + bonusPaid;

    const salaryRemaining = Math.max(0, monthlySalary - salaryPaid);

    // Get last payment date
    const allPayments = await SalaryPayment.find({ callerId }).sort({ paidAt: -1 }).limit(1);
    const lastPaymentDate = allPayments.length > 0 ? allPayments[0].paidAt : null;

    let paymentStatus = 'Unpaid';
    if (salaryPaid >= monthlySalary && monthlySalary > 0) {
      paymentStatus = 'Fully Paid';
    } else if (salaryPaid > 0) {
      paymentStatus = 'Partially Paid';
    }

    res.json({
      success: true,
      summary: {
        month: selectedMonth,
        monthlySalary,
        salaryPaid,
        salaryRemaining,
        bonusPaid,
        deduction,
        netReceived,
        lastPaymentDate,
        paymentStatus
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
