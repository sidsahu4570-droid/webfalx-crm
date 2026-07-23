import { Schema, model, Document, Types } from 'mongoose';

export interface ISalaryConfiguration extends Document {
  userId: Types.ObjectId;
  monthlySalary: number;
  monthlySalesTarget: number;
  minimumEligibleSales: number;
  createdAt: Date;
  updatedAt: Date;
}

const salaryConfigurationSchema = new Schema<ISalaryConfiguration>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    monthlySalary: { type: Number, required: true, default: 0 },
    monthlySalesTarget: { type: Number, required: true, default: 0 },
    minimumEligibleSales: { type: Number, required: true, default: 0 }
  },
  {
    timestamps: true
  }
);

export const SalaryConfiguration = model<ISalaryConfiguration>('SalaryConfiguration', salaryConfigurationSchema, 'salaryconfigurations');
