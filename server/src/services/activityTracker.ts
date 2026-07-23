import { DailyReport } from '../models/DailyReport';
import { ReportAudit } from '../models/ReportAudit';
import { NewLeadDailyReport } from '../models/NewLeadDailyReport';
import { ExistingLeadDailyReport } from '../models/ExistingLeadDailyReport';
import { NewLeadReportAudit } from '../models/NewLeadReportAudit';
import { ExistingLeadReportAudit } from '../models/ExistingLeadReportAudit';
import { WhatsAppLog } from '../models/WhatsAppLog';
import { emitToAdmin, emitToUser } from '../socket/socketHandler';

interface RecordActivityParams {
  userId: string;
  callerName: string;
  callerEmail: string;
  leadId: string;
  leadName: string;
  company?: string;
  isNewLead: boolean;
  previousStatus?: string;
  updatedStatus?: string;
  whatsAppSent: boolean;
  activityType: 'Call' | 'Status Update' | 'Follow-up' | 'Meeting' | 'WhatsApp' | 'Converted' | 'Not Picked';
  notes?: string;
}

export const recordLeadActivity = async (params: RecordActivityParams) => {
  try {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const timeString = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const whatsAppStatus: 'Yes' | 'No' = params.whatsAppSent ? 'Yes' : 'No';

    // 1. Log WhatsApp entry if sent
    if (params.whatsAppSent) {
      await WhatsAppLog.create({
        leadId: params.leadId,
        callerId: params.userId,
        callerName: params.callerName,
        phone: 'Registered Contact',
        message: params.notes || `WhatsApp communication logged during ${params.activityType}`,
        status: 'Sent',
        sentAt: today
      }).catch(() => {});
    }

    // 2. ROUTING TO SEPARATE COLLECTIONS BASED ON `isNewLead`
    if (params.isNewLead) {
      // --- NEW LEAD DAILY REPORT ROUTING ---
      let newReport = await NewLeadDailyReport.findOne({ userId: params.userId, dateString });
      if (!newReport) {
        newReport = new NewLeadDailyReport({
          userId: params.userId,
          callerName: params.callerName,
          callerEmail: params.callerEmail,
          reportDate: today,
          dateString
        });
      }

      newReport.totalCalls += 1;
      if (params.updatedStatus === 'Not Picked' || params.activityType === 'Not Picked') {
        newReport.notPickedCalls += 1;
      } else {
        newReport.connectedCalls += 1;
      }

      if (params.whatsAppSent) newReport.whatsAppSent += 1;
      else newReport.whatsAppNotSent += 1;

      if (params.updatedStatus === 'Interested') newReport.interested += 1;
      if (params.updatedStatus === 'Follow-up' || params.activityType === 'Follow-up') newReport.followUp += 1;
      if (params.updatedStatus === 'Meeting Scheduled' || params.activityType === 'Meeting') newReport.meetingsScheduled += 1;
      if (params.updatedStatus === 'Converted' || params.activityType === 'Converted') newReport.convertedClients += 1;
      if (params.updatedStatus === 'Closed') newReport.closedLeads += 1;
      if (params.updatedStatus === 'Not Interested') newReport.notInterestedLeads += 1;

      await newReport.save();

      // --- NEW LEAD AUDIT ---
      await NewLeadReportAudit.create({
        userId: params.userId,
        callerName: params.callerName,
        callerEmail: params.callerEmail,
        leadId: params.leadId,
        leadName: params.leadName,
        company: params.company,
        leadType: 'New Lead',
        previousStatus: params.previousStatus || 'New',
        updatedStatus: params.updatedStatus || 'New',
        whatsAppStatus,
        activityType: params.activityType,
        notes: params.notes,
        date: dateString,
        time: timeString
      });

      emitToUser(params.userId, 'new_lead_report_updated', newReport);
      emitToAdmin('new_lead_report_updated', newReport);
    } else {
      // --- EXISTING LEAD (MY PROSPECTS) DAILY REPORT ROUTING ---
      let existingReport = await ExistingLeadDailyReport.findOne({ userId: params.userId, dateString });
      if (!existingReport) {
        existingReport = new ExistingLeadDailyReport({
          userId: params.userId,
          callerName: params.callerName,
          callerEmail: params.callerEmail,
          reportDate: today,
          dateString
        });
      }

      existingReport.totalCalls += 1;
      if (params.updatedStatus === 'Not Picked' || params.activityType === 'Not Picked') {
        existingReport.notPickedCalls += 1;
      } else {
        existingReport.connectedCalls += 1;
      }

      if (params.whatsAppSent) existingReport.whatsAppSent += 1;
      else existingReport.whatsAppNotSent += 1;

      if (params.updatedStatus === 'Interested') existingReport.interested += 1;
      if (params.updatedStatus === 'Follow-up' || params.activityType === 'Follow-up') existingReport.followUp += 1;
      if (params.updatedStatus === 'Meeting Scheduled' || params.activityType === 'Meeting') existingReport.meetingsScheduled += 1;
      if (params.updatedStatus === 'Converted' || params.activityType === 'Converted') existingReport.convertedClients += 1;
      if (params.updatedStatus === 'Closed') existingReport.closedLeads += 1;
      if (params.updatedStatus === 'Not Interested') existingReport.notInterestedLeads += 1;

      await existingReport.save();

      // --- EXISTING LEAD AUDIT ---
      await ExistingLeadReportAudit.create({
        userId: params.userId,
        callerName: params.callerName,
        callerEmail: params.callerEmail,
        leadId: params.leadId,
        leadName: params.leadName,
        company: params.company,
        leadType: 'Existing Lead',
        previousStatus: params.previousStatus || 'New',
        updatedStatus: params.updatedStatus || 'New',
        whatsAppStatus,
        activityType: params.activityType,
        notes: params.notes,
        date: dateString,
        time: timeString
      });

      emitToUser(params.userId, 'existing_lead_report_updated', existingReport);
      emitToAdmin('existing_lead_report_updated', existingReport);
    }

    // 3. LEGACY REPORT SYNC (Ensures zero breakage of existing analytics/views)
    let legacyReport = await DailyReport.findOne({ userId: params.userId, dateString });
    if (!legacyReport) {
      legacyReport = new DailyReport({
        userId: params.userId,
        callerName: params.callerName,
        callerEmail: params.callerEmail,
        reportDate: today,
        dateString,
        newLeadStats: { callsMade: 0, followUps: 0, statusUpdated: 0, whatsAppMessages: 0, meetings: 0, convertedClients: 0, notPickedCalls: 0 },
        oldLeadStats: { callsMade: 0, followUps: 0, statusUpdated: 0, whatsAppMessages: 0, meetings: 0, convertedClients: 0, notPickedCalls: 0 }
      });
    }

    const categoryKey = params.isNewLead ? 'newLeadStats' : 'oldLeadStats';
    legacyReport[categoryKey].callsMade += 1;
    legacyReport.totalCalls += 1;

    if (params.whatsAppSent) {
      legacyReport[categoryKey].whatsAppMessages += 1;
      legacyReport.whatsappMessagesSent += 1;
    }

    if (params.activityType === 'Follow-up') {
      legacyReport[categoryKey].followUps += 1;
      legacyReport.followUpsDone += 1;
    }

    if (params.activityType === 'Meeting' || params.updatedStatus === 'Meeting Scheduled') {
      legacyReport[categoryKey].meetings += 1;
      legacyReport.meetingsScheduled += 1;
    }

    if (params.activityType === 'Converted' || params.updatedStatus === 'Converted') {
      legacyReport[categoryKey].convertedClients += 1;
      legacyReport.convertedClients += 1;
    }

    if (params.activityType === 'Not Picked' || params.updatedStatus === 'Not Picked') {
      legacyReport[categoryKey].notPickedCalls += 1;
      legacyReport.notPickedCalls += 1;
    }

    await legacyReport.save();

    const auditCount = await ReportAudit.countDocuments({ leadId: params.leadId });
    await ReportAudit.create({
      userId: params.userId,
      callerName: params.callerName,
      callerEmail: params.callerEmail,
      leadId: params.leadId,
      leadName: params.leadName,
      company: params.company,
      leadType: params.isNewLead ? 'New Lead' : 'Old Lead',
      previousStatus: params.previousStatus,
      updatedStatus: params.updatedStatus,
      whatsAppSent: params.whatsAppSent,
      activityType: params.activityType,
      date: dateString,
      time: timeString,
      editedBy: params.callerName,
      editNumber: auditCount + 1
    }).catch(() => {});

    emitToUser(params.userId, 'report_updated', legacyReport);
    emitToAdmin('report_updated', legacyReport);
  } catch (error) {
    console.error('[Activity Tracker Error]', error);
  }
};
