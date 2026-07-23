import { Schema, model, Document, Types } from 'mongoose';

export type WebsiteStatus =
  | 'Website Had To Make'
  | 'Website In Making'
  | 'Website Done'
  | 'Delivered'
  | 'On Hold';

export type ClientPaymentStatus = 'Not Paid' | 'Partially Paid' | 'Fully Paid' | 'Overdue';
export type CallerPaymentStatus = 'Not Paid' | 'Partially Paid' | 'Fully Paid';
export type ApprovalStatus = 'Pending Approval' | 'Approved' | 'Rejected';
export type ProjectType = 'website' | 'app';

export interface IConvertedClient extends Document {
  _id: Types.ObjectId;
  leadId?: Types.ObjectId;
  userId: Types.ObjectId;
  callerName: string;
  callerEmail: string;

  projectType: ProjectType;

  clientName: string;
  company: string;
  phone: string;
  email: string;
  address: string;

  conversionDate: Date;
  meetingDate?: Date;
  meetingTime?: string;
  meetingLocation?: string;
  upcomingMeetingDate?: Date;
  meetingNotes?: string;

  websiteStatus: WebsiteStatus;
  websiteDeliveryDate?: Date;
  websiteCompletionDate?: Date;
  latestWebsiteUpdate?: string;

  totalClientAmount: number;
  clientPaidAmount: number;
  clientPendingAmount: number;

  websiteMakingCost: number;
  domainCharges: number;
  appDevelopmentCost: number;
  playStoreCost: number;
  otherExpenses: number;
  totalExpenses: number;

  grossRevenue: number;
  netProfit: number;

  paymentStatus: ClientPaymentStatus;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: Date;

  lockedFields?: Map<string, boolean>;

  createdAt: Date;
  updatedAt: Date;
}

const convertedClientSchema = new Schema<IConvertedClient>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    callerName: { type: String, required: true },
    callerEmail: { type: String, required: true },

    projectType: {
      type: String,
      enum: ['website', 'app'],
      default: 'website',
      required: true,
      index: true
    },

    clientName: { type: String, required: true, trim: true },
    company: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    address: { type: String, default: '' },

    conversionDate: { type: Date, default: Date.now },
    meetingDate: { type: Date },
    meetingTime: { type: String, default: '' },
    meetingLocation: { type: String, default: '' },
    upcomingMeetingDate: { type: Date },
    meetingNotes: { type: String, default: '' },

    websiteStatus: {
      type: String,
      enum: [
        'Website Had To Make',
        'Website In Making',
        'Website Done',
        'Delivered',
        'On Hold'
      ],
      default: 'Website Had To Make'
    },
    websiteDeliveryDate: { type: Date },
    websiteCompletionDate: { type: Date },
    latestWebsiteUpdate: { type: String, default: 'Converted client created' },

    totalClientAmount: { type: Number, required: true, default: 0 },
    clientPaidAmount: { type: Number, required: true, default: 0 },
    clientPendingAmount: { type: Number, required: true, default: 0 },

    websiteMakingCost: { type: Number, default: 0 },
    domainCharges: { type: Number, default: 0 },
    appDevelopmentCost: { type: Number, default: 0 },
    playStoreCost: { type: Number, default: 0 },
    otherExpenses: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },

    grossRevenue: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },

    paymentStatus: {
      type: String,
      enum: ['Not Paid', 'Partially Paid', 'Fully Paid', 'Overdue'],
      default: 'Not Paid'
    },
    approvalStatus: {
      type: String,
      enum: ['Pending Approval', 'Approved', 'Rejected'],
      default: 'Pending Approval',
      index: true
    },
    approvedBy: { type: String },
    approvedAt: { type: Date },

    lockedFields: {
      type: Map,
      of: Boolean,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

convertedClientSchema.pre('save', function (next) {
  this.clientPendingAmount = Math.max(0, (this.totalClientAmount || 0) - (this.clientPaidAmount || 0));

  if (this.clientPaidAmount >= this.totalClientAmount && this.totalClientAmount > 0) {
    this.paymentStatus = 'Fully Paid';
  } else if (this.clientPaidAmount > 0) {
    this.paymentStatus = 'Partially Paid';
  } else {
    this.paymentStatus = 'Not Paid';
  }

  this.totalExpenses =
    (this.websiteMakingCost || 0) +
    (this.domainCharges || 0) +
    (this.appDevelopmentCost || 0) +
    (this.playStoreCost || 0) +
    (this.otherExpenses || 0);

  this.grossRevenue = this.clientPaidAmount || 0;
  this.netProfit = this.grossRevenue - (this.totalExpenses || 0);

  next();
});

export const ConvertedClient = model<IConvertedClient>('ConvertedClient', convertedClientSchema);
