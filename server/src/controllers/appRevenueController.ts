import { Request, Response } from 'express';
import { AppRevenue } from '../models/AppRevenue';
import { AppExpense } from '../models/AppExpense';
import { AppPaymentHistory } from '../models/AppPaymentHistory';
import { ConvertedClient } from '../models/ConvertedClient';
import { DomainCharge } from '../models/DomainCharge';
import { OtherExpense } from '../models/OtherExpense';
import { SalaryPayment } from '../models/SalaryPayment';
import { emitToAdmin } from '../socket/socketHandler';

export const getAppRevenues = async (req: Request, res: Response) => {
  try {
    const [manualRevenues, convertedAppClients] = await Promise.all([
      AppRevenue.find().sort({ createdAt: -1 }),
      ConvertedClient.find({ projectType: 'app', approvalStatus: 'Approved' }).sort({ createdAt: -1 })
    ]);

    // Map Converted Clients with projectType='app' to match AppRevenue interface format
    const convertedMapped = convertedAppClients.map((c) => ({
      _id: c._id.toString(),
      clientName: c.clientName,
      company: c.company,
      email: c.email,
      phone: c.phone,
      totalAmount: c.totalClientAmount,
      paidAmount: c.clientPaidAmount,
      pendingAmount: c.clientPendingAmount,
      revenueType: 'Mobile Apps' as any,
      paymentStatus: c.paymentStatus as any,
      notes: `Converted Client (${c.callerName})`,
      createdAt: c.createdAt.toISOString()
    }));

    const combined = [...convertedMapped, ...manualRevenues];
    res.json({ success: true, revenues: combined });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAppRevenue = async (req: Request, res: Response) => {
  try {
    const adminUser = req.user!;
    const { clientName, company, email, phone, totalAmount, paidAmount, revenueType, notes } = req.body;

    const numTotal = Number(totalAmount || 0);
    const numPaid = Number(paidAmount || 0);

    const revenue = new AppRevenue({
      clientName,
      company: company || '',
      email: email || '',
      phone: phone || '',
      callerName: adminUser.name,
      callerEmail: adminUser.email,
      totalAmount: numTotal,
      paidAmount: numPaid,
      revenueType: revenueType || 'Mobile Apps',
      notes: notes || ''
    });

    await revenue.save();

    if (numPaid > 0) {
      await AppPaymentHistory.create({
        appRevenueId: revenue._id,
        clientName: revenue.clientName,
        amount: numPaid,
        paymentMode: 'Initial Advance',
        notes: 'Initial payment upon setup',
        createdBy: adminUser.name
      });
    }

    emitToAdmin('revenue_updated', { message: 'App Revenue Created' });
    res.status(201).json({ success: true, revenue });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addAppPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, paymentMode, notes } = req.body;
    const adminUser = req.user!;

    // Check if it's a ConvertedClient with projectType='app'
    const convertedClient = await ConvertedClient.findById(id);
    if (convertedClient && convertedClient.projectType === 'app') {
      const numAmount = Number(amount);
      convertedClient.clientPaidAmount += numAmount;
      await convertedClient.save();
      emitToAdmin('revenue_updated', { message: 'App Payment Added' });
      return res.json({ success: true, revenue: convertedClient });
    }

    const revenue = await AppRevenue.findById(id);
    if (!revenue) {
      return res.status(404).json({ success: false, message: 'App revenue record not found' });
    }

    revenue.paidAmount += Number(amount);
    await revenue.save();

    await AppPaymentHistory.create({
      appRevenueId: revenue._id,
      clientName: revenue.clientName,
      amount: Number(amount),
      paymentMode: paymentMode || 'UPI',
      notes: notes || 'Subsequent payment received',
      createdBy: adminUser.name
    });

    emitToAdmin('revenue_updated', { message: 'App Payment Added' });
    res.json({ success: true, revenue });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAppExpense = async (req: Request, res: Response) => {
  try {
    const adminUser = req.user!;
    const { expenseType, amount, notes, expenseDate } = req.body;

    const expense = await AppExpense.create({
      expenseType,
      amount: Number(amount),
      notes: notes || '',
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      createdBy: adminUser.name
    });

    emitToAdmin('revenue_updated', { message: 'App Expense Created' });
    res.status(201).json({ success: true, expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAppExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await AppExpense.find().sort({ expenseDate: -1 });
    res.json({ success: true, expenses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAppRevenueStats = async (req: Request, res: Response) => {
  try {
    const [appRevenues, convertedAppClients, appExpenses] = await Promise.all([
      AppRevenue.find(),
      ConvertedClient.find({ projectType: 'app', approvalStatus: 'Approved' }),
      AppExpense.find()
    ]);

    const manualExpected = appRevenues.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const manualReceived = appRevenues.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
    const manualPending = appRevenues.reduce((sum, r) => sum + (r.pendingAmount || 0), 0);

    const convertedExpected = convertedAppClients.reduce((sum, c) => sum + (c.totalClientAmount || 0), 0);
    const convertedReceived = convertedAppClients.reduce((sum, c) => sum + (c.clientPaidAmount || 0), 0);
    const convertedPending = convertedAppClients.reduce((sum, c) => sum + (c.clientPendingAmount || 0), 0);

    const totalExpectedAmount = manualExpected + convertedExpected;
    const totalReceivedAmount = manualReceived + convertedReceived;
    const totalPendingAmount = manualPending + convertedPending;

    // App Specific Expense Categories Calculation
    const convertedDevCost = convertedAppClients.reduce((sum, c) => sum + (c.appDevelopmentCost || 0), 0);
    const manualDevCost = appExpenses.filter((e) => e.expenseType === 'App Development Cost').reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalAppDevelopmentCost = convertedDevCost + manualDevCost;

    const convertedPlayStoreCost = convertedAppClients.reduce((sum, c) => sum + (c.playStoreCost || 0), 0);
    const manualPlayStoreCost = appExpenses.filter((e) => e.expenseType === 'Play Store Cost').reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalPlayStoreCost = convertedPlayStoreCost + manualPlayStoreCost;

    const otherAppExpenses = convertedAppClients.reduce((sum, c) => sum + (c.otherExpenses || 0), 0) +
      appExpenses.filter((e) => e.expenseType === 'Other Expenses').reduce((sum, e) => sum + (e.amount || 0), 0);
    const miscExpenses = appExpenses.filter((e) => e.expenseType !== 'App Development Cost' && e.expenseType !== 'Play Store Cost' && e.expenseType !== 'Other Expenses').reduce((sum, e) => sum + (e.amount || 0), 0);

    const totalExpenses = totalAppDevelopmentCost + totalPlayStoreCost + otherAppExpenses + miscExpenses;
    const netProfit = totalReceivedAmount - totalExpenses;

    res.json({
      success: true,
      stats: {
        totalExpectedAmount,
        totalReceivedAmount,
        totalPendingAmount,
        totalExpenses,
        netProfit,
        totalAppDevelopmentCost,
        totalPlayStoreCost
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOverallRevenueStats = async (req: Request, res: Response) => {
  try {
    const [websiteClients, appConvertedClients, domainChargesList, websiteExpensesList, appRevenues, appExpensesList, salaryPayments] =
      await Promise.all([
        ConvertedClient.find({ projectType: 'website', approvalStatus: 'Approved' }),
        ConvertedClient.find({ projectType: 'app', approvalStatus: 'Approved' }),
        DomainCharge.find(),
        OtherExpense.find(),
        AppRevenue.find(),
        AppExpense.find(),
        SalaryPayment.find()
      ]);

    // Website Financial Metrics (Website Projects Only)
    const websiteRevenue = websiteClients.reduce((sum, c) => sum + (c.clientPaidAmount || 0), 0);
    const websiteExpected = websiteClients.reduce((sum, c) => sum + (c.totalClientAmount || 0), 0);
    const websitePending = websiteClients.reduce((sum, c) => sum + (c.clientPendingAmount || 0), 0);

    const websiteCost = websiteClients.reduce((sum, c) => sum + (c.websiteMakingCost || 0), 0);
    const domainCharges = domainChargesList.reduce((sum, d) => sum + (d.amount || 0), 0);
    const otherWebsiteExpenses = websiteExpensesList.reduce((sum, o) => sum + (o.amount || 0), 0);

    const websiteExpenses =
      websiteCost +
      domainCharges +
      otherWebsiteExpenses;

    const websiteProfit = websiteRevenue - websiteExpenses;

    // App Financial Metrics (App Projects + App Revenue)
    const appManualRevenue = appRevenues.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
    const appManualExpected = appRevenues.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const appManualPending = appRevenues.reduce((sum, r) => sum + (r.pendingAmount || 0), 0);

    const appConvertedRevenue = appConvertedClients.reduce((sum, c) => sum + (c.clientPaidAmount || 0), 0);
    const appConvertedExpected = appConvertedClients.reduce((sum, c) => sum + (c.totalClientAmount || 0), 0);
    const appConvertedPending = appConvertedClients.reduce((sum, c) => sum + (c.clientPendingAmount || 0), 0);

    const appRevenue = appManualRevenue + appConvertedRevenue;
    const appExpected = appManualExpected + appConvertedExpected;
    const appPending = appManualPending + appConvertedPending;

    const appExpenses = appExpensesList.reduce((sum, e) => sum + (e.amount || 0), 0);
    const appProfit = appRevenue - appExpenses;

    // Combined Overall Metrics
    const combinedRevenue = websiteRevenue + appRevenue;
    const combinedExpected = websiteExpected + appExpected;
    const combinedPending = websitePending + appPending;
    const combinedExpenses = websiteExpenses + appExpenses;

    // Employee Payout Costs
    const totalSalaryPaid = salaryPayments.reduce((sum, p) => sum + (p.salaryPaid || 0), 0);
    const totalBonusPaid = salaryPayments.reduce((sum, p) => sum + (p.bonusPaid || 0), 0);
    const totalEmployeeCost = totalSalaryPaid + totalBonusPaid;

    // Profit reduction calculation (salary paid and bonus paid reduce profit)
    const overallProfit = websiteProfit + appProfit - totalSalaryPaid - totalBonusPaid;

    const comparisons = [
      { category: 'Revenue', Website: websiteRevenue, App: appRevenue, Combined: combinedRevenue },
      { category: 'Expenses', Website: websiteExpenses, App: appExpenses, Combined: combinedExpenses },
      { category: 'Profit', Website: websiteProfit, App: appProfit, Combined: overallProfit }
    ];

    res.json({
      success: true,
      stats: {
        websiteRevenue,
        websiteExpected,
        websitePending,
        websiteExpenses,
        websiteProfit,

        appRevenue,
        appExpected,
        appPending,
        appExpenses,
        appProfit,

        combinedRevenue,
        combinedExpected,
        combinedPending,
        combinedExpenses,
        overallProfit,

        totalSalaryPaid,
        totalBonusPaid,
        totalEmployeeCost,

        comparisons
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
