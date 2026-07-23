import { Request, Response } from 'express';
import { Lead, LeadStatus, LeadPriority } from '../models/Lead';
import { DeletedRecord } from '../models/DeletedRecord';
import { User } from '../models/User';
import { ImportHistory } from '../models/ImportHistory';
import { CallLog } from '../models/CallLog';
import { LeadCategory } from '../models/LeadCategory';
import { City } from '../models/City';
import { logActivity } from '../services/activityService';
import { recordLeadActivity } from '../services/activityTracker';
import { emitToUser, emitToAdmin } from '../socket/socketHandler';

export const getLeads = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      search,
      status,
      priority,
      isNewLead,
      leadType,
      dueFollowUp,
      callerId,
      serialNumber,
      serialNumberStart,
      serialNumberEnd,
      sortBy = 'updatedAt',
      order = 'desc',
      page = 1,
      limit = 50,
      categoryId,
      cityId
    } = req.query;

    const query: any = {};

    if (categoryId && categoryId !== 'All') {
      if (Array.isArray(categoryId)) {
        query.categoryId = { $in: categoryId };
      } else if (typeof categoryId === 'string' && categoryId.includes(',')) {
        query.categoryId = { $in: categoryId.split(',') };
      } else {
        query.categoryId = categoryId;
      }
    }

    if (cityId && cityId !== 'All') {
      if (Array.isArray(cityId)) {
        query.cityId = { $in: cityId };
      } else if (typeof cityId === 'string' && cityId.includes(',')) {
        query.cityId = { $in: cityId.split(',') };
      } else {
        query.cityId = cityId;
      }
    }

    // Enforce role-based scoping
    if (user.role === 'caller') {
      query.userId = user.id;
    } else if (user.role === 'admin' && callerId) {
      query.userId = callerId;
    }

    // Strict Segregation Rule:
    if (isNewLead === 'true') {
      query.isNewLead = true;
    } else if (isNewLead === 'all') {
      // Explicit admin request for all leads
    } else {
      query.isNewLead = false;
    }

    // Lead Type filter
    if (leadType && leadType !== 'All') {
      query.leadType = leadType;
    }

    // Status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    // Priority filter
    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    // Due Follow-up filter
    if (dueFollowUp === 'true') {
      query.nextFollowUpDate = { $lte: new Date() };
    }

    // Serial Number Filter
    if (serialNumber) {
      query.serialNumber = Number(serialNumber);
    } else if (serialNumberStart || serialNumberEnd) {
      query.serialNumber = {};
      if (serialNumberStart) query.serialNumber.$gte = Number(serialNumberStart);
      if (serialNumberEnd) query.serialNumber.$lte = Number(serialNumberEnd);
    }

    // Search query (Supports Serial Number, Name, Company, Email, Phone)
    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = search.trim();
      const searchRegex = new RegExp(term, 'i');
      query.$or = [
        { name: searchRegex },
        { company: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];

      // If search string is numeric, also include exact serial number match
      if (!isNaN(Number(term))) {
        query.$or.push({ serialNumber: Number(term) });
      }
    }

    // Sorting
    let sortOptions: any = { updatedAt: -1 };
    if (sortBy === 'serialNumber') sortOptions = { serialNumber: order === 'asc' ? 1 : -1 };
    else if (sortBy === 'nextFollowUp') sortOptions = { nextFollowUpDate: order === 'asc' ? 1 : -1 };
    else if (sortBy === 'lastContact') sortOptions = { lastContactDate: order === 'asc' ? 1 : -1 };
    else if (sortBy === 'newest') sortOptions = { createdAt: -1 };
    else if (sortBy === 'name') sortOptions = { name: order === 'desc' ? -1 : 1 };

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const totalLeads = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      leads,
      pagination: {
        total: totalLeads,
        page: pageNum,
        pages: Math.ceil(totalLeads / limitNum) || 1,
        limit: limitNum
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getLeadById = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (user.role === 'caller' && lead.userId.toString() !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this lead' });
    }

    res.json({ success: true, lead });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const createLead = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      serialNumber,
      name,
      company,
      email,
      phone,
      address,
      source,
      status,
      priority,
      nextFollowUpDate,
      initialNote,
      assignedUserId,
      categoryId,
      cityId
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Prospect name is required' });
    }

    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Lead Category is required' });
    }

    if (!cityId) {
      return res.status(400).json({ success: false, message: 'City is required' });
    }

    const categoryDoc = await LeadCategory.findById(categoryId);
    if (!categoryDoc) {
      return res.status(404).json({ success: false, message: 'Invalid lead category selected' });
    }

    const cityDoc = await City.findById(cityId);
    if (!cityDoc) {
      return res.status(404).json({ success: false, message: 'Invalid city selected' });
    }

    let targetUserId = user.id;
    let callerName = user.name;
    let callerEmail = user.email;

    if (user.role === 'admin' && assignedUserId) {
      const assignedUser = await User.findById(assignedUserId);
      if (assignedUser) {
        targetUserId = assignedUser._id.toString();
        callerName = assignedUser.name;
        callerEmail = assignedUser.email;
      }
    }

    // Auto-calculate next available Serial Number if not provided
    let sNo = serialNumber ? Number(serialNumber) : undefined;
    if (!sNo) {
      const maxLead = await Lead.findOne({ serialNumber: { $exists: true, $ne: null } }).sort({ serialNumber: -1 });
      sNo = maxLead && maxLead.serialNumber ? maxLead.serialNumber + 1 : 1;
    }

    const notes = [];
    let latestUpdate = 'Lead created';

    if (initialNote && initialNote.trim()) {
      latestUpdate = initialNote.trim();
      notes.push({
        content: initialNote.trim(),
        createdBy: user.id as any,
        createdByName: user.name,
        createdAt: new Date()
      });
    }

    const lead = await Lead.create({
      serialNumber: sNo,
      userId: targetUserId as any,
      callerName,
      callerEmail,
      leadType: 'manual',
      isNewLead: false, // Manual leads go directly to active Leads
      name,
      company: company || '',
      email: email || '',
      phone: phone || '',
      address: address || '',
      source: source || 'Manual Entry',
      status: status || 'New',
      priority: priority || 'Medium',
      categoryId: categoryDoc._id,
      categoryName: categoryDoc.name,
      cityId: cityDoc._id,
      cityName: cityDoc.name,
      notes,
      latestUpdate,
      completedFollowUps: 0,
      lastContactDate: new Date(),
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : undefined
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'CREATE_LEAD',
      leadId: lead._id.toString(),
      leadName: lead.name,
      details: `Added new prospect #${lead.serialNumber}: ${lead.name} (${lead.status})`
    });

    emitToUser(targetUserId, 'lead_created', lead);
    emitToAdmin('lead_created', lead);

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateLead = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const {
      serialNumber,
      name,
      company,
      email,
      phone,
      address,
      source,
      status,
      priority,
      nextFollowUpDate,
      categoryId,
      cityId
    } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (user.role === 'caller' && lead.userId.toString() !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this lead' });
    }

    const previousStatus = lead.status;

    if (serialNumber !== undefined) lead.serialNumber = Number(serialNumber);
    if (name) lead.name = name;
    if (company !== undefined) lead.company = company;
    if (email !== undefined) lead.email = email;
    if (phone !== undefined) lead.phone = phone;
    if (address !== undefined) lead.address = address;
    if (source) lead.source = source;
    if (priority) lead.priority = priority;
    if (nextFollowUpDate !== undefined) {
      lead.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : undefined;
    }

    if (categoryId) {
      const categoryDoc = await LeadCategory.findById(categoryId);
      if (categoryDoc) {
        lead.categoryId = categoryDoc._id;
        lead.categoryName = categoryDoc.name;
      }
    }

    if (cityId) {
      const cityDoc = await City.findById(cityId);
      if (cityDoc) {
        lead.cityId = cityDoc._id;
        lead.cityName = cityDoc.name;
      }
    }

    const wasNewLead = lead.isNewLead;

    if (status && status !== lead.status) {
      lead.status = status as LeadStatus;
      lead.latestUpdate = `Status changed to ${status}`;
      lead.lastContactDate = new Date();
    }

    // Automatically transition New Lead -> Old Lead after first activity
    if (lead.isNewLead) {
      lead.isNewLead = false;
    }

    await lead.save();

    // Auto-record lead activity in Daily Report & Report Audit Trail
    const whatsAppSent = req.body.whatsAppSent === true || req.body.whatsAppSent === 'Yes' || req.body.isWhatsApp === true;
    await recordLeadActivity({
      userId: user.id,
      callerName: user.name,
      callerEmail: user.email,
      leadId: lead._id.toString(),
      leadName: lead.name,
      company: lead.company,
      isNewLead: wasNewLead,
      previousStatus,
      updatedStatus: lead.status,
      whatsAppSent,
      activityType: lead.status === 'Not Picked' ? 'Not Picked' : lead.status === 'Converted' ? 'Converted' : 'Call',
      notes: lead.latestUpdate
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: previousStatus !== lead.status ? 'STATUS_CHANGE' : 'UPDATE_LEAD',
      leadId: lead._id.toString(),
      leadName: lead.name,
      details: previousStatus !== lead.status
        ? `Status changed from ${previousStatus} to ${lead.status}`
        : `Updated prospect details for #${lead.serialNumber} ${lead.name}`
    });

    emitToUser(lead.userId.toString(), 'lead_updated', lead);
    emitToAdmin('lead_updated', lead);

    res.json({
      success: true,
      message: 'Lead updated successfully',
      lead
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const deleteLead = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (user.role === 'caller' && lead.userId.toString() !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this lead' });
    }

    const targetUserId = lead.userId.toString();
    const leadName = lead.name;

    // Soft Delete: Save snapshot to DeletedRecord
    await DeletedRecord.create({
      originalId: lead._id.toString(),
      collectionName: 'Lead',
      clientName: lead.name,
      company: lead.company || '',
      phone: lead.phone || '',
      email: lead.email || '',
      deletionDate: new Date(),
      deletedBy: user.name,
      deletedByRole: user.role,
      deletionReason: 'Deleted by user',
      data: lead.toObject()
    });

    await Lead.findByIdAndDelete(id);

    await logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'DELETE_LEAD',
      leadId: id,
      leadName,
      details: `Moved lead ${leadName} to Trash History`
    });

    emitToUser(targetUserId, 'lead_deleted', { leadId: id });
    emitToAdmin('lead_deleted', { leadId: id });

    res.json({ success: true, message: 'Lead moved to Trash History successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const addNote = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { content, status, nextFollowUpDate, isWhatsApp } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Conversation update content cannot be empty' });
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (user.role === 'caller' && lead.userId.toString() !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this lead' });
    }

    const followUpDateObj = nextFollowUpDate ? new Date(nextFollowUpDate) : undefined;
    const newStatus = status || lead.status;

    const note = {
      content: content.trim(),
      createdBy: user.id as any,
      createdByName: user.name,
      status: newStatus,
      followUpDate: followUpDateObj,
      isWhatsApp: !!isWhatsApp,
      createdAt: new Date()
    };

    const previousStatus = lead.status;
    const wasNewLead = lead.isNewLead;

    lead.notes.unshift(note as any);
    lead.latestUpdate = content.trim();
    lead.lastContactDate = new Date();
    lead.status = newStatus;
    if (followUpDateObj !== undefined) {
      lead.nextFollowUpDate = followUpDateObj;
    }

    // Automatically transition New Lead -> Old Lead after first activity
    if (lead.isNewLead) {
      lead.isNewLead = false;
    }

    await lead.save();

    // Auto-record activity in Daily Report & Report Audit Trail
    const whatsAppSent = req.body.whatsAppSent === true || req.body.whatsAppSent === 'Yes' || !!isWhatsApp;
    await recordLeadActivity({
      userId: user.id,
      callerName: user.name,
      callerEmail: user.email,
      leadId: lead._id.toString(),
      leadName: lead.name,
      company: lead.company,
      isNewLead: wasNewLead,
      previousStatus,
      updatedStatus: lead.status,
      whatsAppSent,
      activityType: lead.status === 'Not Picked' ? 'Not Picked' : lead.status === 'Converted' ? 'Converted' : 'Call',
      notes: content.trim()
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'NOTE_ADDED',
      leadId: lead._id.toString(),
      leadName: lead.name,
      details: `Added conversation update: "${content.trim().substring(0, 40)}..." (${newStatus})`
    });

    emitToUser(lead.userId.toString(), 'lead_updated', lead);
    emitToAdmin('lead_updated', lead);

    res.json({
      success: true,
      message: 'Conversation update added successfully',
      lead
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const completeFollowUp = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { nextFollowUpDate } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (user.role === 'caller' && lead.userId.toString() !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this lead' });
    }

    lead.completedFollowUps += 1;
    lead.lastContactDate = new Date();
    lead.latestUpdate = `Completed follow-up #${lead.completedFollowUps}`;
    lead.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : undefined;

    // First Update Rule: Automatically move lead from New Leads (isNewLead: true) to Leads (isNewLead: false)
    if (lead.isNewLead) {
      lead.isNewLead = false;
    }

    await lead.save();

    await logActivity({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'FOLLOWUP_COMPLETED',
      leadId: lead._id.toString(),
      leadName: lead.name,
      details: `Marked follow-up as completed for ${lead.name}`
    });

    emitToUser(lead.userId.toString(), 'lead_updated', lead);
    emitToAdmin('lead_updated', lead);

    res.json({
      success: true,
      message: 'Follow-up marked as completed',
      lead
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Excel / CSV Import & Caller Assignment System with S. No. Support
export const importExcelLeads = async (req: Request, res: Response) => {
  try {
    const adminUser = req.user!;
    const {
      fileName = 'Imported_Leads.xlsx',
      assignedCallerId,
      duplicateAction = 'skip', // 'skip' | 'update'
      leads: rawLeads,
      categoryId,
      cityId
    } = req.body;

    if (!assignedCallerId) {
      return res.status(400).json({ success: false, message: 'Please select a caller to assign imported leads' });
    }

    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Please select a lead category for imported leads' });
    }

    if (!cityId) {
      return res.status(400).json({ success: false, message: 'Please select a city for imported leads' });
    }

    const categoryDoc = await LeadCategory.findById(categoryId);
    if (!categoryDoc) {
      return res.status(404).json({ success: false, message: 'Invalid category selected for import' });
    }

    const cityDoc = await City.findById(cityId);
    if (!cityDoc) {
      return res.status(404).json({ success: false, message: 'Invalid city selected for import' });
    }

    if (!Array.isArray(rawLeads) || rawLeads.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid lead rows provided for import' });
    }

    const assignedCaller = await User.findById(assignedCallerId);
    if (!assignedCaller) {
      return res.status(404).json({ success: false, message: 'Assigned caller account not found' });
    }

    let successfulImports = 0;
    let duplicateCount = 0;
    let failedImports = 0;

    // Highest existing serial number fallback generator
    const maxLead = await Lead.findOne({ serialNumber: { $exists: true, $ne: null } }).sort({ serialNumber: -1 });
    let autoSNoCounter = (maxLead && maxLead.serialNumber) ? maxLead.serialNumber + 1 : 1;

    const getNormalizedValue = (item: any, possibleKeys: string[]): any => {
      if (!item || typeof item !== 'object') return undefined;
      const cleanKeys = possibleKeys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
      for (const rawKey of Object.keys(item)) {
        const cleanKey = rawKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanKeys.includes(cleanKey)) {
          return item[rawKey];
        }
      }
      return undefined;
    };

    for (const item of rawLeads) {
      console.log('[DEBUG EXCEL ITEM]', JSON.stringify(item));
      const rawSNo = getNormalizedValue(item, ['sno', 'serialnumber', 'srno', 'slno', 'serial']);
      let sNo: number;
      if (rawSNo !== undefined && rawSNo !== null && !isNaN(Number(rawSNo))) {
        sNo = Number(rawSNo);
      } else {
        sNo = autoSNoCounter++;
      }

      const companyVal = getNormalizedValue(item, ['company', 'companyname', 'organization', 'org']);
      const company = companyVal !== undefined && companyVal !== null ? companyVal.toString().trim() : '';

      const nameVal = getNormalizedValue(item, ['name', 'prospectname', 'clientname', 'fullname', 'prospect', 'client']);
      let name = nameVal !== undefined && nameVal !== null ? nameVal.toString().trim() : '';
      if (!name && company) {
        name = company;
      }

      const phoneVal = getNormalizedValue(item, ['phone', 'phonenumber', 'mobile', 'mobilenumber', 'contact', 'contactnumber', 'telephone']);
      const phone = phoneVal !== undefined && phoneVal !== null ? phoneVal.toString().trim() : '';

      const emailVal = getNormalizedValue(item, ['email', 'emailid', 'emailaddress', 'mail']);
      const email = emailVal !== undefined && emailVal !== null ? emailVal.toString().trim() : '';

      const addressVal = getNormalizedValue(item, ['address', 'city', 'location', 'state', 'country']);
      const address = addressVal !== undefined && addressVal !== null ? addressVal.toString().trim() : '';

      const sourceVal = getNormalizedValue(item, ['source', 'leadsource', 'origin']);
      const source = sourceVal !== undefined && sourceVal !== null ? sourceVal.toString().trim() : 'Excel Import';

      const initialNoteVal = getNormalizedValue(item, ['note', 'notes', 'remark', 'remarks', 'comment', 'comments', 'initialnote', 'description']);
      const initialNote = initialNoteVal !== undefined && initialNoteVal !== null ? initialNoteVal.toString().trim() : '';

      if (!name || (!phone && !email)) {
        failedImports++;
        continue;
      }

      // Check Duplicate by phone or email
      const duplicateQuery: any = { $or: [] };
      if (phone) duplicateQuery.$or.push({ phone: phone.toString().trim() });
      if (email) duplicateQuery.$or.push({ email: email.toString().trim().toLowerCase() });

      let existingLead = null;
      if (duplicateQuery.$or.length > 0) {
        existingLead = await Lead.findOne(duplicateQuery);
      }

      if (existingLead) {
        duplicateCount++;
        if (duplicateAction === 'skip') {
          continue; // Skip duplicate
        } else if (duplicateAction === 'update') {
          // Reassign and update existing lead
          existingLead.serialNumber = sNo;
          existingLead.userId = assignedCaller._id as any;
          existingLead.callerName = assignedCaller.name;
          existingLead.callerEmail = assignedCaller.email;
          existingLead.company = company || existingLead.company;
          existingLead.address = address || existingLead.address;
          existingLead.leadType = 'imported';
          existingLead.isNewLead = true; // Goes into New Leads
          existingLead.categoryId = categoryDoc._id;
          existingLead.categoryName = categoryDoc.name;
          existingLead.cityId = cityDoc._id;
          existingLead.cityName = cityDoc.name;
          existingLead.latestUpdate = `Re-imported via ${fileName}`;
          await existingLead.save();
          successfulImports++;
          continue;
        }
      }

      // Create new imported lead with original S. No.
      const notes = initialNote ? [{
        content: initialNote.toString().trim(),
        createdBy: adminUser.id as any,
        createdByName: adminUser.name,
        createdAt: new Date()
      }] : [];

      await Lead.create({
        serialNumber: sNo,
        userId: assignedCaller._id as any,
        callerName: assignedCaller.name,
        callerEmail: assignedCaller.email,
        leadType: 'imported',
        isNewLead: true, // Automatically placed into New Leads
        name: name.toString().trim(),
        company: company.toString().trim(),
        email: email.toString().trim().toLowerCase(),
        phone: phone.toString().trim(),
        address: address.toString().trim(),
        source: source.toString().trim(),
        status: 'New',
        priority: 'Medium',
        categoryId: categoryDoc._id,
        categoryName: categoryDoc.name,
        cityId: cityDoc._id,
        cityName: cityDoc.name,
        notes,
        latestUpdate: `Imported S. No. ${sNo} from ${fileName}`,
        completedFollowUps: 0,
        lastContactDate: new Date()
      });

      successfulImports++;
    }

    // Save ImportHistory record
    const historyRecord = await ImportHistory.create({
      fileName,
      importedBy: adminUser.name,
      assignedCallerId: assignedCaller._id,
      assignedCallerName: assignedCaller.name,
      assignedCallerEmail: assignedCaller.email,
      totalRows: rawLeads.length,
      successfulImports,
      duplicateCount,
      failedImports,
      duplicateAction
    });

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'IMPORT_EXCEL_LEADS',
      details: `Imported ${successfulImports} leads assigned to ${assignedCaller.name} from file ${fileName}`
    });

    emitToUser(assignedCaller._id.toString(), 'leads_imported', {
      count: successfulImports,
      message: `${successfulImports} new imported leads assigned to you!`
    });
    emitToAdmin('leads_imported', { count: successfulImports, history: historyRecord });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${successfulImports} leads assigned to ${assignedCaller.name}`,
      history: historyRecord
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getImportHistory = async (req: Request, res: Response) => {
  try {
    const history = await ImportHistory.find().sort({ importDate: -1 });
    res.json({ success: true, history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logCallAttempt = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (user.role === 'caller' && lead.userId.toString() !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const callLog = await CallLog.create({
      leadId: lead._id,
      callerId: user.id as any,
      callerName: user.name,
      phone: lead.phone || 'N/A',
      callInitiatedAt: new Date(),
      leadType: lead.isNewLead ? 'New Lead' : 'Existing Lead',
      userRole: user.role
    });

    res.json({
      success: true,
      message: 'Call attempt logged successfully',
      callLog
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
