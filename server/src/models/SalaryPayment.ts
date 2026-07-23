import { Schema, model, Document, Types } from 'mongoose';

export interface ISalaryPayment extends Document {
  callerId: Types.ObjectId;
  callerName: string;
  month: string; // Format: "YYYY-MM" (e.g. "2026-07")
  monthlySalary: number;
  salaryPaid: number;
  bonusPaid: number;
  deduction: number;
  netPaid: number;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';
  notes?: string;
  paidBy: Types.ObjectId;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const salaryPaymentSchema = new Schema<ISalaryPayment>(
  {
    callerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    callerName: { type: String, required: true },
    month: { type: String, required: true, index: true },
    monthlySalary: { type: Number, required: true, default: 0 },
    salaryPaid: { type: Number, required: true, default: 0 },
    bonusPaid: { type: Number, required: true, default: 0 },
    deduction: { type: Number, required: true, default: 0 },
    netPaid: { type: Number, required: true, default: 0 },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other']
    },
    notes: { type: String, default: '' },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paidAt: { type: Date, required: true, default: Date.now }
  },
  {
    timestamps: true
  }
);

export const SalaryPayment = model<ISalaryPayment>('SalaryPayment', salaryPaymentSchema, 'salarypayments');
