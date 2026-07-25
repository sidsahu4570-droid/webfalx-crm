import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Lead, LeadStatus, LeadPriority } from '../models/Lead';
import { User } from '../models/User';
import { ConvertedClient } from '../models/ConvertedClient';
import { ActivityLog } from '../models/ActivityLog';
import { LeadCategory } from '../models/LeadCategory';
import { City } from '../models/City';
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

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(val => val.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
}

export const importLeadsMigrationController = async (req: Request, res: Response) => {
  try {
    const csvPath = path.join(__dirname, '../../../csv_2_mangodb/Leads.csv');
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ success: false, message: `Leads.csv not found at: ${csvPath}` });
    }

    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length <= 1) {
      return res.status(400).json({ success: false, message: 'CSV file is empty.' });
    }

    const headers = parseCSVLine(lines[0]);

    // Get an admin user to use as default creator for notes if needed
    const defaultAdmin = await User.findOne({ role: 'admin' });
    if (!defaultAdmin) {
      return res.status(500).json({ success: false, message: 'No admin user found to associate note creation logs.' });
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const failedLeadsReport: Array<{ name: string; phone: string; reason: string }> = [];

    // Cache categories, users, cities to avoid hitting database repeatedly in loop
    const categoryCache = new Map<string, any>();
    const userCache = new Map<string, any>();
    const cityCache = new Map<string, any>();

    // Counter for serial numbers
    const maxLead = await Lead.findOne({ serialNumber: { $exists: true, $ne: null } }).sort({ serialNumber: -1 });
    let serialCounter = maxLead && maxLead.serialNumber ? maxLead.serialNumber + 1 : 1;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const fields = parseCSVLine(line);
      if (fields.length < headers.length) {
        continue;
      }

      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = fields[idx];
      });

      const phone = row.phone ? row.phone.trim() : '';
      const name = row.name ? row.name.trim() : '';
      const company = row.company ? row.company.trim() : '';

      if (!name) {
        skipCount++;
        continue;
      }

      // Check duplicate
      let exists = false;
      if (phone) {
        const dupPhone = await Lead.findOne({ phone });
        if (dupPhone) exists = true;
      } else if (name && company) {
        const dupNameCompany = await Lead.findOne({ name, company });
        if (dupNameCompany) exists = true;
      }

      if (exists) {
        skipCount++;
        continue;
      }

      // 1. Resolve Category
      const catName = row.category_name || 'General';
      let categoryId = null;
      let categoryName = catName;
      if (categoryCache.has(catName.toLowerCase())) {
        const cat = categoryCache.get(catName.toLowerCase());
        categoryId = cat._id;
      } else {
        let cat = await LeadCategory.findOne({ name: new RegExp(`^${catName}$`, 'i') });
        if (!cat) {
          cat = await LeadCategory.create({ name: catName });
        }
        categoryCache.set(catName.toLowerCase(), cat);
        categoryId = cat._id;
      }

      // 2. Resolve Caller (User) - Strict match, no auto-creation
      const callerEmail = (row.caller_email || '').trim();
      const callerName = (row.caller_name || '').trim();
      let matchedUser = null;

      if (callerEmail) {
        if (userCache.has(`email:${callerEmail.toLowerCase()}`)) {
          matchedUser = userCache.get(`email:${callerEmail.toLowerCase()}`);
        } else {
          matchedUser = await User.findOne({ email: new RegExp(`^${callerEmail}$`, 'i') });
          if (matchedUser) {
            userCache.set(`email:${callerEmail.toLowerCase()}`, matchedUser);
          }
        }
      }

      if (!matchedUser && callerName) {
        if (userCache.has(`name:${callerName.toLowerCase()}`)) {
          matchedUser = userCache.get(`name:${callerName.toLowerCase()}`);
        } else {
          matchedUser = await User.findOne({ name: new RegExp(`^${callerName}$`, 'i') });
          if (matchedUser) {
            userCache.set(`name:${callerName.toLowerCase()}`, matchedUser);
          }
        }
      }

      if (!matchedUser) {
        errorCount++;
        failedLeadsReport.push({
          name: name || 'Unnamed',
          phone: phone || 'N/A',
          reason: `No matching caller found for email "${callerEmail}" or name "${callerName}".`
        });
        continue;
      }

      const userId = matchedUser._id;
      const finalCallerName = matchedUser.name;
      const finalCallerEmail = matchedUser.email;

      // 3. Resolve City (Read from City column or extract from import details)
      let cityNameInput = row.city || row.city_name || row.cityName || row.City || '';
      
      // Fallback: If no explicit city field, extract from latest_update (e.g. "Imported from Hubli CRM 3.csv")
      if (!cityNameInput && row.latest_update && typeof row.latest_update === 'string') {
        const fileMatch = row.latest_update.match(/Imported from\s+([A-Za-z]+)\s+CRM/i);
        if (fileMatch && fileMatch[1]) {
          cityNameInput = fileMatch[1];
        }
      }
      
      if (!cityNameInput) {
        cityNameInput = 'Hubli';
      }

      const cleanCityName = cityNameInput.trim();
      let cityId = null;
      let cityName = cleanCityName;

      if (cityCache.has(cleanCityName.toLowerCase())) {
        const city = cityCache.get(cleanCityName.toLowerCase());
        cityId = city._id;
      } else {
        let city = await City.findOne({ name: new RegExp(`^${cleanCityName}$`, 'i') });
        if (!city) {
          city = await City.create({ name: cleanCityName });
        }
        cityCache.set(cleanCityName.toLowerCase(), city);
        cityId = city._id;
      }

      // 4. Normalize Status
      let status: LeadStatus = 'New';
      const rawStatus = (row.status || '').toLowerCase();
      if (rawStatus === 'new') status = 'New';
      else if (rawStatus === 'interested') status = 'Interested';
      else if (rawStatus === 'follow-up' || rawStatus === 'followup') status = 'Follow-up';
      else if (rawStatus === 'meeting_scheduled' || rawStatus === 'meeting scheduled') status = 'Meeting Scheduled';
      else if (rawStatus === 'converted') status = 'Converted';
      else if (rawStatus === 'not_interested' || rawStatus === 'not interested') status = 'Not Interested';
      else if (rawStatus === 'closed') status = 'Closed';
      else if (rawStatus === 'not_picked' || rawStatus === 'not picked') status = 'Not Picked';

      // 5. Normalize Priority
      let priority: LeadPriority = 'Medium';
      const rawPriority = (row.priority || '').toLowerCase();
      if (rawPriority === 'low') priority = 'Low';
      else if (rawPriority === 'high') priority = 'High';

      // 6. Parse Notes
      const notesList: any[] = [];
      try {
        if (row.notes) {
          const parsedNotes = JSON.parse(row.notes);
          if (Array.isArray(parsedNotes)) {
            parsedNotes.forEach(n => {
              notesList.push({
                content: n.content || n,
                createdBy: userId || defaultAdmin._id,
                createdByName: finalCallerName || 'System',
                createdAt: n.createdAt ? new Date(n.createdAt) : new Date()
              });
            });
          }
        }
      } catch (e) {
        if (typeof row.notes === 'string' && row.notes.trim()) {
          notesList.push({
            content: row.notes.trim(),
            createdBy: userId || defaultAdmin._id,
            createdByName: finalCallerName || 'System',
            createdAt: new Date()
          });
        }
      }

      const nextFollowUpDate = row.next_follow_up_date && !isNaN(Date.parse(row.next_follow_up_date))
        ? new Date(row.next_follow_up_date)
        : undefined;

      const lastContactDate = row.last_contact_date && !isNaN(Date.parse(row.last_contact_date))
        ? new Date(row.last_contact_date)
        : undefined;

      const createdAt = row.created_date && !isNaN(Date.parse(row.created_date)) ? new Date(row.created_date) : new Date();
      const updatedAt = row.updated_date && !isNaN(Date.parse(row.updated_date)) ? new Date(row.updated_date) : new Date();

      // 7. Create Lead (Direct write to preserve original Created Date and Updated Date timestamps)
      try {
        await Lead.collection.insertOne({
          serialNumber: serialCounter++,
          userId,
          callerName: finalCallerName,
          callerEmail: finalCallerEmail,
          leadType: row.lead_type || 'imported',
          isNewLead: row.is_new_lead === 'true',
          name,
          company,
          email: row.email || '',
          phone,
          address: row.address || '',
          source: row.source || 'CSV Import',
          status,
          priority,
          categoryId,
          categoryName,
          cityId,
          cityName,
          notes: notesList,
          latestUpdate: row.latest_update || 'Lead imported',
          completedFollowUps: parseInt(row.completed_follow_ups, 10) || 0,
          nextFollowUpDate,
          lastContactDate,
          createdAt,
          updatedAt
        });
        successCount++;
      } catch (err) {
        errorCount++;
        failedLeadsReport.push({
          name: name || 'Unnamed',
          phone: phone || 'N/A',
          reason: `Database error: ${(err as any).message}`
        });
      }
    }

    res.json({
      success: true,
      summary: {
        totalRecordsProcessed: lines.length - 1,
        imported: successCount,
        updated: 0,
        skippedDuplicates: skipCount,
        failedRecords: errorCount,
        failureReasons: failedLeadsReport
      }
    });

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error', stack: error.stack });
  }
};
