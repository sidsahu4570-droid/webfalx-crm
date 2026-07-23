import { Schema, model, Document, Types } from 'mongoose';

export type AppExpenseType =
  | 'App Development Cost'
  | 'Play Store Cost'
  | 'Employee Cost'
  | 'Caller Commission'
  | 'Software Cost'
  | 'Server Cost'
  | 'API Cost'
  | 'Other Expenses';

export interface IAppExpense extends Document {
  _id: Types.ObjectId;
  expenseType: AppExpenseType;
  amount: number;
  notes?: string;
  expenseDate: Date;
  createdBy: string;
  createdAt: Date;
}

const appExpenseSchema = new Schema<IAppExpense>(
  {
    expenseType: {
      type: String,
      enum: [
        'App Development Cost',
        'Play Store Cost',
        'Employee Cost',
        'Caller Commission',
        'Software Cost',
        'Server Cost',
        'API Cost',
        'Other Expenses'
      ],
      required: true
    },
    amount: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' },
    expenseDate: { type: Date, default: Date.now },
    createdBy: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

export const AppExpense = model<IAppExpense>('AppExpense', appExpenseSchema);
