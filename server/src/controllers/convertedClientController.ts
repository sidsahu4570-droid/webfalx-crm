import { Request, Response } from 'express';
import { ConvertedClient } from '../models/ConvertedClient';
import { WebsiteUpdate } from '../models/WebsiteUpdate';
import { PaymentHistory } from '../models/PaymentHistory';
import { DomainCharge } from '../models/DomainCharge';
import { OtherExpense } from '../models/OtherExpense';
import { ClientExpenseHistory } from '../models/ClientExpenseHistory';
import { DeletedRecord } from '../models/DeletedRecord';
import { Lead } from '../models/Lead';
import { User } from '../models/User';
import { logActivity } from '../services/activityService';
import { emitToUser, emitToAdmin } from '../socket/socketHandler';
import { updateSalaryAndBonusProgress } from '../services/salaryProgressService';

export const getConvertedClients = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      callerId,
      websiteStatus,
      paymentStatus,
      approvalStatus,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const query: any = {};

    if (user.role === 'caller') {
      query.userId = user.id;
    } else if (callerId) {
      query.userId = callerId;
    }

    if (websiteStatus) query.websiteStatus = websiteStatus;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (req.query.projectType && req.query.projectType !== 'All') {
      query.projectType = req.query.projectType;
    }

    if (startDate || endDate) {
      query.conversionDate = {};
      if (startDate) query.conversionDate.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.conversionDate.$lte = end;
      }
    }

    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { clientName: searchRegex },
        { company: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { callerName: searchRegex }
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const total = await ConvertedClient.countDocuments(query);
    const clients = await ConvertedClient.find(query)
      .sort({ conversionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      clients,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getConvertedClientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const client = await ConvertedClient.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Converted client record not found' });
    }

    if (user.role === 'caller' && client.userId.toString() !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this record' });
    }

    const [websiteUpdates, paymentHistory] = await Promise.all([
      WebsiteUpdate.find({ clientId: id }).sort({ createdAt: -1 }),
      PaymentHistory.find({ clientId: id }).sort({ createdAt: -1 })
    ]);

    res.json({
      success: true,
      client,
      websiteUpdates,
      paymentHistory
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const createConvertedClient = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      leadId,
      projectType,
      clientName,
      company,
      phone,
      email,
      address,
      conversionDate,
      meetingDate,
      meetingTime,
      meetingLocation,
      upcomingMeetingDate,
      meetingNotes,
      websiteStatus,
      websiteDeliveryDate,
      totalClientAmount,
      clientPaidAmount,
      targetUserId
    } = req.body;

    if (!projectType) {
      return res.status(400).json({
        success: false,
        message: 'Please select a Project Type (Website Project or App Project) before saving the converted client.'
      });
    }

    let targetUser = user;
    if (user.role === 'admin' && targetUserId) {
      const foundUser = await User.findById(targetUserId);
      if (foundUser) {
        targetUser = {
          id: foundUser._id.toString(),
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role
        };
      }
    }

    const client = new ConvertedClient({
      leadId: leadId || undefined,
      userId: targetUser.id as any,
      callerName: targetUser.name,
      callerEmail: targetUser.email,
      projectType: projectType || 'website',
      clientName,
      company: company || '',
      phone: phone || '',
      email: email || '',
      address: address || '',
      conversionDate: conversionDate ? new Date(conversionDate) : new Date(),
      meetingDate: meetingDate ? new Date(meetingDate) : undefined,
      meetingTime: meetingTime || '',
      meetingLocation: meetingLocation || '',
      upcomingMeetingDate: upcomingMeetingDate ? new Date(upcomingMeetingDate) : undefined,
      meetingNotes: meetingNotes || '',
      websiteStatus: websiteStatus || 'Website Had To Make',
      websiteDeliveryDate: websiteDeliveryDate ? new Date(websiteDeliveryDate) : undefined,
      totalClientAmount: Number(totalClientAmount || 0),
      clientPaidAmount: Number(clientPaidAmount || 0),
      approvalStatus: user.role === 'admin' ? 'Approved' : 'Pending Approval',
      approvedBy: user.role === 'admin' ? user.name : undefined,
      approvedAt: user.role === 'admin' ? new Date() : undefined
    });

    await client.save();

    if (clientPaidAmount && Number(clientPaidAmount) > 0) {
      await PaymentHistory.create({
        clientId: client._id,
        clientName: client.clientName,
        leadId: client.leadId,
        userId: client.userId,
        callerName: client.callerName,
        callerEmail: client.callerEmail,
        paymentType: 'client_payment_received',
        amount: Number(clientPaidAmount),
        paymentMode: 'Initial Advance',
        note: 'Initial payment upon conversion',
        createdBy: user.name
      });
    }

    if (leadId) {
      const lead = await Lead.findById(leadId);
      if (lead) {
        lead.status = 'Converted';
        lead.latestUpdate = `Converted client created: ${clientName}`;
        await lead.save();
      }
    }

    await logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'CONVERT_CLIENT',
      details: `Created converted client record for ${clientName}`
    });

    emitToAdmin('client_created', { client, message: `New Converted Client Added: ${clientName} by ${user.name}` });
    if (upcomingMeetingDate) {
      emitToAdmin('meeting_added', { client, message: `New Meeting Scheduled with ${clientName}` });
    }

    res.status(201).json({
      success: true,
      message: 'Converted client record created successfully',
      client
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateConvertedClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const updateData = req.body;

    const client = await ConvertedClient.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Converted client not found' });
    }

    const previousState = client.toObject();

    if (user.role === 'caller') {
      if (client.userId.toString() !== user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const lockedFields: any = client.lockedFields || new Map();
      for (const key of Object.keys(updateData)) {
        const isLocked = lockedFields instanceof Map ? lockedFields.get(key) : lockedFields[key];
        if (isLocked === true) {
          return res.status(403).json({
            success: false,
            message: `Field '${key}' is locked by Admin and cannot be modified.`
          });
        }
      }
    }

    const allowedKeys = [
      'clientName',
      'company',
      'phone',
      'email',
      'address',
      'conversionDate',
      'meetingDate',
      'meetingTime',
      'meetingLocation',
      'upcomingMeetingDate',
      'meetingNotes',
      'totalClientAmount',
      'websiteMakingCost',
      'domainCharges',
      'otherExpenses'
    ];

    allowedKeys.forEach((key) => {
      if (updateData[key] !== undefined) {
        if (['conversionDate', 'meetingDate', 'upcomingMeetingDate', 'websiteDeliveryDate'].includes(key)) {
          (client as any)[key] = updateData[key] ? new Date(updateData[key]) : undefined;
        } else if (typeof updateData[key] === 'number') {
          (client as any)[key] = Number(updateData[key]);
        } else {
          (client as any)[key] = updateData[key];
        }
      }
    });

    if (updateData.websiteDeliveryDate && new Date(updateData.websiteDeliveryDate).getTime() !== new Date(previousState.websiteDeliveryDate || 0).getTime()) {
      client.websiteDeliveryDate = new Date(updateData.websiteDeliveryDate);
      emitToUser(client.userId.toString(), 'delivery_date_updated', { client, message: `Website Delivery Date updated for ${client.clientName}` });
    }

    await client.save();

    await logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'UPDATE_CLIENT',
      details: `Updated converted client profile for ${client.clientName}`
    });

    emitToUser(client.userId.toString(), 'client_updated', client);
    emitToAdmin('client_updated', client);

    res.json({
      success: true,
      message: 'Converted client updated successfully',
      client
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const approveConvertedClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, approvalStatus } = req.body;
    const targetStatus = status || approvalStatus;
    const adminUser = req.user!;

    if (!['Approved', 'Rejected'].includes(targetStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid approval status' });
    }

    const client = await ConvertedClient.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client record not found' });
    }

    client.approvalStatus = targetStatus;
    client.approvedBy = adminUser.name;
    client.approvedAt = new Date();

    await client.save();

    // Recalculate salary and bonus progress in real-time
    await updateSalaryAndBonusProgress(client.userId.toString());

    emitToUser(client.userId.toString(), 'client_updated', client);
    emitToUser(client.userId.toString(), 'salary_progress_updated', { userId: client.userId });
    emitToUser(client.userId.toString(), 'bonus_progress_updated', { userId: client.userId });
    emitToAdmin('client_updated', client);
    emitToAdmin('salary_progress_updated', { userId: client.userId });
    emitToAdmin('bonus_progress_updated', { userId: client.userId });

    res.json({
      success: true,
      message: `Client status updated to ${targetStatus}`,
      client
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const toggleFieldLock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fieldName, isLocked } = req.body;
    const adminUser = req.user!;

    const client = await ConvertedClient.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client record not found' });
    }

    if (!client.lockedFields) client.lockedFields = new Map();
    if (client.lockedFields instanceof Map) {
      client.lockedFields.set(fieldName, !!isLocked);
    } else {
      (client.lockedFields as any)[fieldName] = !!isLocked;
    }
    client.markModified('lockedFields');

    await client.save();

    emitToUser(client.userId.toString(), 'client_updated', client);
    emitToAdmin('client_updated', client);

    res.json({
      success: true,
      message: `Field '${fieldName}' ${isLocked ? 'locked' : 'unlocked'}`,
      client
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Website Progress - Admin Only Update
export const addWebsiteUpdate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { updateText, websiteStatus, websiteDeliveryDate, websiteCompletedDate } = req.body;
    const user = req.user!;

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Admin can update website progress.'
      });
    }

    const client = await ConvertedClient.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client record not found' });
    }

    const newStatus = websiteStatus || client.websiteStatus;

    const websiteUpdate = await WebsiteUpdate.create({
      clientId: client._id,
      leadId: client.leadId,
      userId: client.userId,
      callerName: client.callerName,
      callerEmail: client.callerEmail,
      updateText: updateText.trim(),
      websiteStatus: newStatus,
      updatedBy: user.name
    });

    client.websiteStatus = newStatus as any;
    client.latestWebsiteUpdate = updateText.trim();
    if (websiteDeliveryDate) client.websiteDeliveryDate = new Date(websiteDeliveryDate);
    if (websiteCompletedDate) client.websiteCompletionDate = new Date(websiteCompletedDate);

    await client.save();

    emitToUser(client.userId.toString(), 'website_update_added', { client, websiteUpdate, message: `Website Progress updated for ${client.clientName}` });
    emitToAdmin('website_update_added', { client, websiteUpdate });

    res.json({
      success: true,
      message: 'Website progress update posted by Admin',
      client,
      websiteUpdate
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const addPaymentRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentType, amount, paymentMode, note } = req.body;
    const user = req.user!;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }

    const client = await ConvertedClient.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client record not found' });
    }

    if (user.role === 'caller' && client.userId.toString() !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const numAmount = Number(amount);

    const paymentRecord = await PaymentHistory.create({
      clientId: client._id,
      clientName: client.clientName,
      leadId: client.leadId,
      userId: client.userId,
      callerName: client.callerName,
      callerEmail: client.callerEmail,
      paymentType,
      amount: numAmount,
      paymentMode: paymentMode || 'UPI',
      note: note || '',
      createdBy: user.name
    });

    // Automatically recalculate clientPaidAmount as SUM of all client_payment_received entries
    if (paymentType === 'client_payment_received') {
      const allClientPayments = await PaymentHistory.find({
        clientId: client._id,
        paymentType: 'client_payment_received'
      });
      client.clientPaidAmount = allClientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    } else if (paymentType === 'website_making_cost') {
      client.websiteMakingCost += numAmount;
    } else if (paymentType === 'domain_charge') {
      client.domainCharges += numAmount;
    } else if (paymentType === 'other_expense') {
      client.otherExpenses += numAmount;
    }

    await client.save();

    await logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'PAYMENT_RECORDED',
      details: `Logged payment of ₹${numAmount} (${paymentType}) for ${client.clientName}`
    });

    emitToAdmin('payment_added', { client, paymentRecord, message: `New Payment of ₹${numAmount} received for ${client.clientName}` });
    emitToUser(client.userId.toString(), 'payment_added', { client, paymentRecord });

    res.json({
      success: true,
      message: `Payment entry of ₹${numAmount} recorded successfully`,
      client,
      paymentRecord
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Domain Charges (Admin Only)
export const createDomainCharge = async (req: Request, res: Response) => {
  try {
    const { amount, notes, chargeDate } = req.body;
    const adminUser = req.user!;

    const charge = await DomainCharge.create({
      amount: Number(amount),
      notes: notes || '',
      chargeDate: chargeDate ? new Date(chargeDate) : new Date(),
      createdBy: adminUser.name
    });

    res.status(201).json({ success: true, charge });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDomainCharges = async (req: Request, res: Response) => {
  try {
    const charges = await DomainCharge.find().sort({ chargeDate: -1 });
    res.json({ success: true, charges });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Other Expenses (Admin Only)
export const createOtherExpense = async (req: Request, res: Response) => {
  try {
    const { amount, expenseType, notes, expenseDate } = req.body;
    const adminUser = req.user!;

    const expense = await OtherExpense.create({
      amount: Number(amount),
      expenseType: expenseType || 'General',
      notes: notes || '',
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      createdBy: adminUser.name
    });

    res.status(201).json({ success: true, expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOtherExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await OtherExpense.find().sort({ expenseDate: -1 });
    res.json({ success: true, expenses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMeetings = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { callerId, filter = 'upcoming' } = req.query;

    const query: any = {
      $or: [
        { meetingDate: { $exists: true, $ne: null } },
        { upcomingMeetingDate: { $exists: true, $ne: null } }
      ]
    };

    if (user.role === 'caller') {
      query.userId = user.id;
    } else if (callerId) {
      query.userId = callerId;
    }

    const now = new Date();

    if (filter === 'upcoming') {
      query.upcomingMeetingDate = { $gte: now };
    } else if (filter === 'today') {
      const startToday = new Date();
      startToday.setHours(0, 0, 0, 0);
      const endToday = new Date();
      endToday.setHours(23, 59, 59, 999);
      query.upcomingMeetingDate = { $gte: startToday, $lte: endToday };
    } else if (filter === 'missed') {
      query.upcomingMeetingDate = { $lt: now };
    } else if (filter === 'past' || filter === 'completed') {
      query.meetingDate = { $lt: now };
    }

    const clients = await ConvertedClient.find(query).sort({ upcomingMeetingDate: 1 });

    res.json({
      success: true,
      meetings: clients
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getRevenueStats = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { callerId } = req.query;

    const filter: any = {};
    if (user.role === 'caller') {
      filter.userId = user.id;
    } else if (callerId) {
      filter.userId = callerId;
    }

    filter.approvalStatus = 'Approved';

    // Single Source of Truth Routing: Website Revenue counts ONLY Website Projects!
    if (req.query.projectType && req.query.projectType !== 'All') {
      filter.projectType = req.query.projectType;
    } else {
      filter.projectType = 'website';
    }

    const [clients, domainChargesList, otherExpensesList] = await Promise.all([
      ConvertedClient.find(filter),
      DomainCharge.find(),
      OtherExpense.find()
    ]);

    const totalConvertedClients = clients.length;
    const totalExpectedAmount = clients.reduce((sum, c) => sum + (c.totalClientAmount || 0), 0);
    const totalReceivedAmount = clients.reduce((sum, c) => sum + (c.clientPaidAmount || 0), 0);
    const totalClientPendingAmount = clients.reduce((sum, c) => sum + (c.clientPendingAmount || 0), 0);

    const totalWebsiteCost = clients.reduce((sum, c) => sum + (c.websiteMakingCost || 0), 0);
    const totalDomainCharges = domainChargesList.reduce((sum, d) => sum + (d.amount || 0), 0) +
      clients.reduce((sum, c) => sum + (c.domainCharges || 0), 0);
    const totalOtherExpenses = otherExpensesList.reduce((sum, o) => sum + (o.amount || 0), 0) +
      clients.reduce((sum, c) => sum + (c.otherExpenses || 0), 0);

    const grossRevenue = totalReceivedAmount;
    const netProfit =
      totalReceivedAmount -
      totalWebsiteCost -
      totalDomainCharges -
      totalOtherExpenses;

    let callerBreakdown: any[] = [];
    if (user.role === 'admin') {
      const callers = await User.find({ role: 'caller' });
      callerBreakdown = callers.map((c) => {
        const callerClients = clients.filter((cl) => cl.userId.toString() === c._id.toString());
        const rev = callerClients.reduce((sum, cl) => sum + (cl.clientPaidAmount || 0), 0);

        return {
          callerId: c._id,
          callerName: c.name,
          callerEmail: c.email,
          convertedCount: callerClients.length,
          revenueGenerated: rev
        };
      });
    }

    res.json({
      success: true,
      stats: {
        totalConvertedClients,
        totalExpectedAmount,
        totalReceivedAmount,
        totalClientPendingAmount,
        totalWebsiteCost,
        totalDomainCharges,
        totalOtherExpenses,
        grossRevenue,
        netProfit,
        callerBreakdown
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const addClientExpense = async (req: Request, res: Response) => {
  try {
    const adminUser = req.user!;
    const { id } = req.params;
    const { expenseType, amount, notes } = req.body;

    const client = await ConvertedClient.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client record not found' });
    }

    const numAmount = Number(amount || 0);
    if (numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Expense amount must be greater than 0' });
    }

    const expenseEntry = await ClientExpenseHistory.create({
      clientId: client._id,
      clientName: client.clientName,
      expenseType,
      amount: numAmount,
      notes: notes || '',
      createdBy: adminUser.name
    });

    if (expenseType === 'Website Development Cost' || expenseType === 'Website Cost') client.websiteMakingCost += numAmount;
    else if (expenseType === 'Domain Cost' || expenseType === 'Domain Charge') client.domainCharges += numAmount;
    else if (expenseType === 'App Development Cost') client.appDevelopmentCost = (client.appDevelopmentCost || 0) + numAmount;
    else if (expenseType === 'Play Store Cost') client.playStoreCost = (client.playStoreCost || 0) + numAmount;
    else if (expenseType === 'Other Expense') client.otherExpenses += numAmount;

    await client.save();

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'ADD_CLIENT_EXPENSE',
      leadId: client.leadId ? client.leadId.toString() : undefined,
      leadName: client.clientName,
      details: `Added ${expenseType} of ₹${numAmount} for ${client.clientName}`
    });

    emitToUser(client.userId.toString(), 'client_updated', client);
    emitToAdmin('client_updated', client);
    emitToAdmin('revenue_updated', { message: 'Client expense added' });

    res.status(201).json({
      success: true,
      message: `${expenseType} logged successfully`,
      expense: expenseEntry,
      client
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getClientExpenseHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const history = await ClientExpenseHistory.find({ clientId: id }).sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const deleteConvertedClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user!;
    const { reason } = req.body;

    const client = await ConvertedClient.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Converted client not found' });
    }

    // Fetch related records to preserve full history snapshot
    const [payments, expenses, websiteUpdates] = await Promise.all([
      PaymentHistory.find({ clientId: id }),
      ClientExpenseHistory.find({ clientId: id }),
      WebsiteUpdate.find({ clientId: id })
    ]);

    // Create Soft Delete Archive Record
    await DeletedRecord.create({
      originalId: client._id.toString(),
      collectionName: 'ConvertedClient',
      clientName: client.clientName,
      company: client.company,
      phone: client.phone,
      email: client.email,
      address: client.address,
      projectType: client.projectType || 'website',
      totalAmount: client.totalClientAmount || 0,
      paidAmount: client.clientPaidAmount || 0,
      pendingAmount: client.clientPendingAmount || 0,
      conversionDate: client.conversionDate || new Date(),
      approvalDate: client.approvedAt,
      deletionDate: new Date(),
      deletedBy: adminUser.name,
      deletedByRole: adminUser.role,
      deletionReason: reason || 'Soft deleted by Admin',
      callerName: client.callerName,
      callerEmail: client.callerEmail,
      websiteStatus: client.websiteStatus,
      paymentStatus: client.paymentStatus,
      data: {
        client: client.toObject(),
        payments: payments.map((p) => p.toObject()),
        expenses: expenses.map((e) => e.toObject()),
        websiteUpdates: websiteUpdates.map((w) => w.toObject())
      }
    });

    // Remove client from active collection
    await ConvertedClient.findByIdAndDelete(id);

    // Activity Log
    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'DELETE_CLIENT',
      leadName: client.clientName,
      details: `Soft deleted converted client '${client.clientName}' and moved to Trash Archive`
    });

    // Real-Time Socket Broadcast for Immediate Automatic Recalculation
    emitToUser(client.userId.toString(), 'client_deleted', { clientId: id });
    emitToUser(client.userId.toString(), 'client_updated', { clientId: id });
    emitToUser(client.userId.toString(), 'bonus_updated', { message: 'Client deleted' });
    emitToAdmin('client_deleted', { clientId: id });
    emitToAdmin('client_updated', { clientId: id });
    emitToAdmin('converted_client_updated', { clientId: id });
    emitToAdmin('revenue_updated', { message: 'Client deleted' });
    emitToAdmin('bonus_updated', { message: 'Client deleted' });
    emitToAdmin('leaderboard_updated', { message: 'Client deleted' });

    res.json({
      success: true,
      message: `Client '${client.clientName}' moved to Trash Archive. All CRM revenue, calculations, and performance metrics automatically updated.`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
