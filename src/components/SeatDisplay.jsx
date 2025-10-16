// components/SeatDisplay.js
import React, { useState, useEffect } from 'react';
import { MapPin, ArrowRight, AlertTriangle, Users, Clock, RefreshCw, XCircle, CheckCircle, RotateCcw, Settings, Zap } from 'lucide-react';
import { MdAirlineSeatReclineExtra } from "react-icons/md";
import { GiSteeringWheel } from "react-icons/gi";

const SeatDisplay = ({ 
  seatData, 
  loading, 
  lastResetTime, 
  isAutoResetting, 
  manualReset,
  bookingStatus, // 🔥 NEW: Smart booking status
  checkSmartBookingEligibility,
  BOOKING_RULES // 🔥 NEW: Booking rules configuration
}) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorType, setErrorType] = useState('');
  const [showRulesModal, setShowRulesModal] = useState(false);

  // 🔥 Smart seat selection with all rules validation
  const handleSeatClick = (deck, row, col, price) => {
    if (!seatData?.seatLayout?.[deck]?.[row]) return;
    
    const seatStatus = seatData.seatLayout[deck][row][col];
    
    // 🔥 Rule 1: Check maintenance mode
    if (bookingStatus.maintenanceMode) {
      setErrorType('maintenance');
      setShowErrorModal(true);
      return;
    }

    // 🔥 Rule 2 & 4: Check if booking is allowed
    if (!bookingStatus.isBookingOpen && !bookingStatus.nextJourneyAvailable) {
      setErrorType('booking_closed');
      setShowErrorModal(true);
      return;
    }
    
    // Check if seat is sold (status 1) and not available for next journey
    if (seatStatus === 1 && !bookingStatus.nextJourneyAvailable) {
      setErrorType('seat_sold');
      setShowErrorModal(true);
      return;
    }
    
    const seatId = `${deck}-${row}-${col}`;
    const seatPrice = parseInt(price.replace('₹', ''));
    
    setSelectedSeats(prev => {
      const isSelected = prev.some(seat => seat.id === seatId);
      
      if (isSelected) {
        // Remove seat
        const updated = prev.filter(seat => seat.id !== seatId);
        setTotalPrice(current => current - seatPrice);
        return updated;
      } else {
        // Check seat limit
        if (prev.length >= 6) {
          setErrorType('seat_limit');
          setShowErrorModal(true);
          return prev;
        }
        
        // Add seat
        const updated = [...prev, { id: seatId, deck, row, col, price: seatPrice }];
        setTotalPrice(current => current + seatPrice);
        return updated;
      }
    });
  };

  // 🔥 Enhanced seat styling based on smart booking rules
  const getSeatClass = (status, seatId) => {
    const isSelected = selectedSeats.some(seat => seat.id === seatId);
    let baseClass = 'w-10 h-16 rounded-lg border-2 flex flex-col items-center justify-center text-sm font-medium transition-all duration-200 relative cursor-pointer';

    // 🔥 Maintenance mode styling
    if (bookingStatus.maintenanceMode) {
      return `${baseClass} bg-orange-50 border-orange-200 text-orange-400 cursor-not-allowed opacity-60`;
    }

    // 🔥 Next journey available - previously sold seats now available
    if (bookingStatus.nextJourneyAvailable && status === 1) {
      return `${baseClass} bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 hover:shadow-md`;
    }

    // Selected seat
    if (isSelected) {
      return `${baseClass} bg-red-500 border-red-600 text-white hover:shadow-md`;
    }

    // Booking closed but not maintenance
    if (!bookingStatus.isBookingOpen && !bookingStatus.nextJourneyAvailable) {
      if (status === 0) {
        return `${baseClass} bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60`;
      }
    }

    // Seat status based styling
    switch(status) {
      case 0: // Available
        return `${baseClass} bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-red-400 hover:shadow-md`;
      case 1: // Sold
        return `${baseClass} bg-gray-400 border-gray-500 text-white cursor-not-allowed opacity-80`;
      case 2: // Reserved
        return `${baseClass} bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200 hover:border-purple-400 hover:shadow-md`;
      default:
        return `${baseClass} bg-white border-gray-300 text-gray-700`;
    }
  };

  // 🔥 Enhanced seat rendering with smart status indicators
  const renderSeat = (status, row, col, deck) => {
    const seatId = `${deck}-${row}-${col}`;
    const seatNumber = `${String.fromCharCode(65 + row)}${col + 1}`;
    const price = seatData.seatPrices?.[deck]?.[row]?.[col] || '₹1200';
    const isSelected = selectedSeats.some(seat => seat.id === seatId);

    const getTooltipMessage = () => {
      if (bookingStatus.maintenanceMode) {
        return `System maintenance (${BOOKING_RULES.MAINTENANCE_START.hour}:00 AM - ${BOOKING_RULES.MAINTENANCE_END.hour}:00 AM)`;
      }
      if (bookingStatus.nextJourneyAvailable && status === 1) {
        return `Seat ${seatNumber} - Available for next journey - ${price}`;
      }
      if (!bookingStatus.isBookingOpen && !bookingStatus.nextJourneyAvailable) {
        return `Booking closed - ${bookingStatus.message}`;
      }
      if (status === 1) {
        return `Seat ${seatNumber} - Already sold`;
      }
      return `Seat ${seatNumber} - ${price}`;
    };

    return (
      <div key={seatId} className="relative group">
        <div 
          className={getSeatClass(status, seatId)} 
          onClick={() => handleSeatClick(deck, row, col, price)}
          title={getTooltipMessage()}
        >
          {/* Seat content based on status and booking rules */}
          {bookingStatus.maintenanceMode ? (
            <div className="flex flex-col items-center justify-center">
              <Settings className="w-4 h-4 mb-1" />
              <div className="text-[8px]">MAINT</div>
            </div>
          ) : status === 1 && !bookingStatus.nextJourneyAvailable ? (
            <div className="flex flex-col items-center justify-center">
              <div className="text-[10px] font-bold leading-tight">SOLD</div>
              <div className="text-[8px] opacity-80 mt-0.5">{seatNumber}</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-full h-0.5 bg-white transform rotate-45"></div>
                <div className="absolute w-full h-0.5 bg-white transform -rotate-45"></div>
              </div>
            </div>
          ) : status === 1 && bookingStatus.nextJourneyAvailable ? (
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs font-bold">{seatNumber}</div>
              <div className="text-[10px] mt-1">{price}</div>
              <div className="text-[8px] text-green-600 font-bold">NEXT</div>
            </div>
          ) : (
            <>
              <div className="text-xs font-bold">{seatNumber}</div>
              <div className="text-[10px] mt-1">{price}</div>
              {!bookingStatus.isBookingOpen && !bookingStatus.nextJourneyAvailable && status === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </>
          )}

          {/* Smart status indicators */}
          {bookingStatus.nextJourneyAvailable && status === 1 && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          )}
          
          {bookingStatus.maintenanceMode && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          )}
        </div>

        {/* Enhanced tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {getTooltipMessage()}
        </div>
      </div>
    );
  };

  // 🔥 Enhanced deck rendering with smart rules info
  const renderDeck = (seats, deckName) => {
    if (!seats || seats.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-gray-500">Loading seat layout...</div>
        </div>
      );
    }

    const seatStats = seats.reduce((stats, row) => {
      row.forEach(seat => {
        switch(seat) {
          case 0: stats.available++; break;
          case 1: 
            if (bookingStatus.nextJourneyAvailable) {
              stats.available++;
            } else {
              stats.sold++;
            }
            break;
          case 2: stats.reserved++; break;
          default: stats.available++; break;
        }
      });
      return stats;
    }, { available: 0, sold: 0, reserved: 0 });

    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-2 sm:p-4 ${
        bookingStatus.maintenanceMode ? 'opacity-60' : 
        !bookingStatus.isBookingOpen && !bookingStatus.nextJourneyAvailable ? 'opacity-75' : ''
      }`}>
        <div className="bg-white mr-12 p-2 sm:p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="inline-flex items-center bg-gray-100 px-4 py-2 rounded-full text-sm font-medium text-gray-700">
              {deckName === 'lower' ? 'Lower Deck' : 'Upper Deck'}
              <span className="ml-2 text-xs text-gray-500">
                ({seatStats.available} available, {seatStats.sold} sold, {seatStats.reserved} reserved)
                {bookingStatus.nextJourneyAvailable && (
                  <span className="text-green-600 font-medium"> - Next Journey Ready!</span>
                )}
                {bookingStatus.maintenanceMode && (
                  <span className="text-orange-600 font-medium"> - Maintenance Mode</span>
                )}
              </span>
            </div>
            {deckName === 'lower' && (
              <div className="text-black-600 px-3 py-2 flex items-center justify-center">
                <GiSteeringWheel className={`w-12 h-12 text-black ${
                  bookingStatus.nextJourneyAvailable ? 'animate-spin' : 
                  bookingStatus.maintenanceMode ? 'animate-pulse' : ''
                }`} />
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="inline-block min-w-full">
            <div className="space-y-4">
              {seats.map((row, rowIndex) => (
                <div key={rowIndex} className="flex items-center justify-center gap-x-2 sm:gap-x-4">
                  <div className="text-sm text-gray-500 w-5 text-center font-medium">{String.fromCharCode(65 + rowIndex)}</div>
                  <div className="flex gap-2 sm:gap-3">
                    {renderSeat(row[0], rowIndex, 0, deckName)}
                    {renderSeat(row[1], rowIndex, 1, deckName)}
                  </div>
                  <div className="w-10 sm:w-12 h-16"></div>
                  <div className="flex gap-2 sm:gap-3">
                    {renderSeat(row[2], rowIndex, 2, deckName)}
                  </div>
                  <div className="text-sm text-gray-500 w-5 text-center font-medium">{String.fromCharCode(65 + rowIndex)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Reset selections when booking status changes
  useEffect(() => {
    if (isAutoResetting || bookingStatus.maintenanceMode || 
        (!bookingStatus.isBookingOpen && !bookingStatus.nextJourneyAvailable)) {
      setSelectedSeats([]);
      setTotalPrice(0);
    }
  }, [isAutoResetting, bookingStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading smart booking system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* 🔥 Smart Booking Status Banner */}
        <div className={`border rounded-lg p-4 mb-4 ${
          bookingStatus.maintenanceMode 
            ? 'bg-orange-50 border-orange-200'
            : bookingStatus.nextJourneyAvailable 
              ? 'bg-green-50 border-green-200'
              : bookingStatus.isBookingOpen 
                ? 'bg-green-50 border-green-200' 
                : bookingStatus.busStatus === 'departed' 
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {bookingStatus.maintenanceMode ? (
                <Settings className="w-5 h-5 text-orange-600 animate-spin" />
              ) : bookingStatus.nextJourneyAvailable ? (
                <RotateCcw className="w-5 h-5 text-green-600" />
              ) : bookingStatus.isBookingOpen ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <div className={`font-semibold ${
                  bookingStatus.maintenanceMode ? 'text-orange-800' :
                  bookingStatus.nextJourneyAvailable ? 'text-green-800' :
                  bookingStatus.isBookingOpen ? 'text-green-800' : 'text-red-800'
                }`}>
                  {bookingStatus.message}
                </div>
                <div className={`text-sm ${
                  bookingStatus.maintenanceMode ? 'text-orange-700' :
                  bookingStatus.nextJourneyAvailable ? 'text-green-700' :
                  bookingStatus.isBookingOpen ? 'text-green-700' : 'text-red-700'
                }`}>
                  {bookingStatus.timeRemaining}
                  {bookingStatus.reasonCode === 'booking_cutoff' && (
                    <span className="ml-2 font-medium">
                      (Cutoff: {BOOKING_RULES.BOOKING_CUTOFF_MINUTES} min before departure)
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Smart Rules Info Button */}
              <button
                onClick={() => setShowRulesModal(true)}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
                title="View smart booking rules"
              >
                <Zap className="w-3 h-3" />
                Rules
              </button>
              
              {/* Bus Status Indicator */}
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                bookingStatus.busStatus === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                bookingStatus.busStatus === 'boarding' ? 'bg-yellow-100 text-yellow-800' :
                bookingStatus.busStatus === 'departed' ? 'bg-red-100 text-red-800' :
                bookingStatus.busStatus === 'arrived_waiting' ? 'bg-purple-100 text-purple-800' :
                bookingStatus.busStatus === 'next_journey' ? 'bg-green-100 text-green-800' :
                bookingStatus.busStatus === 'maintenance' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {bookingStatus.busStatus === 'scheduled' && '🕐 Scheduled'}
                {bookingStatus.busStatus === 'boarding' && '🚌 Boarding'}
                {bookingStatus.busStatus === 'departed' && '🚌 En Route'}
                {bookingStatus.busStatus === 'arrived_waiting' && '⏳ Arrived'}
                {bookingStatus.busStatus === 'next_journey' && '🔄 Next Journey'}
                {bookingStatus.busStatus === 'maintenance' && '🔧 Maintenance'}
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
            🚌 Smart Bus Seat Booking
          </h1>
          
          <div className="text-center text-gray-600 mb-4">
            <p>Total Seats: <span className="font-bold">{seatData?.totalSeats || 30}</span></p>
            {lastResetTime && (
              <p className="text-sm">
                Last Reset: <span className="font-medium">
                  {new Date(lastResetTime.toDate()).toLocaleString()}
                </span>
              </p>
            )}
          </div>

          {/* Seat legend */}
          <div className="flex justify-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span>Sold</span>
            </div>
            {bookingStatus.nextJourneyAvailable && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
                <span>Next Journey</span>
              </div>
            )}
            {bookingStatus.maintenanceMode && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded"></div>
                <span>Maintenance</span>
              </div>
            )}
          </div>
        </div>

        {/* Deck Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-2 mb-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button className="flex-1 px-4 py-2 rounded-md text-sm font-medium bg-red-500 text-white">
              Lower Deck
            </button>
          </div>
        </div>

        {/* Seat Layout */}
        <div className="space-y-6">
          {seatData?.seatLayout?.lowerDeck && renderDeck(
            Object.values(seatData.seatLayout.lowerDeck).map(row => Object.values(row)), 
            'lower'
          )}
          
          {seatData?.seatLayout?.upperDeck && renderDeck(
            Object.values(seatData.seatLayout.upperDeck).map(row => Object.values(row)), 
            'upper'
          )}
        </div>

        {/* Selected Seats Summary */}
        {selectedSeats.length > 0 && (bookingStatus.isBookingOpen || bookingStatus.nextJourneyAvailable) && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white shadow-2xl rounded-lg p-6 border-2 border-blue-500 z-30 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-3 text-center">🎫 Selected Seats</h3>
            
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {selectedSeats.map(seat => (
                <span key={seat.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {seat.deck === 'lower' ? 'L' : 'U'}-{String.fromCharCode(65 + seat.row)}{seat.col + 1}
                </span>
              ))}
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-3">
                Total: ₹{totalPrice.toLocaleString()}
              </div>
              
              <button 
                className={`font-bold py-3 px-6 rounded-lg w-full transition-all flex items-center justify-center gap-2 ${
                  bookingStatus.nextJourneyAvailable 
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
                onClick={() => alert(`Booking ${selectedSeats.length} seats for ₹${totalPrice}`)}
              >
                {bookingStatus.nextJourneyAvailable ? 'Book Next Journey' : 'Book Now'} ({selectedSeats.length} seats)
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 🔥 Smart Rules Modal */}
        {showRulesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowRulesModal(false)}></div>
            <div className="relative bg-white rounded-2xl p-6 max-w-lg mx-4 shadow-2xl">
              <div className="text-center mb-4">
                <Zap className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Smart Booking Rules</h3>
              </div>
              
              <div className="space-y-4 text-sm">
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="font-semibold text-orange-800 mb-1">🔧 Rule 1: Maintenance Window</div>
                  <div className="text-orange-700">
                    Booking blocked between {BOOKING_RULES.MAINTENANCE_START.hour}:00 AM - {BOOKING_RULES.MAINTENANCE_END.hour}:00 AM daily
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="font-semibold text-yellow-800 mb-1">⏰ Rule 2: Booking Cutoff</div>
                  <div className="text-yellow-700">
                    Booking closes {BOOKING_RULES.BOOKING_CUTOFF_MINUTES} minutes before departure
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="font-semibold text-blue-800 mb-1">🔄 Rule 3: Auto Seat Release</div>
                  <div className="text-blue-700">
                    All booked seats automatically reset when bus arrives
                  </div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="font-semibold text-green-800 mb-1">✅ Rule 4: Re-booking Window</div>
                  <div className="text-green-700">
                    Next journey booking opens {BOOKING_RULES.REBOOKING_WAIT_MINUTES} minute after arrival
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        )}

        {/* 🔥 Enhanced Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowErrorModal(false)}></div>
            <div className="relative bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
              <div className="text-center">
                {errorType === 'maintenance' ? (
                  <>
                    <Settings className="w-16 h-16 mx-auto mb-4 text-orange-600 animate-spin" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">System Maintenance</h3>
                    <p className="text-gray-600 mb-4">
                      Booking is temporarily unavailable during system maintenance.
                    </p>
                    <div className="bg-orange-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-orange-700">
                        <strong>Maintenance Window:</strong> {BOOKING_RULES.MAINTENANCE_START.hour}:00 AM - {BOOKING_RULES.MAINTENANCE_END.hour}:00 AM
                      </p>
                      <p className="text-sm text-orange-600 mt-1">
                        <strong>Resuming:</strong> {bookingStatus.timeRemaining}
                      </p>
                    </div>
                  </>
                ) : errorType === 'booking_closed' ? (
                  <>
                    <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Booking Closed</h3>
                    <p className="text-gray-600 mb-4">{bookingStatus.message}</p>
                    <div className="bg-red-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-red-700">
                        <strong>Status:</strong> {bookingStatus.timeRemaining}
                      </p>
                    </div>
                  </>
                ) : errorType === 'seat_sold' ? (
                  <>
                    <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Seat Already Sold</h3>
                    <p className="text-gray-600 mb-4">This seat has been booked by another passenger.</p>
                  </>
                ) : (
                  <>
                    <MdAirlineSeatReclineExtra className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Seat Limit Reached</h3>
                    <p className="text-gray-600 mb-4">You can select maximum 6 seats per booking.</p>
                  </>
                )}
                
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SeatDisplay;
