import { Request, Response } from 'express';
import { WhatsAppLog } from '../models/WhatsAppLog';
import { logActivity } from '../services/activityService';
import { emitToUser, emitToAdmin } from '../socket/socketHandler';

export const logWhatsAppMessage = async (req: Request, res: Response) => {
  try {
    const callerUser = req.user!;
    const { leadId, clientId, phone, message, templateName, status } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone and message content required' });
    }

    const logEntry = await WhatsAppLog.create({
      leadId: leadId || undefined,
      clientId: clientId || undefined,
      callerId: callerUser.id,
      callerName: callerUser.name,
      phone,
      message,
      templateName: templateName || 'Quick Reply',
      status: status || 'Sent',
      sentAt: new Date()
    });

    await logActivity({
      userId: callerUser.id,
      userName: callerUser.name,
      userEmail: callerUser.email,
      action: 'WHATSAPP_SENT',
      leadId: leadId || undefined,
      details: `Sent WhatsApp message via template '${templateName || 'Quick Reply'}' to ${phone}`
    });

    emitToUser(callerUser.id, 'whatsapp_logged', logEntry);
    emitToAdmin('whatsapp_logged', logEntry);

    res.status(201).json({
      success: true,
      message: 'WhatsApp activity logged successfully',
      log: logEntry
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWhatsAppLogs = async (req: Request, res: Response) => {
  try {
    const { leadId, clientId, phone } = req.query;

    const filter: any = {};
    if (leadId) filter.leadId = leadId;
    if (clientId) filter.clientId = clientId;
    if (phone) filter.phone = phone;

    // If caller, only own logs unless admin
    if (req.user!.role === 'caller') {
      filter.callerId = req.user!.id;
    }

    const logs = await WhatsAppLog.find(filter).sort({ sentAt: -1 });
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWhatsAppStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const log = await WhatsAppLog.findByIdAndUpdate(id, { status }, { new: true });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log record not found' });
    }

    res.json({ success: true, log });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
