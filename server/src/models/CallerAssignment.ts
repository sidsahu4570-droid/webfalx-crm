import { Schema, model, Document } from 'mongoose';

export interface ICallerAssignment extends Document {
  callerId: Schema.Types.ObjectId;
  assignedNotes: Schema.Types.ObjectId[];
  assignedResources: Schema.Types.ObjectId[];
  assignedBy: Schema.Types.ObjectId;
  assignedAt: Date;
}

const callerAssignmentSchema = new Schema<ICallerAssignment>(
  {
    callerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // each caller has one assignment doc
    },
    assignedNotes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Note'
      }
    ],
    assignedResources: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Resource'
      }
    ],
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export const CallerAssignment = model<ICallerAssignment>('CallerAssignment', callerAssignmentSchema);
