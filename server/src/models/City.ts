import { Schema, model, Document } from 'mongoose';

export interface ICity extends Document {
  name: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const citySchema = new Schema<ICity>(
  {
    name: {
      type: String,
      required: [true, 'City name is required'],
      unique: true,
      trim: true,
      index: true
    },
    isEnabled: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const City = model<ICity>('City', citySchema, 'cities');
