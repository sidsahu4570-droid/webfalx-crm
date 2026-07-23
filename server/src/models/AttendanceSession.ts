import { Schema, model, Document, Types } from 'mongoose';

export interface IAttendanceSession extends Document {
  userId: Types.ObjectId;
  callerName: string;
  callerEmail: string;
  date: string; // YYYY-MM-DD
  sessionIndex: number; // 1, 2, 3
  loginTime: Date;
  logoutTime?: Date;
  workingHours: number; // in hours (decimal)
  isLateLogin: boolean;
  isEarlyLogout: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    callerName: { type: String, required: true },
    callerEmail: { type: String, required: true },
    date: { type: String, required: true, index: true },
    sessionIndex: { type: Number, required: true, enum: [1, 2, 3] },
    loginTime: { type: Date, required: true },
    logoutTime: { type: Date },
    workingHours: { type: Number, default: 0 },
    isLateLogin: { type: Boolean, default: false },
    isEarlyLogout: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent duplicate session index per user per date
attendanceSessionSchema.index({ userId: 1, date: 1, sessionIndex: 1 }, { unique: true });

export const AttendanceSession = model<IAttendanceSession>('AttendanceSession', attendanceSessionSchema, 'attendancesessions');
