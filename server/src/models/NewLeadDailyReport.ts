import mongoose, { Schema, Document } from 'mongoose';

export interface INewLeadDailyReport extends Document {
  userId: mongoose.Types.ObjectId;
  callerName: string;
  callerEmail: string;
  reportDate: Date;
  dateString: string; // YYYY-MM-DD
  totalCalls: number;
  connectedCalls: number;
  notPickedCalls: number;
  interested: number;
  followUp: number;
  meetingsScheduled: number;
  meetingsCompleted: number;
  whatsAppSent: number;
  whatsAppNotSent: number;
  convertedClients: number;
  closedLeads: number;
  notInterestedLeads: number;
  summary?: string;
  remarks: string;
  manualEditCount: number;
  isEditLocked: boolean;
  adminEditAllowed: boolean;
  adminEditAllowedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NewLeadDailyReportSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    callerName: { type: String, required: true },
    callerEmail: { type: String, required: true },
    reportDate: { type: Date, required: true, index: true },
    dateString: { type: String, required: true, index: true },
    totalCalls: { type: Number, default: 0 },
    connectedCalls: { type: Number, default: 0 },
    notPickedCalls: { type: Number, default: 0 },
    interested: { type: Number, default: 0 },
    followUp: { type: Number, default: 0 },
    meetingsScheduled: { type: Number, default: 0 },
    meetingsCompleted: { type: Number, default: 0 },
    whatsAppSent: { type: Number, default: 0 },
    whatsAppNotSent: { type: Number, default: 0 },
    convertedClients: { type: Number, default: 0 },
    closedLeads: { type: Number, default: 0 },
    notInterestedLeads: { type: Number, default: 0 },
    summary: { type: String, default: '' },
    remarks: { type: String, default: '' },
    manualEditCount: { type: Number, default: 0 },
    isEditLocked: { type: Boolean, default: false },
    adminEditAllowed: { type: Boolean, default: false },
    adminEditAllowedUntil: { type: Date }
  },
  { timestamps: true }
);

NewLeadDailyReportSchema.index({ userId: 1, dateString: 1 }, { unique: true });

export const NewLeadDailyReport = mongoose.model<INewLeadDailyReport>(
  'NewLeadDailyReport',
  NewLeadDailyReportSchema,
  'newleaddailyreports'
);
