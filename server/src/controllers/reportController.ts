import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { DailyReport, IDailyReport } from '../models/DailyReport';
import { ReportEditHistory } from '../models/ReportEditHistory';
import { ReportAudit } from '../models/ReportAudit';
import { NewLeadDailyReport } from '../models/NewLeadDailyReport';
import { ExistingLeadDailyReport } from '../models/ExistingLeadDailyReport';
import { NewLeadReportAudit } from '../models/NewLeadReportAudit';
import { ExistingLeadReportAudit } from '../models/ExistingLeadReportAudit';
import { User } from '../models/User';
import { logActivity } from '../services/activityService';
import { emitToUser, emitToAdmin } from '../socket/socketHandler';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

// Helper to calculate edit permission and remaining time for caller
export const computeReportEditState = (report: IDailyReport, role: string, userId: string) => {
  const now = new Date().getTime();
  const updatedAtTime = new Date(report.updatedAt || report.createdAt).getTime();

  // Admin can always edit
  if (role === 'admin') {
    return {
      canEdit: true,
      reason: 'Admin full access',
      adminUnlockActive: false,
      remainingSeconds: 0
    };
  }

  // Caller ownership check
  if (report.userId.toString() !== userId) {
    return {
      canEdit: false,
      reason: 'Report belongs to another caller',
      adminUnlockActive: false,
      remainingSeconds: 0
    };
  }

  // Check Admin Temporary Unlock Window (10 mins)
  if (report.adminEditAllowed && report.adminEditAllowedUntil) {
    const adminUnlockUntilTime = new Date(report.adminEditAllowedUntil).getTime();
    if (now <= adminUnlockUntilTime) {
      const remainingSeconds = Math.max(0, Math.floor((adminUnlockUntilTime - now) / 1000));
      return {
        canEdit: true,
        reason: 'Temporary Admin Unlock Active',
        adminUnlockActive: true,
        remainingSeconds
      };
    }
  }

  // Check Standard 2-Hour Window
  const timeDiff = now - updatedAtTime;
  if (timeDiff <= TWO_HOURS_MS) {
    const remainingSeconds = Math.max(0, Math.floor((TWO_HOURS_MS - timeDiff) / 1000));
    return {
      canEdit: true,
      reason: 'Within 2-hour edit window',
      adminUnlockActive: false,
      remainingSeconds
    };
  }

  // Otherwise Locked
  return {
    canEdit: false,
    reason: 'Editing locked. Please contact admin to unlock this report.',
    adminUnlockActive: false,
    remainingSeconds: 0
  };
};

