import mongoose, { Schema, Document } from 'mongoose';

export interface IExistingLeadReportAudit extends Document {
  userId: mongoose.Types.ObjectId;
  callerName: string;
  callerEmail: string;
  leadId: mongoose.Types.ObjectId;
  leadName: string;
  company?: string;
  leadType: 'Existing Lead';
  previousStatus: string;
  updatedStatus: string;
  whatsAppStatus: 'Yes' | 'No';
  activityType: string;
  notes?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  createdAt: Date;
}

const ExistingLeadReportAuditSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    callerName: { type: String, required: true },
    callerEmail: { type: String, required: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    leadName: { type: String, required: true },
    company: { type: String, default: '' },
    leadType: { type: String, default: 'Existing Lead' },
    previousStatus: { type: String, required: true },
    updatedStatus: { type: String, required: true },
    whatsAppStatus: { type: String, enum: ['Yes', 'No'], required: true },
    activityType: { type: String, default: 'Call' },
    notes: { type: String, default: '' },
    date: { type: String, required: true, index: true },
    time: { type: String, required: true }
  },
  { timestamps: true }
);

export const ExistingLeadReportAudit = mongoose.model<IExistingLeadReportAudit>(
  'ExistingLeadReportAudit',
  ExistingLeadReportAuditSchema,
  'existingleadreportaudits'
);
