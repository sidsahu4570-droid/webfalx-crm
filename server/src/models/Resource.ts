import { Schema, model, Document } from 'mongoose';

export interface IResource extends Document {
  title: string;
  description?: string;
  imageUrl: string; // Base64 data URL
  createdAt: Date;
  updatedAt: Date;
}

const resourceSchema = new Schema<IResource>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    imageUrl: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export const Resource = model<IResource>('Resource', resourceSchema);