export const getCallerReports = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await DailyReport.countDocuments({ userId: user.id });
    const reports = await DailyReport.find({ userId: user.id })
      .sort({ reportDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const reportsWithState = reports.map((r) => {
      const editState = computeReportEditState(r, user.role, user.id);
      return {
        ...r.toObject(),
        editState
      };
    });

    res.json({
      success: true,
      reports: reportsWithState,
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

export const getAllReports = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      callerId,
      startDate,
      endDate,
      minCalls,
      minConversions,
      search,
      page = 1,
      limit = 30
    } = req.query;

    const query: any = {};

    if (user.role === 'caller') {
      query.userId = user.id;
    } else if (callerId) {
      query.userId = callerId;
    }

    if (startDate || endDate) {
      query.reportDate = {};
      if (startDate) query.reportDate.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.reportDate.$lte = end;
      }
    }

    if (minCalls) {
      query.totalCalls = { $gte: parseInt(minCalls as string, 10) };
    }

    if (minConversions) {
      query.convertedClients = { $gte: parseInt(minConversions as string, 10) };
    }

    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { callerName: searchRegex },
        { callerEmail: searchRegex },
        { remarks: searchRegex }
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 30;
    const skip = (pageNum - 1) * limitNum;

    const total = await DailyReport.countDocuments(query);
    const reports = await DailyReport.find(query)
      .sort({ reportDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const reportsWithState = reports.map((r) => {
      const editState = computeReportEditState(r, user.role, user.id);
      return {
        ...r.toObject(),
        editState
      };
    });

    res.json({
      success: true,
      reports: reportsWithState,
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

export const createOrUpdateReport = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      reportDate,
      totalCalls,
      connectedCalls,
      notPickedCalls,
      followUpsDone,
      followUpsPending,
      interestedClients,
      convertedClients,
      notInterestedClients,
      meetingsScheduled,
      whatsappMessagesSent,
      remarks,
      targetUserId // Admin specifying user
    } = req.body;

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

    const dateToUse = reportDate ? new Date(reportDate) : new Date();
    dateToUse.setHours(0, 0, 0, 0);

    let report = await DailyReport.findOne({
      userId: targetUser.id,
      reportDate: dateToUse
    });

    if (report) {
      // Check Edit permission if existing report
      const editState = computeReportEditState(report, user.role, user.id);
      if (!editState.canEdit) {
        return res.status(403).json({
          success: false,
          message: editState.reason
        });
      }

      // Track previous data for history trail
      const previousData = {
        totalCalls: report.totalCalls,
        connectedCalls: report.connectedCalls,
        notPickedCalls: report.notPickedCalls,
        followUpsDone: report.followUpsDone,
        followUpsPending: report.followUpsPending,
        interestedClients: report.interestedClients,
        convertedClients: report.convertedClients,
        notInterestedClients: report.notInterestedClients,
        meetingsScheduled: report.meetingsScheduled,
        whatsappMessagesSent: report.whatsappMessagesSent,
        remarks: report.remarks
      };

      const newData = {
        totalCalls: totalCalls ?? report.totalCalls,
        connectedCalls: connectedCalls ?? report.connectedCalls,
        notPickedCalls: notPickedCalls ?? report.notPickedCalls,
        followUpsDone: followUpsDone ?? report.followUpsDone,
        followUpsPending: followUpsPending ?? report.followUpsPending,
        interestedClients: interestedClients ?? report.interestedClients,
        convertedClients: convertedClients ?? report.convertedClients,
        notInterestedClients: notInterestedClients ?? report.notInterestedClients,
        meetingsScheduled: meetingsScheduled ?? report.meetingsScheduled,
        whatsappMessagesSent: whatsappMessagesSent ?? report.whatsappMessagesSent,
        remarks: remarks ?? report.remarks
      };

      const editedFields = Object.keys(newData).filter(
        (key) => (previousData as any)[key] !== (newData as any)[key]
      );

      // Update fields
      Object.assign(report, newData);
      report.updatedAt = new Date();

      // Clear admin unlock if expired or used
      if (report.adminEditAllowed && report.adminEditAllowedUntil) {
        if (new Date().getTime() > new Date(report.adminEditAllowedUntil).getTime()) {
          report.adminEditAllowed = false;
        }
      }

      await report.save();

      // Log edit history
      if (editedFields.length > 0) {
        await ReportEditHistory.create({
          reportId: report._id,
          userId: report.userId,
          callerName: report.callerName,
          editedFields,
          previousData,
          newData,
          editedBy: user.id as any,
          editorName: user.name,
          editReason: user.role === 'admin' ? 'Admin updated report' : 'Caller updated daily report'
        });
      }

      await logActivity({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'UPDATE_REPORT',
        details: `Updated daily work report for ${report.callerName} (${report.reportDate.toISOString().substring(0, 10)})`
      });

      const updatedEditState = computeReportEditState(report, user.role, user.id);
      const responsePayload = { ...report.toObject(), editState: updatedEditState };

      emitToUser(report.userId.toString(), 'report_updated', responsePayload);
      emitToAdmin('report_updated', responsePayload);

      return res.json({
        success: true,
        message: 'Daily report updated successfully',
        report: responsePayload
      });
    }

    // Create New Daily Report
    report = await DailyReport.create({
      userId: targetUser.id as any,
      callerName: targetUser.name,
      callerEmail: targetUser.email,
      reportDate: dateToUse,
      totalCalls: totalCalls || 0,
      connectedCalls: connectedCalls || 0,
      notPickedCalls: notPickedCalls || 0,
      followUpsDone: followUpsDone || 0,
      followUpsPending: followUpsPending || 0,
      interestedClients: interestedClients || 0,
      convertedClients: convertedClients || 0,
      notInterestedClients: notInterestedClients || 0,
      meetingsScheduled: meetingsScheduled || 0,
      whatsappMessagesSent: whatsappMessagesSent || 0,
      remarks: remarks || '',
      isEditLocked: false,
      adminEditAllowed: false
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'SUBMIT_REPORT',
      details: `Submitted daily work report for ${targetUser.name} (${dateToUse.toISOString().substring(0, 10)})`
    });

    const editState = computeReportEditState(report, user.role, user.id);
    const responsePayload = { ...report.toObject(), editState };

    emitToUser(targetUser.id, 'report_created', responsePayload);
    emitToAdmin('report_created', responsePayload);

    res.status(201).json({
      success: true,
      message: 'Daily work report submitted successfully',
      report: responsePayload
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const unlockReportFor10Mins = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user!;

    const report = await DailyReport.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Daily report not found' });
    }

    // Set 10 minutes unlock window
    const unlockUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    report.adminEditAllowed = true;
    report.adminEditAllowedUntil = unlockUntil;
    report.isEditLocked = false;
    await report.save();

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'UNLOCK_REPORT',
      details: `Admin unlocked report editing for ${report.callerName} for 10 minutes`
    });

    const editState = computeReportEditState(report, 'caller', report.userId.toString());
    const responsePayload = { ...report.toObject(), editState };

    emitToUser(report.userId.toString(), 'report_unlocked', responsePayload);
    emitToAdmin('report_unlocked', responsePayload);

    res.json({
      success: true,
      message: `Temporary 10-minute edit access granted to ${report.callerName}`,
      report: responsePayload
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const lockReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user!;

    const report = await DailyReport.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Daily report not found' });
    }

    report.adminEditAllowed = false;
    report.adminEditAllowedUntil = undefined;
    report.isEditLocked = true;
    await report.save();

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'LOCK_REPORT',
      details: `Admin manually locked report editing for ${report.callerName}`
    });

    const editState = computeReportEditState(report, 'caller', report.userId.toString());
    const responsePayload = { ...report.toObject(), editState };

    emitToUser(report.userId.toString(), 'report_locked', responsePayload);
    emitToAdmin('report_locked', responsePayload);

    res.json({
      success: true,
      message: `Report locked for ${report.callerName}`,
      report: responsePayload
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const deleteReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user!;

    const report = await DailyReport.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    await DailyReport.findByIdAndDelete(id);
    await ReportEditHistory.deleteMany({ reportId: id });

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'DELETE_REPORT',
      details: `Deleted daily work report for ${report.callerName} (${report.reportDate.toISOString().substring(0, 10)})`
    });

    emitToUser(report.userId.toString(), 'report_deleted', { reportId: id });
    emitToAdmin('report_deleted', { reportId: id });

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getReportEditHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const history = await ReportEditHistory.find({ reportId: id }).sort({ editedAt: -1 });
    res.json({ success: true, history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getReportAuditTrail = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { callerId, date, page = 1, limit = 50 } = req.query;

    const filter: any = {};

    if (user.role === 'caller') {
      filter.userId = user.id;
    } else if (user.role === 'admin' && callerId) {
      filter.userId = callerId;
    }

    if (date) filter.date = String(date);

    const skip = (Number(page) - 1) * Number(limit);
    const [audits, total] = await Promise.all([
      ReportAudit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ReportAudit.countDocuments(filter)
    ]);

    res.json({
      success: true,
      audits,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// --- NEW LEAD DAILY REPORT & AUDIT CONTROLLERS ---
export const getNewLeadReports = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { callerId, filterRange, startDate, endDate, page = 1, limit = 50 } = req.query;

    const matchFilter: any = {};

    if (user.role === 'caller') {
      matchFilter.userId = new mongoose.Types.ObjectId(user.id);
    } else if (user.role === 'admin' && callerId) {
      matchFilter.userId = new mongoose.Types.ObjectId(callerId as string);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filterRange === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      matchFilter.date = todayStr;
    } else if (filterRange === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().split('T')[0];
      matchFilter.date = yestStr;
    } else if (filterRange === 'last7days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      matchFilter.createdAt = { $gte: past };
    } else if (filterRange === 'last15days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 15);
      matchFilter.createdAt = { $gte: past };
    } else if (filterRange === 'last30days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      matchFilter.createdAt = { $gte: past };
    } else if (filterRange === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      matchFilter.createdAt = { $gte: firstDay };
    } else if (filterRange === 'custom' && startDate && endDate) {
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      matchFilter.createdAt = {
        $gte: start,
        $lte: end
      };
    }

    const pipeline: any[] = [
      { $match: matchFilter },
      // Group by caller, date, and lead to deduplicate same-day activities on the same lead
      {
        $group: {
          _id: {
            userId: "$userId",
            date: "$date",
            leadId: "$leadId"
          },
          callerName: { $first: "$callerName" },
          callerEmail: { $first: "$callerEmail" },
          hasCall: { $max: 1 },
          hasConnected: {
            $max: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$updatedStatus", "Not Picked"] },
                    { $ne: ["$updatedStatus", "New"] },
                    { $ne: ["$activityType", "Not Picked"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          hasNotPicked: {
            $max: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$updatedStatus", "Not Picked"] },
                    { $eq: ["$activityType", "Not Picked"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          hasNotInterested: {
            $max: {
              $cond: [
                { $eq: ["$updatedStatus", "Not Interested"] },
                1,
                0
              ]
            }
          },
          hasWhatsApp: {
            $max: {
              $cond: [
                { $eq: ["$whatsAppStatus", "Yes"] },
                1,
                0
              ]
            }
          },
          hasFollowUp: {
            $max: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$updatedStatus", "Follow-up"] },
                    { $eq: ["$activityType", "Follow-up"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          hasMeeting: {
            $max: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$updatedStatus", "Meeting Scheduled"] },
                    { $eq: ["$activityType", "Meeting"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          hasConverted: {
            $max: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$updatedStatus", "Converted"] },
                    { $eq: ["$activityType", "Converted"] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      // Group by caller and date to aggregate final metrics
      {
        $group: {
          _id: {
            userId: "$_id.userId",
            date: "$_id.date"
          },
          callerName: { $first: "$callerName" },
          callerEmail: { $first: "$callerEmail" },
          totalCalls: { $sum: "$hasCall" },
          connectedCalls: { $sum: "$hasConnected" },
          notPickedCalls: { $sum: "$hasNotPicked" },
          notInterestedLeads: { $sum: "$hasNotInterested" },
          whatsAppSent: { $sum: "$hasWhatsApp" },
          followUp: { $sum: "$hasFollowUp" },
          meetingsScheduled: { $sum: "$hasMeeting" },
          convertedClients: { $sum: "$hasConverted" }
        }
      },
      {
        $project: {
          _id: { $concat: [{ $toString: "$_id.userId" }, "_", "$_id.date"] },
          userId: "$_id.userId",
          dateString: "$_id.date",
          callerName: 1,
          callerEmail: 1,
          reportDate: {
            $dateFromString: {
              dateString: "$_id.date",
              format: "%Y-%m-%d",
              onError: new Date(),
              onNull: new Date()
            }
          },
          totalCalls: 1,
          connectedCalls: 1,
          notPickedCalls: 1,
          notInterestedLeads: 1,
          whatsAppSent: 1,
          followUp: 1,
          meetingsScheduled: 1,
          convertedClients: 1
        }
      },
      { $sort: { dateString: -1 } }
    ];

    const results = await NewLeadReportAudit.aggregate(pipeline);
    const total = results.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedReports = results.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      reports: paginatedReports,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getExistingLeadReports = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { callerId, filterRange, startDate, endDate, page = 1, limit = 50 } = req.query;

    const matchFilter: any = {};

    if (user.role === 'caller') {
      matchFilter.userId = new mongoose.Types.ObjectId(user.id);
    } else if (user.role === 'admin' && callerId) {
      matchFilter.userId = new mongoose.Types.ObjectId(callerId as string);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filterRange === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      matchFilter.date = todayStr;
    } else if (filterRange === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().split('T')[0];
      matchFilter.date = yestStr;
    } else if (filterRange === 'last7days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      matchFilter.createdAt = { $gte: past };
    } else if (filterRange === 'last15days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 15);
      matchFilter.createdAt = { $gte: past };
    } else if (filterRange === 'last30days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      matchFilter.createdAt = { $gte: past };
    } else if (filterRange === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      matchFilter.createdAt = { $gte: firstDay };
    } else if (filterRange === 'custom' && startDate && endDate) {
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      matchFilter.createdAt = {
        $gte: start,
        $lte: end
      };
    }

    const pipeline: any[] = [
      { $match: matchFilter },
      // Group by caller, date, and lead to deduplicate same-day activities on the same lead
      {
        $group: {
          _id: {
            userId: "$userId",
            date: "$date",
            leadId: "$leadId"
          },
          callerName: { $first: "$callerName" },
          callerEmail: { $first: "$callerEmail" },
          hasCall: { $max: 1 },
          hasConnected: {
            $max: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$updatedStatus", "Not Picked"] },
                    { $ne: ["$updatedStatus", "New"] },
                    { $ne: ["$activityType", "Not Picked"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          hasNotPicked: {
            $max: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$updatedStatus", "Not Picked"] },
                    { $eq: ["$activityType", "Not Picked"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          hasNotInterested: {
            $max: {
              $cond: [
                { $eq: ["$updatedStatus", "Not Interested"] },
                1,
                0
              ]
            }
          },
          hasWhatsApp: {
            $max: {
              $cond: [
                { $eq: ["$whatsAppStatus", "Yes"] },
                1,
                0
              ]
            }
          },
          hasFollowUp: {
            $max: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$updatedStatus", "Follow-up"] },
                    { $eq: ["$activityType", "Follow-up"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          hasMeeting: {
            $max: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$updatedStatus", "Meeting Scheduled"] },
                    { $eq: ["$activityType", "Meeting"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          hasConverted: {
            $max: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$updatedStatus", "Converted"] },
                    { $eq: ["$activityType", "Converted"] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      // Group by caller and date to aggregate final metrics
      {
        $group: {
          _id: {
            userId: "$_id.userId",
            date: "$_id.date"
          },
          callerName: { $first: "$callerName" },
          callerEmail: { $first: "$callerEmail" },
          totalCalls: { $sum: "$hasCall" },
          connectedCalls: { $sum: "$hasConnected" },
          notPickedCalls: { $sum: "$hasNotPicked" },
          notInterestedLeads: { $sum: "$hasNotInterested" },
          whatsAppSent: { $sum: "$hasWhatsApp" },
          followUp: { $sum: "$hasFollowUp" },
          meetingsScheduled: { $sum: "$hasMeeting" },
          convertedClients: { $sum: "$hasConverted" }
        }
      },
      {
        $project: {
          _id: { $concat: [{ $toString: "$_id.userId" }, "_", "$_id.date"] },
          userId: "$_id.userId",
          dateString: "$_id.date",
          callerName: 1,
          callerEmail: 1,
          reportDate: {
            $dateFromString: {
              dateString: "$_id.date",
              format: "%Y-%m-%d",
              onError: new Date(),
              onNull: new Date()
            }
          },
          totalCalls: 1,
          connectedCalls: 1,
          notPickedCalls: 1,
          notInterestedLeads: 1,
          whatsAppSent: 1,
          followUp: 1,
          meetingsScheduled: 1,
          convertedClients: 1
        }
      },
      { $sort: { dateString: -1 } }
    ];

    const results = await ExistingLeadReportAudit.aggregate(pipeline);
    const total = results.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedReports = results.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      reports: paginatedReports,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getNewLeadReportAudits = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { callerId, date, page = 1, limit = 50 } = req.query;

    const filter: any = {};

    if (user.role === 'caller') {
      filter.userId = user.id;
    } else if (user.role === 'admin' && callerId) {
      filter.userId = callerId;
    }

    if (date) filter.date = String(date);

    const skip = (Number(page) - 1) * Number(limit);
    const [audits, total] = await Promise.all([
      NewLeadReportAudit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      NewLeadReportAudit.countDocuments(filter)
    ]);

    res.json({
      success: true,
      audits,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getExistingLeadReportAudits = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { callerId, date, page = 1, limit = 50 } = req.query;

    const filter: any = {};

    if (user.role === 'caller') {
      filter.userId = user.id;
    } else if (user.role === 'admin' && callerId) {
      filter.userId = callerId;
    }

    if (date) filter.date = String(date);

    const skip = (Number(page) - 1) * Number(limit);
    const [audits, total] = await Promise.all([
      ExistingLeadReportAudit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ExistingLeadReportAudit.countDocuments(filter)
    ]);

    res.json({
      success: true,
      audits,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
