// src/models/index.ts
import mongoose, { Schema } from 'mongoose';
import { hash, compare } from 'bcryptjs';

// Customer User Schema
const CustomerUserSchema = new Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^\+?506?\d{8}$/, 'Please enter a valid Costa Rican phone number']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  googleId: {
    type: String,
    trim: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Password hashing middleware
CustomerUserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await hash(this.password, 12);
  }
  next();
});

// Method to compare password
CustomerUserSchema.methods.comparePassword = async function(candidatePassword: string) {
  return await compare(candidatePassword, this.password);
};

// Admin User Schema
const AdminUserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    trim: true
  }],
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Password hashing middleware for Admin User
AdminUserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await hash(this.password, 12);
  }
  next();
});

// Method to compare password
AdminUserSchema.methods.comparePassword = async function(candidatePassword: string) {
  return await compare(candidatePassword, this.password);
};

// Create and export models
export const CustomerUser = mongoose.models.CustomerUser || mongoose.model('CustomerUser', CustomerUserSchema);
export const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', AdminUserSchema);

// Export other models (adjust as needed)
export { mongoose };