import { Schema, model, Document, Types } from 'mongoose';

export type ClientExpenseCategory =
  | 'Website Development Cost'
  | 'Website Cost'
  | 'Domain Cost'
  | 'Domain Charge'
  | 'App Development Cost'
  | 'Play Store Cost'
  | 'Other Expense';

export interface IClientExpenseHistory extends Document {
  _id: Types.ObjectId;
  clientId: Types.ObjectId;
  clientName: string;
  expenseType: ClientExpenseCategory;
  amount: number;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

const clientExpenseHistorySchema = new Schema<IClientExpenseHistory>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'ConvertedClient', required: true, index: true },
    clientName: { type: String, required: true },
    expenseType: {
      type: String,
      enum: [
        'Website Development Cost',
        'Website Cost',
        'Domain Cost',
        'Domain Charge',
        'App Development Cost',
        'Play Store Cost',
        'Other Expense'
      ],
      required: true
    },
    amount: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' },
    createdBy: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

export const ClientExpenseHistory = model<IClientExpenseHistory>(
  'ClientExpenseHistory',
  clientExpenseHistorySchema
);
