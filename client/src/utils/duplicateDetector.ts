import { Lead } from '../types';

export type DuplicateConfidence = 'Strong' | 'High' | 'Medium' | 'Possible' | 'None';

export interface DuplicateMatchResult {
  isDuplicate: boolean;
  confidence: DuplicateConfidence;
  matchedLead: Lead | null;
  reason: string;
}

export const detectLeadDuplicate = (
  candidate: { name?: string; phone?: string; email?: string; company?: string },
  existingLeads: Lead[]
): DuplicateMatchResult => {
  const normName = (candidate.name || '').trim().toLowerCase();
  const normPhone = (candidate.phone || '').toString().trim();
  const normEmail = (candidate.email || '').trim().toLowerCase();
  const normCompany = (candidate.company || '').trim().toLowerCase();

  for (const lead of existingLeads) {
    const leadName = (lead.name || '').trim().toLowerCase();
    const leadPhone = (lead.phone || '').toString().trim();
    const leadEmail = (lead.email || '').trim().toLowerCase();
    const leadCompany = (lead.company || '').trim().toLowerCase();

    // Strong Duplicate: Same Name + Same Mobile
    if (normName && normPhone && normName === leadName && normPhone === leadPhone) {
      return {
        isDuplicate: true,
        confidence: 'Strong',
        matchedLead: lead,
        reason: `Exact match found for Name "${lead.name}" and Mobile Number "${lead.phone}"`
      };
    }

    // High Confidence Duplicate: Same Mobile Number
    if (normPhone && normPhone.length >= 7 && normPhone === leadPhone) {
      return {
        isDuplicate: true,
        confidence: 'High',
        matchedLead: lead,
        reason: `Same Mobile Number matched: "${lead.phone}" (Belongs to ${lead.name})`
      };
    }

    // Medium Confidence Duplicate: Same Email
    if (normEmail && normEmail.includes('@') && normEmail === leadEmail) {
      return {
        isDuplicate: true,
        confidence: 'Medium',
        matchedLead: lead,
        reason: `Same Email Address matched: "${lead.email}" (Belongs to ${lead.name})`
      };
    }

    // Possible Duplicate: Same Company Name
    if (normCompany && normCompany.length > 3 && normCompany === leadCompany) {
      return {
        isDuplicate: true,
        confidence: 'Possible',
        matchedLead: lead,
        reason: `Possible duplicate company match: "${lead.company}"`
      };
    }
  }

  return {
    isDuplicate: false,
    confidence: 'None',
    matchedLead: null,
    reason: ''
  };
};
