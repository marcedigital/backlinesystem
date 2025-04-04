import mongoose, { Schema, Document } from 'mongoose';

// Create an interface representing a document in MongoDB
export interface ICoupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  couponType: 'one-time' | 'time-limited';
  startDate?: Date;
  endDate?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Create a Schema corresponding to the document interface
const CouponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  couponType: {
    type: String,
    enum: ['one-time', 'time-limited'],
    required: true,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true
});

// Custom validation for date range
CouponSchema.pre('validate', function(next) {
  // Use a simple approach without type assertion
  if (this.couponType === 'time-limited') {
    // Both dates are required
    if (!this.startDate || !this.endDate) {
      return next(new Error('Time-limited coupons require both start and end dates'));
    }
    
    // Start date should be before end date
    if (this.startDate > this.endDate) {
      return next(new Error('Start date must be before end date'));
    }
  }
  
  next();
});

// Create and export the model
const Coupon = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);

export default Coupon;