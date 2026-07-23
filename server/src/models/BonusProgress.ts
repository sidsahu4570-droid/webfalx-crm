import { Schema, model, Document, Types } from 'mongoose';

export interface IBonusProgress extends Document {
  userId: Types.ObjectId;
  approvedSales: number;
  targetSales: number;
  remainingSales: number;
  bonusAmount: number;
  isUnlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bonusProgressSchema = new Schema<IBonusProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    approvedSales: { type: Number, default: 0 },
    targetSales: { type: Number, default: 0 },
    remainingSales: { type: Number, default: 0 },
    bonusAmount: { type: Number, default: 0 },
    isUnlocked: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const BonusProgress = model<IBonusProgress>('BonusProgress', bonusProgressSchema, 'bonusprogress');
