import React, { useState } from 'react';
import { ChevronUp, X } from 'lucide-react';

// PointAccordion Component (exact same as before - reusable accordion with selection/deselection)
const PointAccordion = ({
  title,
  points,
  selectedPoint,
  onSelect,
  onDeselect,
  isOpen,
  onToggle,
  placeholder,
  selectedPointName,
}) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300">
    <div className="flex justify-between items-center p-4 cursor-pointer" onClick={onToggle}>
      <div className="flex-1">
        <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{selectedPointName || placeholder}</p>
          {selectedPointName && (
            <button
              onClick={e => {
                e.stopPropagation();
                onDeselect();
              }}
              className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <ChevronUp
        className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
          isOpen ? '' : 'rotate-180'
        }`}
      />
    </div>
    <div
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        isOpen ? 'max-h-[500px]' : 'max-h-0'
      }`}
    >
      <div className="divide-y divide-gray-100">
        {points && points.length ? (
          points.map((point, index) => (
            <div
              key={`${point.id}-${index}`}
              onClick={() => onSelect(point)}
              className="flex items-center p-4 gap-4 cursor-pointer hover:bg-red-50/50"
            >
              <div className="w-16 text-center">
                <p className="font-bold text-gray-800">{point.time || 'N/A'}</p>
                {point.date && <p className="text-xs text-red-500 font-semibold">{point.date}</p>}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{point.name}</p>
                <p className="text-sm text-gray-500">{point.address}</p>
                {point.landmark && <p className="text-xs text-gray-400">📍 {point.landmark}</p>}
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedPoint === point.id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {selectedPoint === point.id && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">No {title.toLowerCase()} available</div>
        )}
      </div>
    </div>
  </div>
);

const BoardingPointCard = ({
  onContinue,
  boardingPoints = [],
  droppingPoints = [],
  loading = false,
  selectedSeats = [],
  seatLayout = {},
  busData = null,
}) => {
  const [activeSection, setActiveSection] = useState('boarding');
  const [selectedBoarding, setSelectedBoarding] = useState(null);
  const [selectedDropping, setSelectedDropping] = useState(null);

  // Calculate total amount from seats
  const calculateTotalAmount = () => {
    if (!selectedSeats.length || !seatLayout?.seatPrices) return 0;
    return selectedSeats.reduce((total, seatId) => {
      const [deck, row, col] = seatId.split('-');
      const priceString = seatLayout.seatPrices?.[deck]?.[parseInt(row)]?.[parseInt(col)];
      if (!priceString) return total;
      const price = parseInt(priceString.replace('₹', '')) || 0;
      return total + price;
    }, 0);
  };

  // Convert seat IDs to human-readable format
  const formatSeatNames = () => {
    return selectedSeats
      .map(seatId => {
        const [deck, rowStr, colStr] = seatId.split('-');
        const row = parseInt(rowStr);
        const col = parseInt(colStr);
        return `${String.fromCharCode(65 + row)}${col + 1}`;
      })
      .join(', ');
  };

  const toggleSection = section => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleSelectBoarding = point => {
    setSelectedBoarding(point);
    setActiveSection('dropping');
  };

  const handleSelectDropping = point => {
    setSelectedDropping(point);
  };

  const handleDeselectBoarding = () => {
    setSelectedBoarding(null);
    setActiveSection('boarding');
  };

  const handleDeselectDropping = () => {
    setSelectedDropping(null);
    setActiveSection('dropping');
  };

  const handleClearAllSelections = () => {
    setSelectedBoarding(null);
    setSelectedDropping(null);
    setActiveSection('boarding');
  };

  const handleContinue = () => {
    if (selectedBoarding && selectedDropping && onContinue) {
      onContinue({
        boardingPoint: selectedBoarding,
        droppingPoint: selectedDropping,
        busData,
        busId: busData?.id || null,
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 font-sans min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-2 text-gray-600">Loading boarding points...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 font-sans min-h-screen">
      {/* Selected seats summary */}
      {selectedSeats.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="font-bold text-gray-800 text-lg mb-2">Selected Seats</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{selectedSeats.length} seat(s):</span> {formatSeatNames()}
              </p>
              <p className="text-sm text-gray-500">
                Lower & Upper Deck seats selected
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-red-600">₹{calculateTotalAmount()}</p>
              <p className="text-xs text-gray-500">Total Amount</p>
            </div>
          </div>
        </div>
      )}

      {/* Bus information display */}
      {busData && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="font-semibold text-gray-700 text-base">
            {busData.operatorName || busData.operator} - {busData.route?.from} → {busData.route?.to} (₹{busData.price || busData.fare || 'N/A'})
          </div>
        </div>
      )}

      {/* Clear selections button */}
      {(selectedBoarding || selectedDropping) && (
        <div className="mb-4">
          <button
            onClick={handleClearAllSelections}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
          >
            🧹 Clear All Selections
          </button>
        </div>
      )}

      {/* Boarding/Dropping Point Accordions */}
      <div className="space-y-4">
        <PointAccordion
          title="Boarding points"
          points={boardingPoints}
          selectedPoint={selectedBoarding?.id}
          onSelect={handleSelectBoarding}
          onDeselect={handleDeselectBoarding}
          isOpen={activeSection === 'boarding'}
          onToggle={() => toggleSection('boarding')}
          placeholder="Select Boarding Point"
          selectedPointName={selectedBoarding?.name}
        />
        <PointAccordion
          title="Dropping points"
          points={droppingPoints}
          selectedPoint={selectedDropping?.id}
          onSelect={handleSelectDropping}
          onDeselect={handleDeselectDropping}
          isOpen={activeSection === 'dropping'}
          onToggle={() => toggleSection('dropping')}
          placeholder="Select Dropping Point"
          selectedPointName={selectedDropping?.name}
        />
      </div>

      {/* Continue Button */}
      <div className="mt-8 sticky bottom-4">
        <button
          onClick={handleContinue}
          disabled={!selectedBoarding || !selectedDropping}
          className={`w-full py-3.5 rounded-xl font-bold text-lg text-white transition-all duration-300 transform ${
            selectedBoarding && selectedDropping ? 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default BoardingPointCard;
