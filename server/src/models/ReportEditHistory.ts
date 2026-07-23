import { Schema, model, Document, Types } from 'mongoose';

export interface IReportEditHistory extends Document {
  _id: Types.ObjectId;
  reportId: Types.ObjectId;
  userId: Types.ObjectId;
  callerName: string;
  editedFields: string[];
  previousData: Record<string, any>;
  newData: Record<string, any>;
  editedAt: Date;
  editedBy: Types.ObjectId;
  editorName: string;
  editReason?: string;
}

const reportEditHistorySchema = new Schema<IReportEditHistory>(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'DailyReport',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    callerName: {
      type: String,
      required: true
    },
    editedFields: [{ type: String }],
    previousData: { type: Object, default: {} },
    newData: { type: Object, default: {} },
    editedAt: { type: Date, default: Date.now },
    editedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    editorName: {
      type: String,
      required: true
    },
    editReason: { type: String, default: 'Updated daily work metrics' }
  },
  {
    timestamps: { createdAt: 'editedAt', updatedAt: false }
  }
);

reportEditHistorySchema.index({ reportId: 1, editedAt: -1 });

export const ReportEditHistory = model<IReportEditHistory>(
  'ReportEditHistory',
  reportEditHistorySchema
);
