"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookingDetails, formatTime } from '@/utils/bookingUtils';
import AddOnItem from './AddOnItem';
import { CalendarClock, Clock, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useBooking } from '@/context/BookingContext';

interface BookingModalProps {
  isOpen: boolean;
  bookingDetails: BookingDetails;
  onClose: () => void;
  onToggleAddOn: (id: string) => void;
  onConfirm: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  bookingDetails,
  onClose,
  onToggleAddOn,
  onConfirm,
}) => {
  const { startTime, endTime, addOns, totalPrice } = bookingDetails;
  const { setBookingData, resetCouponAndDiscount } = useBooking();

  const handleConfirm = () => {
    // Store booking details in context
    setBookingData({...bookingDetails});
    
    // Reset any previous coupon when making a new booking
    resetCouponAndDiscount();
    
    toast.success('Booking confirmed!', {
      description: `Your music rehearsal room has been booked successfully.`,
    });
    onConfirm();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('es-CR', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format currency as Costa Rican Colones
  const formatCurrency = (amount: number) => {
    return `₡${amount.toLocaleString('es-CR')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] glass-morphism animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center text-black">
            <CalendarClock className="w-5 h-5 mr-2 text-primary" />
            Complete your booking
          </DialogTitle>
        </DialogHeader>

        {startTime && endTime && (
          <div className="mb-4">
            <div className="bg-primary/10 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-1">Selected time:</div>
              <div className="font-medium text-black">{formatDate(startTime)}</div>
              <div className="flex items-center mt-2 text-primary">
                <Clock className="w-4 h-4 mr-1" />
                <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
              </div>
            </div>

            <h3 className="text-base font-medium mb-3 text-black">Select add-ons (optional)</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {addOns.map((addOn) => (
                <AddOnItem
                  key={addOn.id}
                  addOn={addOn}
                  onToggle={onToggleAddOn}
                />
              ))}
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-black">Total price:</span>
                <span className="text-xl font-semibold text-black">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex sm:justify-between mt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex items-center text-black"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-accent hover:bg-accent/90 text-white flex items-center"
          >
            <Check className="w-4 h-4 mr-1" />
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
