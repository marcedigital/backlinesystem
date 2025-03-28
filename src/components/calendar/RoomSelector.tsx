"use client";

import Image from "next/image";
import React from "react";
import { cn } from "@/lib/utils";
import { Mic, Headphones } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Room } from "@/utils/bookingUtils";

interface RoomSelectorProps {
  rooms: Room[];
  selectedRoom: string;
  onRoomChange: (roomId: string) => void;
  roomImages: {
    [key: string]: string;
  };
}

const RoomSelector: React.FC<RoomSelectorProps> = ({
  rooms,
  selectedRoom,
  onRoomChange,
  roomImages,
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-base font-medium mb-3">Select a rehearsal room:</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {rooms.map((room) => (
          <div
            key={room.id}
            className={cn(
              "cursor-pointer transition-all duration-300 rounded-xl overflow-hidden border shadow-sm",
              selectedRoom === room.id
                ? "ring-2 ring-accent border-accent"
                : "border-gray-200 hover:border-accent"
            )}
            onClick={() => onRoomChange(room.id)}
          >
            <AspectRatio ratio={3 / 1}>
              <Image
                src={roomImages[room.id]}
                alt={room.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />{" "}
              <img
                src={roomImages[room.id]}
                alt={room.name}
                className="w-full h-full object-cover"
              />
            </AspectRatio>
            <div
              className={cn(
                "p-4",
                selectedRoom === room.id ? "bg-accent text-white" : "bg-white"
              )}
            >
              <div className="flex items-center">
                {room.id === "room1" ? (
                  <Mic className="mr-2 h-4 w-4" />
                ) : (
                  <Headphones className="mr-2 h-4 w-4" />
                )}
                <h3 className="font-medium">{room.name}</h3>
              </div>
              <p className="text-sm mt-1 opacity-80">
                {room.id === "room1"
                  ? "Perfect for bands and full rehearsals"
                  : "Ideal for solo musicians and vocalists"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomSelector;
