import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  gtin: string;
  productName: string;
  brand?: string;
  company?: string;
  category?: string;
  netContent?: string;
  externalIdentifier?: string;
  source: string;
  retrievedAt: Date;
  sourceDataVersion?: string;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'DISPUTED';
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema(
  {
    gtin: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    brand: { type: String },
    company: { type: String, index: true },
    category: { type: String, index: true },
    netContent: { type: String },
    externalIdentifier: { type: String, index: true },
    source: { type: String, required: true },
    retrievedAt: { type: Date, required: true },
    sourceDataVersion: { type: String },
    verificationStatus: { 
      type: String, 
      enum: ['VERIFIED', 'UNVERIFIED', 'DISPUTED'], 
      default: 'UNVERIFIED' 
    }
  },
  { timestamps: true, strict: true }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
