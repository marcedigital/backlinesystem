"use client";

import React from 'react';
import { Calendar, Clock, Music, CheckCircle } from 'lucide-react';

const BookingInstructions: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg mb-6 border border-border shadow-sm">
      <h3 className="font-medium text-black text-lg mb-6">Cómo reservar una sala</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Step 1 */}
        <div className="flex flex-col items-center text-center">
          <div className="bg-purple-100 p-3 rounded-full mb-3">
            <Calendar className="h-5 w-5 text-accent" />
          </div>
          <p className="font-medium mb-1">1. Elige fecha</p>
          <p className="text-sm text-gray-600">
            Selecciona el día en que deseas reservar la sala
          </p>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-center text-center">
          <div className="bg-purple-100 p-3 rounded-full mb-3">
            <Clock className="h-5 w-5 text-accent" />
          </div>
          <p className="font-medium mb-1">2. Selecciona horario</p>
          <p className="text-sm text-gray-600">
            Haz clic en la hora de inicio y fin para tu reserva
          </p>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col items-center text-center">
          <div className="bg-purple-100 p-3 rounded-full mb-3">
            <Music className="h-5 w-5 text-accent" />
          </div>
          <p className="font-medium mb-1">3. Selecciona extras</p>
          <p className="text-sm text-gray-600">
            Agrega equipos o servicios adicionales si lo necesitas
          </p>
        </div>

        {/* Step 4 */}
        <div className="flex flex-col items-center text-center">
          <div className="bg-purple-100 p-3 rounded-full mb-3">
            <CheckCircle className="h-5 w-5 text-accent" />
          </div>
          <p className="font-medium mb-1">4. Confirma tu reserva</p>
          <p className="text-sm text-gray-600">
            Revisa los detalles y completa el proceso de reserva
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingInstructions;
