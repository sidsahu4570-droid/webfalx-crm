import { Schema, model, Document, Types } from 'mongoose';

export interface IDomainCharge extends Document {
  _id: Types.ObjectId;
  amount: number;
  notes: string;
  chargeDate: Date;
  createdBy: string;
  createdAt: Date;
}

const domainChargeSchema = new Schema<IDomainCharge>(
  {
    amount: { type: Number, required: true },
    notes: { type: String, default: '' },
    chargeDate: { type: Date, default: Date.now },
    createdBy: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

export const DomainCharge = model<IDomainCharge>('DomainCharge', domainChargeSchema);
