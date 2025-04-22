// src/models/booking.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the interface for the document
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
  status: 'Revisar' | 'Aprobada' | 'Cancelada' | 'Completa';
  paymentProof?: string;
  couponCode?: string;
  discountAmount?: number;
  googleCalendarEventId?: string | null;  
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Define interface for the static methods
interface BookingModel extends Model<IBooking> {
  updateCompletedBookings(): Promise<any>;
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
    min: 1,
    default: function(this: any) {
      if (this.startTime && this.endTime) {
        const durationMs = this.endTime.getTime() - this.startTime.getTime();
        return Math.ceil(durationMs / (1000 * 60 * 60)); // Hours rounded up
      }
      return undefined;
    }
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
    enum: ['Revisar', 'Aprobada', 'Cancelada', 'Completa'],
    default: 'Revisar'
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
    type: String,
    default: null
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
  if (this.isModified('startTime') || this.isModified('endTime') || !this.duration) {
    const durationMs = this.endTime.getTime() - this.startTime.getTime();
    this.duration = Math.ceil(durationMs / (1000 * 60 * 60)); // Duration in hours, rounded up
  }
  next();
});

// Create a static method for updating completed bookings
BookingSchema.statics.updateCompletedBookings = async function() {
  const now = new Date();
  return this.updateMany(
    { 
      status: 'Aprobada', 
      endTime: { $lt: now } 
    },
    { 
      $set: { status: 'Completa' } 
    }
  );
};

// Fix the pre-find middleware to avoid query execution errors
BookingSchema.pre('find', async function(next) {
  try {
    // Only run this logic if the query doesn't already include a status filter
    const queryObj = this.getQuery();
    if (!queryObj.status) {
      // Use the model directly to avoid query execution errors
      const BookingModel = mongoose.model<IBooking, BookingModel>('Booking');
      await BookingModel.updateCompletedBookings();
    }
  } catch (error) {
    console.error('Error in pre-find middleware:', error);
    // Continue with the find operation even if the update fails
  }
  next();
});

// Use the proper generic types when creating the model
const Booking = (mongoose.models.Booking as BookingModel) || 
  mongoose.model<IBooking, BookingModel>('Booking', BookingSchema);

export default Booking;