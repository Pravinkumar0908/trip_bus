// src/components/BookingSummary.jsx

import React from 'react';
import { ChevronRight } from 'lucide-react';

// FIX: Added onButtonClick and buttonText as props
const BookingSummary = ({ totalAmount, seatCount, onButtonClick, buttonText }) => {
  // If no seats are selected, the parent component won't render this anyway,
  // but this check is good for safety.
  if (seatCount === 0) {
    return null;
  }

  return (
    // The main container now has a dark red background.
    <div className="p-3 bg-red-600 text-white rounded-lg h-full">
      <div className="flex justify-between items-center h-full">
        {/* Left side: Price Details */}
        <div className="flex-shrink-0">
          <p className="text-2xl font-bold text-white">
            ₹{totalAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-red-200">
            For {seatCount} Seat{seatCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* FIX: Right side: Dynamic Button */}
        {/* This button will now handle moving to the next step. */}
        <button
          onClick={onButtonClick}
          className="flex items-center justify-center gap-2 bg-white text-red-600 font-bold py-2 px-4 rounded-full shadow-md hover:bg-red-50 transition-all duration-300 transform hover:scale-105"
        >
          <span>{buttonText}</span>
        </button>
      </div>
    </div>
  );
};

export default BookingSummary;
