import { ActivityLog } from '../models/ActivityLog';
import { emitToAdmin, emitToUser } from '../socket/socketHandler';

interface LogActivityParams {
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  leadId?: string;
  leadName?: string;
  details: string;
}

export const logActivity = async (params: LogActivityParams) => {
  try {
    const activity = await ActivityLog.create(params);

    // Emit to admin in real-time
    emitToAdmin('activity_new', activity);
    emitToUser(params.userId, 'activity_new', activity);

    return activity;
  } catch (error) {
    console.error('[ActivityLog Error]', error);
  }
};
