import { Schema, model, Document, Types } from 'mongoose';

export interface IImportHistory extends Document {
  _id: Types.ObjectId;
  fileName: string;
  importedBy: string;
  assignedCallerId: Types.ObjectId;
  assignedCallerName: string;
  assignedCallerEmail: string;
  totalRows: number;
  successfulImports: number;
  duplicateCount: number;
  failedImports: number;
  duplicateAction: 'skip' | 'update';
  importDate: Date;
  createdAt: Date;
}

const importHistorySchema = new Schema<IImportHistory>(
  {
    fileName: { type: String, required: true },
    importedBy: { type: String, required: true },
    assignedCallerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedCallerName: { type: String, required: true },
    assignedCallerEmail: { type: String, required: true },
    totalRows: { type: Number, required: true },
    successfulImports: { type: Number, required: true },
    duplicateCount: { type: Number, default: 0 },
    failedImports: { type: Number, default: 0 },
    duplicateAction: { type: String, enum: ['skip', 'update'], default: 'skip' },
    importDate: { type: Date, default: Date.now, index: true }
  },
  {
    timestamps: true
  }
);

export const ImportHistory = model<IImportHistory>('ImportHistory', importHistorySchema);
