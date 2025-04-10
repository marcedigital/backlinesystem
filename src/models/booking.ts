import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  clientName: string;
  email: string;
  phoneNumber?: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  addOns: {
    id: string;
    name: string;
    price: number;
  }[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  paymentProof?: string;
  couponCode?: string;
  discountAmount?: number;
  googleCalendarEventId?: string;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  roomId: {
    type: String,
    required: true,
    enum: ['room1', 'room2']
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  addOns: [{
    id: String,
    name: String,
    price: Number
  }],
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'canceled', 'completed'],
    default: 'pending'
  },
  paymentProof: {
    type: String
  },
  couponCode: {
    type: String
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  googleCalendarEventId: {
    type: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerUser'
  }
}, {
  timestamps: true
});

// Add validation to ensure end time is after start time
BookingSchema.pre('validate', function(next) {
  if (this.startTime >= this.endTime) {
    return next(new Error('End time must be after start time'));
  }
  next();
});

// Calculate duration before saving
BookingSchema.pre('save', function(next) {
  const durationMs = this.endTime.getTime() - this.startTime.getTime();
  this.duration = Math.ceil(durationMs / (1000 * 60 * 60)); // Duration in hours, rounded up
  next();
});

const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;