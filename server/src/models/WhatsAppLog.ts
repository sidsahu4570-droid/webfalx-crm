import { Schema, model, Document, Types } from 'mongoose';

export type WhatsAppStatus = 'Sent' | 'Delivered' | 'Read' | 'Replied' | 'No Response';

export interface IWhatsAppLog extends Document {
  _id: Types.ObjectId;
  leadId?: Types.ObjectId;
  clientId?: Types.ObjectId;
  callerId: Types.ObjectId;
  callerName: string;
  phone: string;
  message: string;
  templateName?: string;
  status: WhatsAppStatus;
  sentAt: Date;
  updatedAt: Date;
}

const whatsAppLogSchema = new Schema<IWhatsAppLog>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'ConvertedClient', index: true },
    callerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    callerName: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    message: { type: String, required: true },
    templateName: { type: String, default: 'Custom Message' },
    status: {
      type: String,
      enum: ['Sent', 'Delivered', 'Read', 'Replied', 'No Response'],
      default: 'Sent',
      index: true
    },
    sentAt: { type: Date, default: Date.now, index: true }
  },
  {
    timestamps: true
  }
);

export const WhatsAppLog = model<IWhatsAppLog>('WhatsAppLog', whatsAppLogSchema);
