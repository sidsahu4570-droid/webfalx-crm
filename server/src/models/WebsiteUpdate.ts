import { Schema, model, Document, Types } from 'mongoose';

export interface IWebsiteUpdate extends Document {
  _id: Types.ObjectId;
  clientId: Types.ObjectId;
  leadId?: Types.ObjectId;
  userId: Types.ObjectId;
  callerName: string;
  callerEmail: string;
  updateText: string;
  websiteStatus: string;
  updatedBy: string;
  createdAt: Date;
}

const websiteUpdateSchema = new Schema<IWebsiteUpdate>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'ConvertedClient',
      required: true,
      index: true
    },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    callerName: { type: String, required: true },
    callerEmail: { type: String, required: true },
    updateText: { type: String, required: true },
    websiteStatus: { type: String, required: true },
    updatedBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, index: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const WebsiteUpdate = model<IWebsiteUpdate>(
  'WebsiteUpdate',
  websiteUpdateSchema
);
