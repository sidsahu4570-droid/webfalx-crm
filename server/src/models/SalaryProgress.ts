import { Schema, model, Document, Types } from 'mongoose';

export interface ISalaryProgress extends Document {
  userId: Types.ObjectId;
  approvedSales: number;
  monthlyTarget: number;
  remainingSales: number;
  isEligible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const salaryProgressSchema = new Schema<ISalaryProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    approvedSales: { type: Number, default: 0 },
    monthlyTarget: { type: Number, default: 0 },
    remainingSales: { type: Number, default: 0 },
    isEligible: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const SalaryProgress = model<ISalaryProgress>('SalaryProgress', salaryProgressSchema, 'salaryprogress');
