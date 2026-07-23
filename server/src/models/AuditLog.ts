import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  userRole: string;
  module: string;
  action: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  deviceInfo?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    module: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    fieldChanged: { type: String, default: '' },
    oldValue: { type: String, default: '' },
    newValue: { type: String, default: '' },
    ipAddress: { type: String, default: '127.0.0.1' },
    deviceInfo: { type: String, default: 'Web Browser' }
  },
  {
    timestamps: true
  }
);

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
