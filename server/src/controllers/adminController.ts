import { Request, Response } from 'express';
import { Lead } from '../models/Lead';
import { User } from '../models/User';
import { ConvertedClient } from '../models/ConvertedClient';
import { ActivityLog } from '../models/ActivityLog';
import { logActivity } from '../services/activityService';
import { emitToUser, emitToAdmin } from '../socket/socketHandler';
import { clearDemoData } from '../utils/seed';

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { callerId } = req.query;

    const baseFilter: any = {};
    if (user.role === 'caller') {
      baseFilter.userId = user.id;
    } else if (user.role === 'admin' && callerId) {
      baseFilter.userId = callerId;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Active worked leads (isNewLead = false)
    const activeFilter = { ...baseFilter, isNewLead: false };
    // New unworked imported leads (isNewLead = true)
    const newLeadsFilter = { ...baseFilter, isNewLead: true };

    // Total Active Leads (in My Prospects / Leads pipeline)
    const totalLeads = await Lead.countDocuments(activeFilter);
    // New unworked leads count
    const newLeadsCount = await Lead.countDocuments(newLeadsFilter);
    // Total imported leads count
    const totalImportedLeads = await Lead.countDocuments({ ...baseFilter, leadType: 'imported' });

    // Single Source of Truth for Converted Clients count
    const convertedClientFilter: any = { approvalStatus: 'Approved' };
    if (user.role === 'caller') {
      convertedClientFilter.userId = user.id;
    } else if (user.role === 'admin' && callerId) {
      convertedClientFilter.userId = callerId;
    }
    const totalConvertedClients = await ConvertedClient.countDocuments(convertedClientFilter);

    // Follow-ups due today or overdue (only on active worked leads)
    const followUpsDueToday = await Lead.countDocuments({
      ...activeFilter,
      nextFollowUpDate: { $lte: endOfToday }
    });

    // Completed follow-ups aggregate
    const completedFollowUpsResult = await Lead.aggregate([
      { $match: activeFilter },
      { $group: { _id: null, total: { $sum: '$completedFollowUps' } } }
    ]);
    const completedFollowUps = completedFollowUpsResult[0]?.total || 0;

    // New active leads added today
    const newLeadsAddedToday = await Lead.countDocuments({
      ...activeFilter,
      createdAt: { $gte: startOfToday }
    });

    // Leads by status (active leads only)
    const statuses = [
      'New',
      'Interested',
      'Follow-up',
      'Meeting Scheduled',
      'Converted',
      'Not Interested',
      'Closed'
    ];

    const statusCounts: Record<string, number> = {};
    for (const status of statuses) {
      if (status === 'Converted') {
        // Converted count is synchronized directly from the single source of truth: ConvertedClient collection!
        statusCounts['Converted'] = totalConvertedClients;
      } else {
        statusCounts[status] = await Lead.countDocuments({ ...activeFilter, status });
      }
    }

    // Leads by priority (active leads only)
    const priorities = ['Low', 'Medium', 'High'];
    const priorityCounts: Record<string, number> = {};
    for (const priority of priorities) {
      priorityCounts[priority] = await Lead.countDocuments({ ...activeFilter, priority });
    }

    // Callers performance (Admin only)
    let callersPerformance: any[] = [];
    if (user.role === 'admin') {
      const callers = await User.find({ role: 'caller' });
      callersPerformance = await Promise.all(
        callers.map(async (c) => {
          const count = await Lead.countDocuments({ userId: c._id, isNewLead: false });
          const unworkedNew = await Lead.countDocuments({ userId: c._id, isNewLead: true });
          const convertedCount = await ConvertedClient.countDocuments({ userId: c._id, approvalStatus: 'Approved' });
          const due = await Lead.countDocuments({
            userId: c._id,
            isNewLead: false,
            nextFollowUpDate: { $lte: endOfToday }
          });
          const completedRes = await Lead.aggregate([
            { $match: { userId: c._id, isNewLead: false } },
            { $group: { _id: null, total: { $sum: '$completedFollowUps' } } }
          ]);

          return {
            id: c._id,
            name: c.name,
            email: c.email,
            isActive: c.isActive,
            totalLeads: count,
            unworkedNewLeads: unworkedNew,
            convertedClients: convertedCount,
            dueFollowUps: due,
            completedFollowUps: completedRes[0]?.total || 0
          };
        })
      );
    }

    res.json({
      success: true,
      stats: {
        totalLeads,
        newLeadsCount,
        totalImportedLeads,
        totalConvertedClients,
        convertedClients: totalConvertedClients,
        followUpsDueToday,
        completedFollowUps,
        newLeadsAddedToday,
        statusCounts,
        priorityCounts,
        callersPerformance
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 30, action } = req.query;

    const query: any = {};
    if (action) {
      query.action = action;
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 30;
    const skip = (pageNum - 1) * limitNum;

    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      logs,
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

export const assignLead = async (req: Request, res: Response) => {
  try {
    const { leadId, targetCallerId } = req.body;
    const adminUser = req.user!;

    if (!leadId || !targetCallerId) {
      return res.status(400).json({ success: false, message: 'leadId and targetCallerId are required' });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const targetCaller = await User.findById(targetCallerId);
    if (!targetCaller) {
      return res.status(404).json({ success: false, message: 'Target caller not found' });
    }

    const oldCallerName = lead.callerName;

    lead.userId = targetCaller._id as any;
    lead.callerName = targetCaller.name;
    lead.callerEmail = targetCaller.email;
    lead.latestUpdate = `Reassigned to caller ${targetCaller.name} by Admin`;

    await lead.save();

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'ASSIGN_LEAD',
      leadId: lead._id.toString(),
      leadName: lead.name,
      details: `Reassigned prospect ${lead.name} from ${oldCallerName} to ${targetCaller.name}`
    });

    emitToUser(targetCaller._id.toString(), 'lead_assigned', lead);
    emitToAdmin('lead_assigned', lead);

    res.json({
      success: true,
      message: `Lead successfully assigned to ${targetCaller.name}`,
      lead
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const clearAllDemoData = async (req: Request, res: Response) => {
  try {
    await clearDemoData();
    res.json({
      success: true,
      message: 'All demo leads, demo callers, and activity logs have been deleted.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
