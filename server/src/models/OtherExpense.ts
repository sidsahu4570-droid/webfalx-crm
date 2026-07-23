import { Schema, model, Document, Types } from 'mongoose';

export interface IOtherExpense extends Document {
  _id: Types.ObjectId;
  amount: number;
  expenseType: string;
  notes: string;
  expenseDate: Date;
  createdBy: string;
  createdAt: Date;
}

const otherExpenseSchema = new Schema<IOtherExpense>(
  {
    amount: { type: Number, required: true },
    expenseType: { type: String, default: 'General' },
    notes: { type: String, default: '' },
    expenseDate: { type: Date, default: Date.now },
    createdBy: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

export const OtherExpense = model<IOtherExpense>('OtherExpense', otherExpenseSchema);
