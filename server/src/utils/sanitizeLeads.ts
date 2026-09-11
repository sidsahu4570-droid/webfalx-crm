import { Lead } from '../models/Lead';

export const sanitizeReassignedLeadsInDB = async () => {
  try {
    const affectedLeads = await Lead.find({
      latestUpdate: { $regex: /reassigned/i }
    });

    if (affectedLeads.length === 0) return;

    console.log(`[Sanitize] Cleaning up ${affectedLeads.length} leads with reassignment text in latestUpdate...`);

    for (const lead of affectedLeads) {
      if (lead.notes && lead.notes.length > 0) {
        const sortedNotes = [...lead.notes].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        lead.latestUpdate = sortedNotes[0].content;
        lead.updatedAt = new Date(sortedNotes[0].createdAt);
      } else {
        lead.latestUpdate = 'Lead created';
        lead.updatedAt = lead.createdAt ? new Date(lead.createdAt) : new Date();
      }

      await lead.save({ timestamps: false });
    }

    console.log(`[Sanitize] Successfully restored genuine latestUpdate and updatedAt for ${affectedLeads.length} leads.`);
  } catch (err) {
    console.error('[Sanitize Error] Failed to sanitize reassigned leads:', err);
  }
};
