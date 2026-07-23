import { Schema, model, Document, Types } from 'mongoose';

export interface ILeadCategoryStats {
  callsMade: number;
  followUps: number;
  statusUpdated: number;
  whatsAppMessages: number;
  meetings: number;
  convertedClients: number;
  notPickedCalls: number;
}

export interface IDailyReport extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  callerName: string;
  callerEmail: string;
  reportDate: Date;
  dateString: string; // 'YYYY-MM-DD'
  
  // Categorized Lead Stats
  newLeadStats: ILeadCategoryStats;
  oldLeadStats: ILeadCategoryStats;

  // Legacy aggregated fields
  totalCalls: number;
  connectedCalls: number;
  notPickedCalls: number;
  followUpsDone: number;
  followUpsPending: number;
  interestedClients: number;
  convertedClients: number;
  notInterestedClients: number;
  meetingsScheduled: number;
  whatsappMessagesSent: number;

  summary: string;
  remarks: string;
  manualEditCount: number; // Max 1 edit per day for caller
  isEditLocked: boolean;
  adminEditAllowed: boolean;
  adminEditAllowedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const categoryStatsSchema = new Schema<ILeadCategoryStats>(
  {
    callsMade: { type: Number, default: 0 },
    followUps: { type: Number, default: 0 },
    statusUpdated: { type: Number, default: 0 },
    whatsAppMessages: { type: Number, default: 0 },
    meetings: { type: Number, default: 0 },
    convertedClients: { type: Number, default: 0 },
    notPickedCalls: { type: Number, default: 0 }
  },
  { _id: false }
);

const dailyReportSchema = new Schema<IDailyReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    callerName: {
      type: String,
      required: true
    },
    callerEmail: {
      type: String,
      required: true
    },
    reportDate: {
      type: Date,
      required: true,
      index: true
    },
    dateString: {
      type: String,
      required: true,
      index: true
    },
    newLeadStats: {
      type: categoryStatsSchema,
      default: () => ({
        callsMade: 0,
        followUps: 0,
        statusUpdated: 0,
        whatsAppMessages: 0,
        meetings: 0,
        convertedClients: 0,
        notPickedCalls: 0
      })
    },
    oldLeadStats: {
      type: categoryStatsSchema,
      default: () => ({
        callsMade: 0,
        followUps: 0,
        statusUpdated: 0,
        whatsAppMessages: 0,
        meetings: 0,
        convertedClients: 0,
        notPickedCalls: 0
      })
    },
    totalCalls: { type: Number, default: 0 },
    connectedCalls: { type: Number, default: 0 },
    notPickedCalls: { type: Number, default: 0 },
    followUpsDone: { type: Number, default: 0 },
    followUpsPending: { type: Number, default: 0 },
    interestedClients: { type: Number, default: 0 },
    convertedClients: { type: Number, default: 0 },
    notInterestedClients: { type: Number, default: 0 },
    meetingsScheduled: { type: Number, default: 0 },
    whatsappMessagesSent: { type: Number, default: 0 },
    summary: { type: String, default: '' },
    remarks: { type: String, default: '' },
    manualEditCount: { type: Number, default: 0 },
    isEditLocked: { type: Boolean, default: false },
    adminEditAllowed: { type: Boolean, default: false },
    adminEditAllowedUntil: { type: Date }
  },
  {
    timestamps: true
  }
);

export const DailyReport = model<IDailyReport>('DailyReport', dailyReportSchema);
