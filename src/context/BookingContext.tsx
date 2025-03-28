"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BookingDetails } from '@/utils/bookingUtils';

// Interface for our context state
interface BookingState {
  bookingData: BookingDetails | null;
  paymentProofImage: string | null;
  couponCode: string | null;
  discountPercentage: number;
}

// Interface for our context actions
interface BookingActions {
  setBookingData: (data: BookingDetails) => void;
  setPaymentProofImage: (imageUrl: string | null) => void;
  setCouponCode: (code: string | null) => void;
  setDiscountPercentage: (percentage: number) => void;
  resetCouponAndDiscount: () => void;
}

// Combined interface for our context
interface BookingContextType extends BookingState, BookingActions {}

// Create context with undefined initial value
const BookingContext = createContext<BookingContextType | undefined>(undefined);

/**
 * Provider component that wraps app and makes booking context available to any
 * child component that calls useBooking().
 */
export const BookingProvider = ({ children }: { children: ReactNode }) => {
  // State for booking details
  const [bookingData, setBookingData] = useState<BookingDetails | null>(null);
  const [paymentProofImage, setPaymentProofImage] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);

  // Handler to reset coupon and discount
  const resetCouponAndDiscount = () => {
    setCouponCode(null);
    setDiscountPercentage(0);
  };

  // Context value
  const contextValue: BookingContextType = {
    // State
    bookingData,
    paymentProofImage,
    couponCode,
    discountPercentage,
    
    // Actions
    setBookingData,
    setPaymentProofImage,
    setCouponCode,
    setDiscountPercentage,
    resetCouponAndDiscount
  };

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};

/**
 * Custom hook that provides access to booking context
 * and verifies it's being used within a BookingProvider.
 */
export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  
  return context;
};
