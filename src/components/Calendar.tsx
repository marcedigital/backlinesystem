import React, { useState, useEffect } from "react";
import {
  getDefaultAddOns,
  fetchTimeSlots,
  calculatePrice,
  areSlotsContinuous,
  TimeSlot as TimeSlotType,
  BookingDetails,
  rooms,
  submitBooking,
} from "@/utils/bookingUtils";
import BookingModal from "./BookingModal";
import BookingInstructions from "./calendar/BookingInstructions";
import RoomSelector from "./calendar/RoomSelector";
import RoomTimeslots from "./calendar/RoomTimeslots";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useBooking } from "@/context/BookingContext";

const Calendar: React.FC = () => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState(rooms[0].id);
  const [timeSlots, setTimeSlots] = useState<{
    [roomId: string]: TimeSlotType[];
  }>({});
  const [nextDayTimeSlots, setNextDayTimeSlots] = useState<{
    [roomId: string]: TimeSlotType[];
  }>({});
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<TimeSlotType | null>(
    null
  );
  const [selectionEnd, setSelectionEnd] = useState<TimeSlotType | null>(null);
  const [tempSelectionEnd, setTempSelectionEnd] = useState<TimeSlotType | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    room: rooms[0].name,
    startTime: null,
    endTime: null,
    addOns: getDefaultAddOns(),
    totalPrice: 0,
  });
  const { setBookingData } = useBooking();

  const roomImages = {
    room1:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&h=400",
    room2:
      "https://images.unsplash.com/photo-1519508234439-4f23643125c1?auto=format&fit=crop&w=1200&h=400",
  };

  // Load slots for the selected date
  useEffect(() => {
    const loadTimeSlots = async () => {
      setIsLoading(true);
      resetSelection();

      try {
        // Load slots for all rooms for the selected date
        const allRoomsData: {
          [roomId: string]: {
            currentDay: TimeSlotType[];
            nextDay: TimeSlotType[];
          };
        } = {};

        for (const room of rooms) {
          const result = await fetchTimeSlots(selectedDate, room.id);
          allRoomsData[room.id] = result;
        }

        // Update state with fetched data
        const currentDaySlots: { [roomId: string]: TimeSlotType[] } = {};
        const nextDaySlots: { [roomId: string]: TimeSlotType[] } = {};

        for (const roomId of Object.keys(allRoomsData)) {
          currentDaySlots[roomId] = allRoomsData[roomId].currentDay;
          nextDaySlots[roomId] = allRoomsData[roomId].nextDay;
        }

        setTimeSlots(currentDaySlots);
        setNextDayTimeSlots(nextDaySlots);
      } catch (error) {
        console.error("Error loading time slots:", error);
        toast.error("Error loading availability. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTimeSlots();
  }, [selectedDate]); // Only reload when selectedDate changes

  // Update booking details when selection changes
  useEffect(() => {
    if (selectionStart && selectionEnd) {
      const startSlot =
        selectionStart.startTime < selectionEnd.startTime
          ? selectionStart
          : selectionEnd;
      const endSlot =
        selectionStart.startTime < selectionEnd.startTime
          ? selectionEnd
          : selectionStart;

      const roomName =
        rooms.find((room) => room.id === selectedRoom)?.name || "";

      setBookingDetails((prev) => ({
        ...prev,
        room: roomName,
        startTime: startSlot.startTime,
        endTime: endSlot.endTime,
      }));
    }
  }, [selectionStart, selectionEnd, selectedRoom]);

  // Calculate price when booking details change
  useEffect(() => {
    if (bookingDetails.startTime && bookingDetails.endTime) {
      const total = calculatePrice(
        bookingDetails.startTime,
        bookingDetails.endTime,
        bookingDetails.addOns
      );

      setBookingDetails((prev) => ({
        ...prev,
        totalPrice: total,
      }));
    }
  }, [bookingDetails.startTime, bookingDetails.endTime, bookingDetails.addOns]);

  const resetSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setTempSelectionEnd(null);
    setIsSelecting(false);

    // Reset current day slots
    if (timeSlots[selectedRoom]) {
      setTimeSlots((prev) => ({
        ...prev,
        [selectedRoom]: prev[selectedRoom].map((slot) => ({
          ...slot,
          isSelected: false,
        })),
      }));
    }

    // Reset next day slots
    if (nextDayTimeSlots[selectedRoom]) {
      setNextDayTimeSlots((prev) => ({
        ...prev,
        [selectedRoom]: prev[selectedRoom].map((slot) => ({
          ...slot,
          isSelected: false,
        })),
      }));
    }
  };

  const handleDateChange = (date: Date) => {
    resetSelection();
    setSelectedDate(date);
  };

  const handleRoomChange = (roomId: string) => {
    resetSelection();
    setSelectedRoom(roomId);

    const roomName = rooms.find((room) => room.id === roomId)?.name || "";
    setBookingDetails((prev) => ({
      ...prev,
      room: roomName,
    }));
  };

  const handleSelectStart = (slot: TimeSlotType) => {
    if (!slot.isAvailable) return;

    // If we're already in selecting mode, treat this as selecting the end slot
    if (isSelecting && selectionStart) {
      handleSelectEnd(slot);
      return;
    }

    // Otherwise, start a new selection
    setIsSelecting(true);
    setSelectionStart(slot);
    setTempSelectionEnd(slot);

    // Highlight the selected start slot
    const isCurrentDaySlot = timeSlots[selectedRoom]?.some(
      (s) => s.id === slot.id
    );

    if (isCurrentDaySlot) {
      setTimeSlots((prev) => ({
        ...prev,
        [selectedRoom]: prev[selectedRoom].map((s) => ({
          ...s,
          isSelected: s.id === slot.id,
        })),
      }));
    } else {
      setNextDayTimeSlots((prev) => ({
        ...prev,
        [selectedRoom]: prev[selectedRoom].map((s) => ({
          ...s,
          isSelected: s.id === slot.id,
        })),
      }));
    }
  };

  const handleSelectEnd = (slot: TimeSlotType) => {
    // If the slot is the same as the start slot, it's a single hour selection
    if (selectionStart && slot.id === selectionStart.id) {
      // Mark this single slot as selected
      const isCurrentDaySlot = timeSlots[selectedRoom]?.some(
        (s) => s.id === slot.id
      );

      if (isCurrentDaySlot) {
        setTimeSlots((prev) => ({
          ...prev,
          [selectedRoom]: prev[selectedRoom].map((s) => ({
            ...s,
            isSelected: s.id === slot.id,
          })),
        }));
      } else {
        setNextDayTimeSlots((prev) => ({
          ...prev,
          [selectedRoom]: prev[selectedRoom].map((s) => ({
            ...s,
            isSelected: s.id === slot.id,
          })),
        }));
      }

      setIsSelecting(false);
      setSelectionEnd(slot);
      setTempSelectionEnd(null);
      setIsModalOpen(true);
      return;
    }

    if (!isSelecting || !slot.isAvailable || !selectionStart) return;

    // Don't allow selecting the same slot as start and end
    if (slot.id === selectionStart.id) {
      return;
    }

    // Determine if the slots are in the same day or different days
    const isStartInCurrentDay = timeSlots[selectedRoom]?.some(
      (s) => s.id === selectionStart.id
    );
    const isEndInCurrentDay = timeSlots[selectedRoom]?.some(
      (s) => s.id === slot.id
    );

    // Ensure end slot is after start slot
    if (slot.startTime < selectionStart.startTime) {
      toast.error("La hora final debe ser después de la hora inicial");
      return;
    }

    // If both are in the same day, verify continuity
    if (isStartInCurrentDay && isEndInCurrentDay) {
      const currentDaySlots = timeSlots[selectedRoom] || [];
      if (!areSlotsContinuous(currentDaySlots, selectionStart, slot)) {
        toast.error(
          "Solo puedes seleccionar horas continuas sin espacios ocupados entre ellas"
        );
        resetSelection();
        return;
      }

      // Mark selection in current day
      const startIndex = currentDaySlots.findIndex(
        (s) => s.id === selectionStart.id
      );
      const endIndex = currentDaySlots.findIndex((s) => s.id === slot.id);

      if (startIndex !== -1 && endIndex !== -1) {
        const min = Math.min(startIndex, endIndex);
        const max = Math.max(startIndex, endIndex);

        setTimeSlots((prev) => ({
          ...prev,
          [selectedRoom]: prev[selectedRoom].map((s, i) => ({
            ...s,
            isSelected: i >= min && i <= max && s.isAvailable,
          })),
        }));
      }
    }
    // If selection crosses days, verify special continuity
    else if (
      (isStartInCurrentDay && !isEndInCurrentDay) ||
      (!isStartInCurrentDay && isEndInCurrentDay)
    ) {
      const currentDaySlots = timeSlots[selectedRoom] || [];
      const nextDaySlots = nextDayTimeSlots[selectedRoom] || [];

      // Verify if the selection validly crosses midnight
      if (isStartInCurrentDay) {
        // Selection from current day to next day
        const startIndex = currentDaySlots.findIndex(
          (s) => s.id === selectionStart.id
        );
        const endIndex = nextDaySlots.findIndex((s) => s.id === slot.id);

        if (startIndex !== -1 && endIndex !== -1) {
          // Verify that all slots from startIndex to the end of current day are available
          const isValidInCurrentDay = currentDaySlots
            .slice(startIndex)
            .every((s) => s.isAvailable);
          // Verify that all slots from the beginning of next day to endIndex are available
          const isValidInNextDay = nextDaySlots
            .slice(0, endIndex + 1)
            .every((s) => s.isAvailable);

          if (!isValidInCurrentDay || !isValidInNextDay) {
            toast.error(
              "Solo puedes seleccionar horas continuas sin espacios ocupados entre ellas"
            );
            resetSelection();
            return;
          }

          // Mark selected slots in both days
          setTimeSlots((prev) => ({
            ...prev,
            [selectedRoom]: prev[selectedRoom].map((s, i) => ({
              ...s,
              isSelected: i >= startIndex && s.isAvailable,
            })),
          }));

          setNextDayTimeSlots((prev) => ({
            ...prev,
            [selectedRoom]: prev[selectedRoom].map((s, i) => ({
              ...s,
              isSelected: i <= endIndex && s.isAvailable,
            })),
          }));
        }
      } else {
        // Selection from next day to current day (not supported)
        toast.error("La selección de días en orden inverso no está soportada");
        resetSelection();
        return;
      }
    }
    // If both are in the next day, verify continuity
    else if (!isStartInCurrentDay && !isEndInCurrentDay) {
      const nextDaySlots = nextDayTimeSlots[selectedRoom] || [];
      if (!areSlotsContinuous(nextDaySlots, selectionStart, slot)) {
        toast.error(
          "Solo puedes seleccionar horas continuas sin espacios ocupados entre ellas"
        );
        resetSelection();
        return;
      }

      // Mark selection in the next day
      const startIndex = nextDaySlots.findIndex(
        (s) => s.id === selectionStart.id
      );
      const endIndex = nextDaySlots.findIndex((s) => s.id === slot.id);

      if (startIndex !== -1 && endIndex !== -1) {
        const min = Math.min(startIndex, endIndex);
        const max = Math.max(startIndex, endIndex);

        setNextDayTimeSlots((prev) => ({
          ...prev,
          [selectedRoom]: prev[selectedRoom].map((s, i) => ({
            ...s,
            isSelected: i >= min && i <= max && s.isAvailable,
          })),
        }));
      }
    }

    setIsSelecting(false);
    setSelectionEnd(slot);
    setTempSelectionEnd(null);
    setIsModalOpen(true);
  };

  const handleMouseEnter = (slot: TimeSlotType) => {
    if (isSelecting) {
      setTempSelectionEnd(slot);
    }
  };

  const isInSelectionRange = (slot: TimeSlotType) => {
    if (!isSelecting || !selectionStart || !tempSelectionEnd) return false;

    // Only highlight slots between start and temp end
    // Make sure the highlighting works correctly regardless of order
    const startTime = selectionStart.startTime;
    const endTime = tempSelectionEnd.startTime;

    if (startTime <= endTime) {
      return slot.startTime >= startTime && slot.startTime <= endTime;
    } else {
      return slot.startTime >= endTime && slot.startTime <= startTime;
    }
  };

  const handleToggleAddOn = (id: string) => {
    setBookingDetails((prev) => ({
      ...prev,
      addOns: prev.addOns.map((addOn) =>
        addOn.id === id ? { ...addOn, selected: !addOn.selected } : addOn
      ),
    }));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetSelection();
  };

  const handleConfirmBooking = () => {
    // Store booking data in context for use in the confirmation page
    setBookingData({ ...bookingDetails });
    setIsModalOpen(false);

    // After confirming add-ons, navigate to login/confirmation page
    router.push("/login");
  };

  console.log("Selected date:", selectedDate);
  console.log("Selected date ISO:", selectedDate.toISOString());
  console.log("Selected date locale string:", selectedDate.toLocaleString());
  console.log("Fetching time slots for date:", selectedDate);
  return (
    <div className="animate-fade-in">
      <BookingInstructions />

      <RoomSelector
        rooms={rooms}
        selectedRoom={selectedRoom}
        onRoomChange={handleRoomChange}
        roomImages={roomImages}
      />

      <div className="mt-6 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border">
          <h3 className="text-lg font-medium mb-4">
            Horas disponibles - {rooms.find((r) => r.id === selectedRoom)?.name}
          </h3>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <span className="ml-2">Cargando disponibilidad...</span>
            </div>
          ) : (
            <RoomTimeslots
              rooms={rooms}
              selectedRoom={selectedRoom}
              timeSlots={timeSlots}
              isSelecting={isSelecting}
              onRoomChange={handleRoomChange}
              onSelectStart={handleSelectStart}
              onSelectEnd={handleSelectEnd}
              onMouseEnter={handleMouseEnter}
              isInSelectionRange={isInSelectionRange}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />
          )}
        </div>

        <div className="mt-8 bg-white rounded-xl p-4 shadow-sm border border-border">
          <h3 className="text-lg font-medium mb-4">
            Horas disponibles - Siguiente día
          </h3>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <span className="ml-2">Cargando disponibilidad...</span>
            </div>
          ) : (
            <RoomTimeslots
              rooms={rooms}
              selectedRoom={selectedRoom}
              timeSlots={nextDayTimeSlots}
              isSelecting={isSelecting}
              onRoomChange={handleRoomChange}
              onSelectStart={handleSelectStart}
              onSelectEnd={handleSelectEnd}
              onMouseEnter={handleMouseEnter}
              isInSelectionRange={isInSelectionRange}
            />
          )}
        </div>
      </div>

      <BookingModal
        isOpen={isModalOpen}
        bookingDetails={bookingDetails}
        onClose={handleCloseModal}
        onToggleAddOn={handleToggleAddOn}
        onConfirm={handleConfirmBooking}
      />
    </div>
  );
};

export default Calendar;
