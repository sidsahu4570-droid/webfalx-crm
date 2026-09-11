import { Lead } from '../models/Lead';
import { ActivityLog } from '../models/ActivityLog';

export const sanitizeLeadDoc = async (lead: any): Promise<boolean> => {
  if (!lead) return false;

  let modified = false;
  const isReassignedText = lead.latestUpdate && /reassigned|reassign/i.test(lead.latestUpdate);

  // 1. Restore genuine latestUpdate text
  if (isReassignedText) {
    let genuineText = '';

    if (lead.notes && lead.notes.length > 0) {
      const sortedNotes = [...lead.notes].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const validNote = sortedNotes.find((n: any) => n.content && !/reassigned/i.test(n.content));
      if (validNote) {
        genuineText = validNote.content;
      }
    }

    if (!genuineText) {
      const genuineActivity = await ActivityLog.findOne({
        leadId: lead._id.toString(),
        action: { $in: ['ADD_NOTE', 'UPDATE_STATUS', 'COMPLETE_FOLLOWUP', 'CREATE_LEAD', 'UPDATE_LEAD'] }
      }).sort({ createdAt: -1 });

      if (genuineActivity) {
        genuineText = genuineActivity.details || `Activity: ${genuineActivity.action}`;
      }
    }

    if (!genuineText) {
      genuineText = 'Lead created';
    }

    lead.latestUpdate = genuineText;
    modified = true;
  }

  // 2. Restore genuine updatedAt timestamp
  let genuineDate: Date | null = null;

  if (lead.notes && lead.notes.length > 0) {
    const sortedNotes = [...lead.notes].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const validNote = sortedNotes.find((n: any) => n.content && !/reassigned/i.test(n.content));
    const targetNote = validNote || sortedNotes[0];
    genuineDate = new Date(targetNote.createdAt);
  } else if (lead.createdAt) {
    genuineDate = new Date(lead.createdAt);
  }

  if (genuineDate) {
    const currentUpdated = new Date(lead.updatedAt).getTime();
    const genuineTime = genuineDate.getTime();

    // If current updatedAt was overwritten by reassignment (more than 10s newer than genuine activity)
    if (isReassignedText || (lead.reassignedAt && currentUpdated > genuineTime + 10000)) {
      lead.updatedAt = genuineDate;
      modified = true;
    }
  }

  if (modified) {
    await lead.save({ timestamps: false });
  }

  return modified;
};

export const sanitizeReassignedLeadsInDB = async () => {
  try {
    const allLeads = await Lead.find({});
    let sanitizedCount = 0;

    for (const lead of allLeads) {
      const fixed = await sanitizeLeadDoc(lead);
      if (fixed) sanitizedCount++;
    }

    if (sanitizedCount > 0) {
      console.log(`[Sanitize] Restored genuine update text & timestamp for ${sanitizedCount} previously reassigned leads.`);
    }
  } catch (err) {
    console.error('[Sanitize Error] Failed to sanitize reassigned leads:', err);
  }
};
