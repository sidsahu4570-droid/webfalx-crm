import { Schema, model, Document, Types } from 'mongoose';

export type LeadStatus =
  | 'New'
  | 'Interested'
  | 'Follow-up'
  | 'Meeting Scheduled'
  | 'Converted'
  | 'Not Interested'
  | 'Closed'
  | 'Not Picked';

export type LeadPriority = 'Low' | 'Medium' | 'High';
export type LeadType = 'imported' | 'manual';

export interface INote {
  _id?: Types.ObjectId;
  content: string;
  createdBy: Types.ObjectId;
  createdByName: string;
  status?: LeadStatus;
  followUpDate?: Date;
  isWhatsApp?: boolean;
  createdAt: Date;
}

export interface ILead extends Document {
  _id: Types.ObjectId;
  serialNumber?: number;
  userId: Types.ObjectId;
  callerName: string;
  callerEmail: string;
  leadType: LeadType;
  isNewLead: boolean;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  source: string;
  status: LeadStatus;
  priority: LeadPriority;
  categoryId?: Types.ObjectId;
  categoryName?: string;
  cityId?: Types.ObjectId;
  cityName?: string;
  notes: INote[];
  latestUpdate: string;
  completedFollowUps: number;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    content: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, required: true },
    status: { type: String },
    followUpDate: { type: Date },
    isWhatsApp: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const leadSchema = new Schema<ILead>(
  {
    serialNumber: {
      type: Number,
      index: true
    },
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
    leadType: {
      type: String,
      enum: ['imported', 'manual'],
      default: 'manual',
      index: true
    },
    isNewLead: {
      type: Boolean,
      default: false,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Prospect name is required'],
      trim: true
    },
    company: {
      type: String,
      default: '',
      trim: true
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    address: {
      type: String,
      default: ''
    },
    source: {
      type: String,
      default: 'Cold Call'
    },
    status: {
      type: String,
      enum: [
        'New',
        'Interested',
        'Follow-up',
        'Meeting Scheduled',
        'Converted',
        'Not Interested',
        'Closed',
        'Not Picked'
      ],
      default: 'New',
      index: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
      index: true
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'LeadCategory',
      index: true
    },
    categoryName: {
      type: String,
      index: true
    },
    cityId: {
      type: Schema.Types.ObjectId,
      ref: 'City',
      index: true
    },
    cityName: {
      type: String,
      index: true
    },
    notes: [noteSchema],
    latestUpdate: {
      type: String,
      default: 'Lead created'
    },
    completedFollowUps: {
      type: Number,
      default: 0
    },
    lastContactDate: {
      type: Date,
      default: Date.now
    },
    nextFollowUpDate: {
      type: Date,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound Indexes for fast queries
leadSchema.index({ userId: 1, isNewLead: 1 });
leadSchema.index({ userId: 1, status: 1 });
leadSchema.index({ userId: 1, nextFollowUpDate: 1 });
leadSchema.index({ serialNumber: 1 });
leadSchema.index({ name: 'text', company: 'text', email: 'text', phone: 'text' });

export const Lead = model<ILead>('Lead', leadSchema);
