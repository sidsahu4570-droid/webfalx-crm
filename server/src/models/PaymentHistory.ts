import { Schema, model, Document, Types } from 'mongoose';

export type PaymentType =
  | 'client_payment_received'
  | 'website_making_cost'
  | 'domain_charge'
  | 'other_expense';

export interface IPaymentHistory extends Document {
  _id: Types.ObjectId;
  clientId: Types.ObjectId;
  clientName: string;
  leadId?: Types.ObjectId;
  userId: Types.ObjectId;
  callerName: string;
  callerEmail: string;
  paymentType: PaymentType;
  amount: number;
  paymentMode: string;
  note?: string;
  createdBy: string;
  createdAt: Date;
}

const paymentHistorySchema = new Schema<IPaymentHistory>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'ConvertedClient',
      required: true,
      index: true
    },
    clientName: { type: String, required: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    callerName: { type: String, required: true },
    callerEmail: { type: String, required: true },
    paymentType: {
      type: String,
      enum: [
        'client_payment_received',
        'website_making_cost',
        'domain_charge',
        'other_expense'
      ],
      required: true,
      index: true
    },
    amount: { type: Number, required: true },
    paymentMode: { type: String, default: 'UPI' },
    note: { type: String, default: '' },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, index: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const PaymentHistory = model<IPaymentHistory>(
  'PaymentHistory',
  paymentHistorySchema
);
