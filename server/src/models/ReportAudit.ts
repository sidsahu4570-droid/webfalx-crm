import { Schema, model, Document, Types } from 'mongoose';

export interface IReportAudit extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  callerName: string;
  callerEmail: string;
  leadId: Types.ObjectId;
  leadName: string;
  company?: string;
  leadType: 'New Lead' | 'Old Lead';
  previousStatus?: string;
  updatedStatus?: string;
  whatsAppSent: boolean;
  activityType: string;
  date: string;
  time: string;
  editedBy: string;
  editNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const reportAuditSchema = new Schema<IReportAudit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    callerName: { type: String, required: true },
    callerEmail: { type: String, required: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    leadName: { type: String, required: true },
    company: { type: String },
    leadType: { type: String, enum: ['New Lead', 'Old Lead'], required: true },
    previousStatus: { type: String },
    updatedStatus: { type: String },
    whatsAppSent: { type: Boolean, default: false },
    activityType: { type: String, required: true },
    date: { type: String, required: true, index: true },
    time: { type: String, required: true },
    editedBy: { type: String, required: true },
    editNumber: { type: Number, default: 1 }
  },
  { timestamps: true }
);

export const ReportAudit = model<IReportAudit>('ReportAudit', reportAuditSchema);
