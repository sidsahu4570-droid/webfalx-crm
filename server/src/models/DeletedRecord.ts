import { Schema, model, Document, Types } from 'mongoose';

export interface IDeletedRecord extends Document {
  _id: Types.ObjectId;
  originalId: string;
  collectionName: 'Lead' | 'ConvertedClient' | 'Meeting' | 'PaymentHistory' | 'AppRevenue';
  clientName: string;
  company?: string;
  phone?: string;
  email?: string;
  projectType?: 'website' | 'app';
  conversionDate?: Date;
  deletionDate: Date;
  deletedBy: string;
  deletedByRole: string;
  deletionReason?: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

const deletedRecordSchema = new Schema<IDeletedRecord>(
  {
    originalId: { type: String, required: true, index: true },
    collectionName: {
      type: String,
      enum: ['Lead', 'ConvertedClient', 'Meeting', 'PaymentHistory', 'AppRevenue'],
      required: true,
      index: true
    },
    clientName: { type: String, required: true, index: true },
    company: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    projectType: { type: String, enum: ['website', 'app'] },
    conversionDate: { type: Date },
    deletionDate: { type: Date, default: Date.now, index: true },
    deletedBy: { type: String, required: true },
    deletedByRole: { type: String, required: true },
    deletionReason: { type: String, default: 'Soft deleted by Admin' },
    data: { type: Schema.Types.Mixed, required: true }
  },
  {
    timestamps: true
  }
);

export const DeletedRecord = model<IDeletedRecord>('DeletedRecord', deletedRecordSchema);
