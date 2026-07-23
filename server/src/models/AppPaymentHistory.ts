import { Schema, model, Document, Types } from 'mongoose';

export interface IAppPaymentHistory extends Document {
  _id: Types.ObjectId;
  appRevenueId: Types.ObjectId;
  clientName: string;
  amount: number;
  paymentMode: string;
  paymentDate: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

const appPaymentHistorySchema = new Schema<IAppPaymentHistory>(
  {
    appRevenueId: { type: Schema.Types.ObjectId, ref: 'AppRevenue', required: true, index: true },
    clientName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMode: { type: String, default: 'UPI' },
    paymentDate: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    createdBy: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

export const AppPaymentHistory = model<IAppPaymentHistory>('AppPaymentHistory', appPaymentHistorySchema);
