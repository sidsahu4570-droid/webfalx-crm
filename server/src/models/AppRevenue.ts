import { Schema, model, Document, Types } from 'mongoose';

export type AppRevenueType =
  | 'Mobile Apps'
  | 'Web Apps'
  | 'Maintenance'
  | 'Subscription Revenue'
  | 'Other Revenue';

export type AppPaymentStatus = 'Not Paid' | 'Partially Paid' | 'Fully Paid';

export interface IAppRevenue extends Document {
  _id: Types.ObjectId;
  clientName: string;
  company?: string;
  email?: string;
  phone?: string;
  callerId?: Types.ObjectId;
  callerName?: string;
  callerEmail?: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  revenueType: AppRevenueType;
  paymentStatus: AppPaymentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appRevenueSchema = new Schema<IAppRevenue>(
  {
    clientName: { type: String, required: true, trim: true },
    company: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    callerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    callerName: { type: String, default: 'Admin' },
    callerEmail: { type: String, default: '' },
    totalAmount: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    pendingAmount: { type: Number, required: true, default: 0 },
    revenueType: {
      type: String,
      enum: ['Mobile Apps', 'Web Apps', 'Maintenance', 'Subscription Revenue', 'Other Revenue'],
      default: 'Mobile Apps'
    },
    paymentStatus: {
      type: String,
      enum: ['Not Paid', 'Partially Paid', 'Fully Paid'],
      default: 'Not Paid'
    },
    notes: { type: String, default: '' }
  },
  {
    timestamps: true
  }
);

appRevenueSchema.pre('save', function (next) {
  this.pendingAmount = Math.max(0, (this.totalAmount || 0) - (this.paidAmount || 0));
  if (this.paidAmount >= this.totalAmount && this.totalAmount > 0) {
    this.paymentStatus = 'Fully Paid';
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'Partially Paid';
  } else {
    this.paymentStatus = 'Not Paid';
  }
  next();
});

export const AppRevenue = model<IAppRevenue>('AppRevenue', appRevenueSchema);
