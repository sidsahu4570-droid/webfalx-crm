import { Schema, model, Document, Types } from 'mongoose';

export type AttendanceStatus = 'Present' | 'Late' | 'Half Day' | 'Absent';

export interface IAttendance extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  callerName: string;
  callerEmail: string;
  date: string; // YYYY-MM-DD
  loginTime: Date;
  logoutTime?: Date;
  activeHours: number; // in hours
  breakTime: number; // in minutes
  totalWorkingHours: number; // in hours
  status: AttendanceStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    callerName: { type: String, required: true },
    callerEmail: { type: String, required: true },
    date: { type: String, required: true, index: true },
    loginTime: { type: Date, required: true },
    logoutTime: { type: Date },
    activeHours: { type: Number, default: 0 },
    breakTime: { type: Number, default: 0 },
    totalWorkingHours: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Present', 'Late', 'Half Day', 'Absent'],
      default: 'Present',
      index: true
    },
    notes: { type: String, default: '' }
  },
  {
    timestamps: true
  }
);

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Attendance = model<IAttendance>('Attendance', attendanceSchema);
