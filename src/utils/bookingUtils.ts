// src/utils/bookingUtils.ts (updated version)
export interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  isSelected: boolean;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  selected: boolean;
}

export interface BookingDetails {
  room: string;
  startTime: Date | null;
  endTime: Date | null;
  addOns: AddOn[];
  totalPrice: number;
}

export interface Room {
  id: string;
  name: string;
}

// Available rooms
export const rooms: Room[] = [
  { id: "room1", name: "Sala 1" },
  { id: "room2", name: "Sala 2" },
];

// Fetch available time slots from the API
export const fetchTimeSlots = async (date: Date, roomId: string): Promise<{ currentDay: TimeSlot[], nextDay: TimeSlot[] }> => {
  try {
    // Format the date for the API
    const dateString = date.toISOString().split('T')[0];
    
    // Call the API
    const response = await fetch(`/api/rooms/availability?date=${dateString}&roomId=${roomId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch time slots');
    }
    
    const data = await response.json();
    
    // Process the response
    const roomAvailability = data.availability[roomId];
    
    if (!roomAvailability) {
      throw new Error(`No availability data for room ${roomId}`);
    }
    
    // Convert API response to TimeSlot format
    const currentDaySlots = roomAvailability.currentDay.map((slot: any) => ({
      id: `${roomId}-${slot.startTime}`,
      startTime: new Date(slot.startTime),
      endTime: new Date(slot.endTime),
      isAvailable: slot.isAvailable,
      isSelected: false
    }));
    
    const nextDaySlots = roomAvailability.nextDay.map((slot: any) => ({
      id: `${roomId}-${slot.startTime}`,
      startTime: new Date(slot.startTime),
      endTime: new Date(slot.endTime),
      isAvailable: slot.isAvailable,
      isSelected: false
    }));
    
    return {
      currentDay: currentDaySlots,
      nextDay: nextDaySlots
    };
  } catch (error) {
    console.error('Error fetching time slots:', error);
    
    // Fall back to the original implementation if the API fails
    return {
      currentDay: generateTimeSlots(date, roomId, getUnavailableTimes(date, roomId)),
      nextDay: generateNextDayTimeSlots(date, roomId)
    };
  }
};

// Generate time slots for a specific day and room (fallback implementation)
export const generateTimeSlots = (date: Date, roomId: string, unavailableTimes: Array<[Date, Date]> = []): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startHour = 0; // 12 AM
  const endHour = 24; // 12 AM next day
  
  // Solo generar slots para horas completas
  for (let hour = startHour; hour < endHour; hour++) {
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);
    
    // Check if this slot overlaps with any unavailable time
    const isAvailable = !unavailableTimes.some(([unavailStart, unavailEnd]) => {
      return startTime < unavailEnd && endTime > unavailStart;
    });
    
    slots.push({
      id: `${roomId}-${startTime.toISOString()}`,
      startTime,
      endTime,
      isAvailable,
      isSelected: false,
    });
  }
  
  return slots;
};

// Generate time slots for the next day (fallback implementation)
export const generateNextDayTimeSlots = (date: Date, roomId: string): TimeSlot[] => {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  const unavailableTimes = getUnavailableTimes(nextDay, roomId);
  
  // Only generate slots for first 6 hours of next day
  const slots: TimeSlot[] = [];
  const startHour = 0; // 12 AM
  const endHour = 6; // 6 AM
  
  for (let hour = startHour; hour < endHour; hour++) {
    const startTime = new Date(nextDay);
    startTime.setHours(hour, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);
    
    // Check if this slot overlaps with any unavailable time
    const isAvailable = !unavailableTimes.some(([unavailStart, unavailEnd]) => {
      return startTime < unavailEnd && endTime > unavailStart;
    });
    
    slots.push({
      id: `${roomId}-${startTime.toISOString()}`,
      startTime,
      endTime,
      isAvailable,
      isSelected: false,
    });
  }
  
  return slots;
};

// Format time for display (e.g., "9:00 AM")
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

// Calculate total booking duration in minutes
export const calculateDuration = (startTime: Date, endTime: Date): number => {
  return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
};

// Calculate total price based on duration and add-ons
export const calculatePrice = (startTime: Date | null, endTime: Date | null, addOns: AddOn[]): number => {
  if (!startTime || !endTime) return 0;
  
  // Calculate duration in hours
  const durationInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  const hours = Math.ceil(durationInMinutes / 60); // Round up to whole hours
  
  // Base price:
  // ¢10.000 for the first hour
  // ¢5.000 for each additional hour
  let basePrice = 10000; // First hour
  
  if (hours > 1) {
    basePrice += (hours - 1) * 5000; // Additional full hours
  }
  
  // Add price of selected add-ons (¢2.000 per hour per add-on)
  const addOnPricePerHour = 2000;
  
  const addOnPrice = addOns.reduce((total, addOn) => {
    if (addOn.selected) {
      return total + (addOnPricePerHour * hours);
    }
    return total;
  }, 0);
  
  return Math.round(basePrice + addOnPrice);
};

// Verifica si un rango de slots es continuo (sin huecos de disponibilidad)
export const areSlotsContinuous = (slots: TimeSlot[], startSlot: TimeSlot, endSlot: TimeSlot): boolean => {
  if (!startSlot || !endSlot) return false;
  
  const startIndex = slots.findIndex(slot => slot.id === startSlot.id);
  const endIndex = slots.findIndex(slot => slot.id === endSlot.id);
  
  if (startIndex === -1 || endIndex === -1) return false;
  
  const min = Math.min(startIndex, endIndex);
  const max = Math.max(startIndex, endIndex);
  
  // Verificar que todos los slots entre min y max estén disponibles
  for (let i = min; i <= max; i++) {
    if (!slots[i].isAvailable) {
      return false;
    }
  }
  
  return true;
};

// Sample add-ons data
export const getDefaultAddOns = (): AddOn[] => [
  {
    id: "1",
    name: "Alquiler de Platillos",
    description: "Set completo de platillos para batería",
    price: 2000,
    selected: false,
  },
  {
    id: "2",
    name: "Alquiler Pedal Doble de Bombo",
    description: "Pedal doble profesional para bombo",
    price: 2000,
    selected: false,
  }
];

// Sample unavailable time slots for each room (fallback)
export const getUnavailableTimes = (date: Date, roomId: string): Array<[Date, Date]> => {
  const unavailable: Array<[Date, Date]> = [];
  
  if (roomId === "room1") {
    // Sala 1 unavailable times
    // Example: 10:00 AM - 11:00 AM is unavailable
    const unavailStart1 = new Date(date);
    unavailStart1.setHours(10, 0, 0, 0);
    const unavailEnd1 = new Date(date);
    unavailEnd1.setHours(11, 0, 0, 0);
    unavailable.push([unavailStart1, unavailEnd1]);
    
    // Example: 2:00 PM - 3:00 PM is unavailable
    const unavailStart2 = new Date(date);
    unavailStart2.setHours(14, 0, 0, 0);
    const unavailEnd2 = new Date(date);
    unavailEnd2.setHours(15, 0, 0, 0);
    unavailable.push([unavailStart2, unavailEnd2]);
  } else if (roomId === "room2") {
    // Sala 2 unavailable times
    // Example: 9:00 AM - 10:00 AM is unavailable
    const unavailStart1 = new Date(date);
    unavailStart1.setHours(9, 0, 0, 0);
    const unavailEnd1 = new Date(date);
    unavailEnd1.setHours(10, 0, 0, 0);
    unavailable.push([unavailStart1, unavailEnd1]);
    
    // Example: 4:00 PM - 5:00 PM is unavailable
    const unavailStart2 = new Date(date);
    unavailStart2.setHours(16, 0, 0, 0);
    const unavailEnd2 = new Date(date);
    unavailEnd2.setHours(17, 0, 0, 0);
    unavailable.push([unavailStart2, unavailEnd2]);
  }
  
  return unavailable;
};

// Function to submit booking to the API
export const submitBooking = async (bookingData: any): Promise<{success: boolean; message: string; bookingId?: string}> => {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to create booking',
      };
    }
    
    return {
      success: true,
      message: data.message || 'Booking created successfully',
      bookingId: data.booking?.id,
    };
  } catch (error) {
    console.error('Error submitting booking:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};