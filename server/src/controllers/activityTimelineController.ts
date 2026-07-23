import { Request, Response } from 'express';
import { ActivityTimeline } from '../models/ActivityTimeline';

export const createTimelineEvent = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { entityId, entityType, action, description, metadata } = req.body;

    if (!entityId || !entityType || !action || !description) {
      return res.status(400).json({ success: false, message: 'entityId, entityType, action, description required' });
    }

    const event = await ActivityTimeline.create({
      entityId,
      entityType,
      action,
      description,
      performedBy: user.name,
      performedByRole: user.role,
      metadata: metadata || {}
    });

    res.status(201).json({ success: true, event });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTimelineForEntity = async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    const timeline = await ActivityTimeline.find({ entityId }).sort({ createdAt: -1 });
    res.json({ success: true, timeline });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
