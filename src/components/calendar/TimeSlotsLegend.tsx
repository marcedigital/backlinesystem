"use client";

import React from 'react';

const TimeSlotsLegend: React.FC = () => {
  return (
    <div className="mt-6 pt-4 border-t flex flex-wrap gap-4">
      <div className="flex items-center">
        <div className="w-3 h-3 bg-white border border-gray-300 rounded-sm mr-2"></div>
        <span className="text-sm">Available</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-booking-light-blue border border-booking-blue rounded-sm mr-2"></div>
        <span className="text-sm">Selected</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-booking-gray rounded-sm mr-2"></div>
        <span className="text-sm">Unavailable</span>
      </div>
    </div>
  );
};

export default TimeSlotsLegend;
