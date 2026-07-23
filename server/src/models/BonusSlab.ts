import { Schema, model, Document, Types } from 'mongoose';

export interface IBonusSlab extends Document {
  _id: Types.ObjectId;
  title: string;
  targetSales: number; // Required Approved Sales count
  bonusAmount: number; // Reward (₹)
  isActive: boolean;
  applicableCallers?: Types.ObjectId[]; // Empty array means all callers
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const bonusSlabSchema = new Schema<IBonusSlab>(
  {
    title: { type: String, required: true, trim: true },
    targetSales: { type: Number, required: true, min: 1, index: true },
    bonusAmount: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true, index: true },
    applicableCallers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

export const BonusSlab = model<IBonusSlab>('BonusSlab', bonusSlabSchema);
