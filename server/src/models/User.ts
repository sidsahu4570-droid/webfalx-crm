import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  googleId?: string;
  joiningDate?: Date;
  joiningDateStatus?: 'Pending Approval' | 'Approved' | 'Rejected';
  joiningDateSubmittedAt?: Date;
  joiningDateApprovedBy?: string;
  paymentModel?: 'Salary Based';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: false,
      select: false,
    },
    role: {
      type: String,
      enum: ['caller', 'admin'],
      default: 'caller',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    googleId: {
      type: String,
    },
    joiningDate: {
      type: Date,
    },
    joiningDateStatus: {
      type: String,
      enum: ['Pending Approval', 'Approved', 'Rejected'],
      default: 'Pending Approval',
    },
    joiningDateSubmittedAt: {
      type: Date,
    },
    joiningDateApprovedBy: {
      type: String,
    },
    paymentModel: {
      type: String,
      enum: ['Salary Based'],
      default: 'Salary Based',
      index: true
    }
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', userSchema);
