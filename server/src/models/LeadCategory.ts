import { Schema, model, Document } from 'mongoose';

export interface ILeadCategory extends Document {
  name: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const leadCategorySchema = new Schema<ILeadCategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
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

export const LeadCategory = model<ILeadCategory>('LeadCategory', leadCategorySchema, 'leadcategories');
