import mongoose, { Schema, Document } from 'mongoose';

export interface ICallLog extends Document {
  leadId: mongoose.Types.ObjectId;
  callerId: mongoose.Types.ObjectId;
  callerName: string;
  phone: string;
  callInitiatedAt: Date;
  leadType: 'New Lead' | 'Existing Lead';
  userRole: string;
  createdAt: Date;
}

const CallLogSchema: Schema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    callerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    callerName: { type: String, required: true },
    phone: { type: String, required: true },
    callInitiatedAt: { type: Date, default: Date.now },
    leadType: { type: String, enum: ['New Lead', 'Existing Lead'], required: true },
    userRole: { type: String, required: true }
  },
  { timestamps: true }
);

export const CallLog = mongoose.model<ICallLog>('CallLog', CallLogSchema, 'calllogs');
