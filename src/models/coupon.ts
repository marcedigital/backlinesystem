import mongoose, { Schema, Model, Document } from 'mongoose';

// Create an interface representing the document in MongoDB
interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  couponType: 'one-time' | 'time-limited';
  startDate?: Date;
  endDate?: Date;
  active: boolean;
}

// Create a Schema corresponding to the document interface
const CouponSchema: Schema<ICoupon> = new Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'Discount type is required'],
  },
  value: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value must be non-negative'],
  },
  couponType: {
    type: String,
    enum: ['one-time', 'time-limited'],
    required: [true, 'Coupon type is required'],
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
CouponSchema.pre('validate', function(this: ICoupon, next) {
  // If it's a time-limited coupon, validate the date range
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

// Create the model
const Coupon: Model<ICoupon> = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);

export default Coupon;