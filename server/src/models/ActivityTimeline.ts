import { Schema, model, Document, Types } from 'mongoose';

export interface IActivityTimeline extends Document {
  _id: Types.ObjectId;
  entityId: Types.ObjectId;
  entityType: 'Lead' | 'ConvertedClient';
  action: string;
  description: string;
  performedBy: string;
  performedByRole: string;
  metadata?: any;
  createdAt: Date;
}

const activityTimelineSchema = new Schema<IActivityTimeline>(
  {
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    entityType: { type: String, enum: ['Lead', 'ConvertedClient'], required: true, index: true },
    action: { type: String, required: true },
    description: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedByRole: { type: String, required: true, default: 'caller' },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: true
  }
);

export const ActivityTimeline = model<IActivityTimeline>('ActivityTimeline', activityTimelineSchema);
