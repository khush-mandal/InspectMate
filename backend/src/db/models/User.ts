import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: 'inspector' | 'admin' | 'regulator';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { 
      type: String, 
      required: true, 
      enum: ['inspector', 'admin', 'regulator'],
      default: 'inspector'
    }
  },
  { 
    timestamps: true,
    strict: true
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
