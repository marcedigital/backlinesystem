// src/context/BookingContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { BookingDetails } from "@/utils/bookingUtils";

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
  const [bookingData, setBookingData] = useState<BookingDetails | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bookingData");
      if (saved) {
        try {
          const parsedData = JSON.parse(saved);
          // Convert date strings back to Date objects
          if (parsedData.startTime)
            parsedData.startTime = new Date(parsedData.startTime);
          if (parsedData.endTime)
            parsedData.endTime = new Date(parsedData.endTime);
          return parsedData;
        } catch (e) {
          console.error("Error parsing booking data from localStorage", e);
          return null;
        }
      }
    }
    return null;
  });

  const [paymentProofImage, setPaymentProofImage] = useState<string | null>(
    null
  );

  // Initialize coupon state from localStorage
  const [couponCode, setCouponCode] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("couponCode");
    }
    return null;
  });

  const [discountPercentage, setDiscountPercentage] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("discountPercentage");
      return saved ? parseFloat(saved) : 0;
    }
    return 0;
  });

  // Save booking data and coupon information to localStorage
  useEffect(() => {
    if (bookingData) {
      localStorage.setItem("bookingData", JSON.stringify(bookingData));
    }
  }, [bookingData]);

  // Save coupon information to localStorage separately
  useEffect(() => {
    if (couponCode) {
      localStorage.setItem("couponCode", couponCode);
      localStorage.setItem("discountPercentage", discountPercentage.toString());
    } else {
      localStorage.removeItem("couponCode");
      localStorage.removeItem("discountPercentage");
    }
  }, [couponCode, discountPercentage]);

  // Handler to reset coupon and discount
  const resetCouponAndDiscount = () => {
    setCouponCode(null);
    setDiscountPercentage(0);
    localStorage.removeItem("couponCode");
    localStorage.removeItem("discountPercentage");
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
    resetCouponAndDiscount,
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
    throw new Error("useBooking must be used within a BookingProvider");
  }

  return context;
};