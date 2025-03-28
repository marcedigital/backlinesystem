"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check, Music, Drum } from "lucide-react";
import { AddOn } from "@/utils/bookingUtils";
import Image from "next/image";

interface AddOnItemProps {
  addOn: AddOn;
  onToggle: (id: string) => void;
}

const AddOnItem: React.FC<AddOnItemProps> = ({ addOn, onToggle }) => {
  // Function to get the appropriate icon for each add-on
  const getIcon = (addOnId: string) => {
    switch (addOnId) {
      case "1": // Platillos
        return <Music className="w-4 h-4" />;
      case "2": // Pedal Doble
        return <Drum className="w-4 h-4" />;
      default:
        return <Music className="w-4 h-4" />;
    }
  };

  // Format currency as Costa Rican Colones
  const formatCurrency = (amount: number) => {
    return `₡${amount.toLocaleString("es-CR")}`;
  };

  return (
    <div
      className={cn(
        "flex items-start p-4 border rounded-xl transition-all duration-200 mb-3",
        addOn.selected
          ? "border-booking-blue bg-booking-light-blue shadow-sm"
          : "border-border hover:border-booking-blue/50 hover:shadow-sm"
      )}
      onClick={() => onToggle(addOn.id)}
    >
      {addOn.image && (
        <div className="mr-3 flex-shrink-0">
          <Image
            src={addOn.image}
            alt={addOn.name}
            width={56} // w-14 is equivalent to 56px (14 * 4px)
            height={56} // h-14 is equivalent to 56px (14 * 4px)
            className="object-cover rounded-md"
          />
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center">
          <div className="mr-2">{getIcon(addOn.id)}</div>
          <h3 className="text-base font-medium">{addOn.name}</h3>
          <div
            className={cn(
              "ml-2 w-5 h-5 rounded-full flex items-center justify-center transition-all",
              addOn.selected
                ? "bg-booking-blue text-white"
                : "border border-gray-300"
            )}
          >
            {addOn.selected && <Check className="w-3 h-3" />}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {addOn.description}
        </p>
      </div>
      <div className="font-medium text-base ml-4">
        {formatCurrency(addOn.price)}/hora
      </div>
    </div>
  );
};

export default AddOnItem;
