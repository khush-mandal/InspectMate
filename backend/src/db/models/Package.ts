import mongoose, { Schema, Document } from 'mongoose';
import { IPackage } from '../../interfaces/domain.interfaces';

export interface IPackageDocument extends IPackage, Document {
  _id: mongoose.Types.ObjectId;
}

const PackageSchema = new Schema(
  {
    gtin: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    brand: { type: String },
    company: { type: String, index: true },
    category: { type: String, index: true },
    source: { type: String },
  },
  { timestamps: true, strict: true }
);

export const Package = mongoose.model<IPackageDocument>('Package', PackageSchema);
