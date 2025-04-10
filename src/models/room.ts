import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  id: string;
  name: string;
  description?: string;
  hourlyRate: number;
  additionalHourRate: number;
  isActive: boolean;
  googleCalendarId: string;
  googleCalendarSyncEnabled: boolean;
  lastSyncTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>({
  id: {
    type: String,
    required: true,
    unique: true,
    enum: ['room1', 'room2'],
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  hourlyRate: {
    type: Number,
    required: true,
    default: 10000
  },
  additionalHourRate: {
    type: Number,
    required: true,
    default: 5000
  },
  isActive: {
    type: Boolean,
    default: true
  },
  googleCalendarId: {
    type: String,
    required: true
  },
  googleCalendarSyncEnabled: {
    type: Boolean,
    default: false
  },
  lastSyncTime: {
    type: Date
  }
}, {
  timestamps: true
});

const Room = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);

export default Room;