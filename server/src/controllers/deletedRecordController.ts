import { Request, Response } from 'express';
import { DeletedRecord } from '../models/DeletedRecord';
import { Lead } from '../models/Lead';
import { ConvertedClient } from '../models/ConvertedClient';
import { PaymentHistory } from '../models/PaymentHistory';
import { ClientExpenseHistory } from '../models/ClientExpenseHistory';
import { WebsiteUpdate } from '../models/WebsiteUpdate';
import { logActivity } from '../services/activityService';
import { emitToAdmin, emitToUser } from '../socket/socketHandler';

export const getDeletedRecords = async (req: Request, res: Response) => {
  try {
    const { search, collectionName, projectType, callerName, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { clientName: { $regex: String(search), $options: 'i' } },
        { company: { $regex: String(search), $options: 'i' } },
        { phone: { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } }
      ];
    }

    if (collectionName) filter.collectionName = collectionName;
    if (projectType) filter.projectType = projectType;
    if (callerName) filter.callerName = { $regex: String(callerName), $options: 'i' };

    if (startDate || endDate) {
      filter.deletionDate = {};
      if (startDate) filter.deletionDate.$gte = new Date(String(startDate));
      if (endDate) filter.deletionDate.$lte = new Date(String(endDate));
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
      DeletedRecord.find(filter).sort({ deletionDate: -1 }).skip(skip).limit(Number(limit)),
      DeletedRecord.countDocuments(filter)
    ]);

    res.json({
      success: true,
      records,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const restoreDeletedRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user!;

    const deletedRecord = await DeletedRecord.findById(id);
    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: 'Deleted record not found' });
    }

    const originalData = deletedRecord.data || {};

    if (deletedRecord.collectionName === 'Lead') {
      const leadPayload = originalData.lead || originalData;
      await Lead.create(leadPayload);
    } else if (deletedRecord.collectionName === 'ConvertedClient') {
      const clientPayload = originalData.client || originalData;
      await ConvertedClient.create(clientPayload);

      if (Array.isArray(originalData.payments) && originalData.payments.length > 0) {
        await PaymentHistory.insertMany(originalData.payments).catch(() => {});
      }
      if (Array.isArray(originalData.expenses) && originalData.expenses.length > 0) {
        await ClientExpenseHistory.insertMany(originalData.expenses).catch(() => {});
      }
      if (Array.isArray(originalData.websiteUpdates) && originalData.websiteUpdates.length > 0) {
        await WebsiteUpdate.insertMany(originalData.websiteUpdates).catch(() => {});
      }
    }

    await DeletedRecord.findByIdAndDelete(id);

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'RESTORE_RECORD',
      leadName: deletedRecord.clientName,
      details: `Restored ${deletedRecord.collectionName} record for ${deletedRecord.clientName}`
    });

    // Real-Time Socket Broadcast for Immediate Automatic Recalculation Across All Dashboards
    emitToAdmin('record_restored', { collectionName: deletedRecord.collectionName, id: deletedRecord.originalId });
    emitToAdmin('client_created', { collectionName: deletedRecord.collectionName });
    emitToAdmin('converted_client_updated', { collectionName: deletedRecord.collectionName });
    emitToAdmin('revenue_updated', { message: 'Record restored' });
    emitToAdmin('bonus_updated', { message: 'Record restored' });
    emitToAdmin('leaderboard_updated', { message: 'Record restored' });

    res.json({
      success: true,
      message: `${deletedRecord.clientName} restored successfully to active CRM. All revenue and calculations updated.`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const permanentDeleteRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user!;

    const record = await DeletedRecord.findByIdAndDelete(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    await logActivity({
      userId: adminUser.id,
      userName: adminUser.name,
      userEmail: adminUser.email,
      action: 'PERMANENT_DELETE',
      leadName: record.clientName,
      details: `Permanently deleted ${record.clientName} from Trash History`
    });

    res.json({
      success: true,
      message: 'Record permanently purged from database'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
