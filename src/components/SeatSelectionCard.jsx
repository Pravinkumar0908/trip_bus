// components/SeatSelectionCard.jsx
import { useState, useEffect } from 'react';
import { MapPin, ArrowRight, AlertTriangle, Users, Clock, RefreshCw, XCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { MdAirlineSeatReclineExtra } from "react-icons/md";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { GiSteeringWheel } from "react-icons/gi";

const SeatSelectionCard = ({
  selectedSeats, setSelectedSeats, activeDeck, setActiveDeck,
  selectedSeatInfo, setSelectedSeatInfo, lowerDeckSeats, upperDeckSeats, seatPrices,
  onProceed, currentRoute,
  // 🚀 Real-time props
  isRealTime = false,
  lastUpdateTime = null,
  isAutoRefreshing = true,
  onToggleAutoRefresh = () => { },
  // 🔥 Seat reset functionality
  onSeatReset = () => { }
}) => {
  const [, setHoveredSeat] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [realTimeStatus, setRealTimeStatus] = useState('');

  // 🔥 Booking status states with seat availability
  const [bookingStatus, setBookingStatus] = useState({
    isBookingOpen: true,
    message: '',
    timeRemaining: '',
    busStatus: 'scheduled', // 'scheduled', 'boarding', 'departed', 'arrived', 'next_journey'
    canResetSeats: false,
    nextJourneyAvailable: false
  });

  // SEAT LIMIT CONFIGURATION
  const MAX_SEATS = 6;
  const BOOKING_CUTOFF_MINUTES = 20; // 20 minutes before departure

  const SEAT_WIDTH = 'w-10';
  const SEAT_HEIGHT = 'h-16';
  const AISLE_WIDTH = 'w-10 sm:w-12';
  const SEAT_GROUP_GAP = 'gap-2 sm:gap-3';
  const ROW_SPACING_Y = 'space-y-4';

  // 🔥 Convert 12-hour time to minutes for comparison
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;

    // Handle both 12-hour (9:30 AM) and 24-hour (09:30) formats
    let time, period = '';

    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      // 12-hour format
      const parts = timeStr.split(' ');
      time = parts[0];
      period = parts[1];
    } else {
      // 24-hour format - convert to 12-hour
      const [hours, minutes] = timeStr.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      period = hour24 >= 12 ? 'PM' : 'AM';
      time = `${hour12}:${minutes}`;
    }

    const [hours, minutes] = time.split(':');
    let totalMinutes = parseInt(hours) * 60 + parseInt(minutes);

    if (period === 'PM' && parseInt(hours) !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === 'AM' && parseInt(hours) === 12) {
      totalMinutes = parseInt(minutes);
    }

    return totalMinutes;
  };

  // 🔥 Get current time in minutes
  const getCurrentTimeInMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  // 🔥 Reset all seats to available (status 0)
  const resetAllSeats = () => {
    console.log('🔄 Resetting all seats to available status...');

    // Call parent component function to reset seat data
    if (onSeatReset) {
      onSeatReset();
    }

    // Clear selected seats
    setSelectedSeats([]);
    setSelectedSeatInfo(null);

    // Update booking status
    setBookingStatus(prev => ({
      ...prev,
      canResetSeats: false,
      nextJourneyAvailable: true,
      message: '✅ Seats reset - Ready for next journey',
      busStatus: 'next_journey'
    }));

    console.log('✅ All seats have been reset to available status');
  };

  // 🔥 Enhanced booking eligibility check
  const checkBookingEligibility = () => {
    if (!currentRoute?.departureTime || !currentRoute?.arrivalTime) {
      setBookingStatus({
        isBookingOpen: true,
        message: '🕐 Checking bus timing...',
        timeRemaining: '',
        busStatus: 'scheduled',
        canResetSeats: false,
        nextJourneyAvailable: false
      });
      return;
    }

    const currentTimeMinutes = getCurrentTimeInMinutes();
    const departureTimeMinutes = timeToMinutes(currentRoute.departureTime);
    const arrivalTimeMinutes = timeToMinutes(currentRoute.arrivalTime);

    console.log('🕐 Time Check:', {
      current: currentTimeMinutes,
      departure: departureTimeMinutes,
      arrival: arrivalTimeMinutes,
      departureTime: currentRoute.departureTime,
      arrivalTime: currentRoute.arrivalTime
    });

    // Handle next day scenario
    let effectiveDepartureTime = departureTimeMinutes;
    let effectiveArrivalTime = arrivalTimeMinutes;

    if (arrivalTimeMinutes < departureTimeMinutes) {
      // Journey goes to next day
      if (currentTimeMinutes > departureTimeMinutes) {
        // Same day, before midnight
        effectiveArrivalTime = arrivalTimeMinutes + (24 * 60);
      } else {
        // Next day, after midnight
        effectiveDepartureTime = departureTimeMinutes - (24 * 60);
      }
    }

    const timeToDeparture = effectiveDepartureTime - currentTimeMinutes;
    const timeToArrival = effectiveArrivalTime - currentTimeMinutes;

    console.log('🔄 Calculated times:', {
      timeToDeparture,
      timeToArrival,
      cutoffTime: BOOKING_CUTOFF_MINUTES
    });

    // Check if bus has arrived - Enable seat reset
    if (timeToArrival <= 0) {
      setBookingStatus({
        isBookingOpen: true,
        message: '🟢 Bus arrived - Ready for next journey!',
        timeRemaining: 'Journey completed',
        busStatus: 'arrived',
        canResetSeats: true,
        nextJourneyAvailable: true
      });
      setRealTimeStatus('🟢 Bus arrived - All seats available for next journey!');
      return;
    }

    // Check if bus has departed but not arrived yet
    if (timeToDeparture <= 0 && timeToArrival > 0) {
      const arrivalHours = Math.floor(timeToArrival / 60);
      const arrivalMinutes = timeToArrival % 60;
      const arrivalTimeString = arrivalHours > 0 ? `${arrivalHours}h ${arrivalMinutes}m` : `${arrivalMinutes}m`;

      setBookingStatus({
        isBookingOpen: false,
        message: '🔴 Bus has departed - En route to destination',
        timeRemaining: `Arriving in ${arrivalTimeString}`,
        busStatus: 'departed',
        canResetSeats: false,
        nextJourneyAvailable: false
      });
      setRealTimeStatus(`🔴 Bus departed - Arriving in ${arrivalTimeString}`);
      return;
    }

    // Check if booking cutoff time has passed
    if (timeToDeparture <= BOOKING_CUTOFF_MINUTES && timeToDeparture > 0) {
      const remainingMinutes = Math.max(0, timeToDeparture);
      setBookingStatus({
        isBookingOpen: false,
        message: '🟡 Booking closed - Too close to departure',
        timeRemaining: `Departing in ${remainingMinutes} minutes`,
        busStatus: 'boarding',
        canResetSeats: false,
        nextJourneyAvailable: false
      });
      setRealTimeStatus(`🟡 Booking closed - Departing in ${remainingMinutes} minutes`);
      return;
    }

    // Booking is open
    const hours = Math.floor(timeToDeparture / 60);
    const minutes = timeToDeparture % 60;
    const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    setBookingStatus({
      isBookingOpen: true,
      message: '✅ Booking is open',
      timeRemaining: `Departing in ${timeString}`,
      busStatus: 'scheduled',
      canResetSeats: false,
      nextJourneyAvailable: false
    });
    setRealTimeStatus(`🟢 Booking open - Departing in ${timeString}`);
  };

  // 🚀 Enhanced real-time status check
  useEffect(() => {
    checkBookingEligibility();

    // Update every second for real-time tracking
    const interval = setInterval(checkBookingEligibility, 1000);

    return () => clearInterval(interval);
  }, [currentRoute]);

  // 🔥 **UPDATED**: Enhanced seat status mapping - Status 1 is BLOCKED/SOLD
  const seatTypes = {
    0: {
      label: 'Available',
      bgClass: 'bg-white',
      borderClass: 'border-gray-300',
      hoverClass: 'hover:bg-gray-50 hover:border-red-400',
      textClass: 'text-gray-700'
    },
    1: {
      label: 'SOLD', // **UPDATED**: Status 1 = SOLD/BLOCKED
      bgClass: 'bg-red-500', // **UPDATED**: Red background for sold seats
      borderClass: 'border-red-600',
      textClass: 'text-white',
      disabled: true // **BLOCKED**: Cannot be selected
    },
    2: {
      label: 'Reserved',
      bgClass: 'bg-purple-100',
      borderClass: 'border-purple-300',
      hoverClass: 'hover:bg-purple-200 hover:border-purple-400',
      textClass: 'text-purple-700'
    },
    3: {
      label: 'Ladies',
      bgClass: 'bg-pink-100',
      borderClass: 'border-pink-300',
      hoverClass: 'hover:bg-pink-200 hover:border-pink-400',
      textClass: 'text-pink-700'
    },
    selected: {
      label: 'Selected',
      bgClass: 'bg-blue-500',
      borderClass: 'border-blue-600',
      textClass: 'text-white'
    }
  };

  // 🔥 **UPDATED**: Enhanced toggleSeat function - BLOCK seats with status 1
  const toggleSeat = (deck, row, col) => {
    // Check if booking is open before allowing seat selection
    if (!bookingStatus.isBookingOpen && !bookingStatus.nextJourneyAvailable) {
      console.log('❌ Booking is closed:', bookingStatus.message);
      setShowErrorModal(true);
      return;
    }

    const seatId = `${deck}-${row}-${col}`;
    const currentDeckSeats = deck === 'lower' ? lowerDeckSeats : upperDeckSeats;

    // Check if seat data exists
    if (!currentDeckSeats[row] || currentDeckSeats[row][col] === undefined) {
      console.error('Seat data not available for:', seatId);
      return;
    }

    const seatStatus = currentDeckSeats[row][col];

    // 🔥 **UPDATED**: BLOCK all seats with status 1 (SOLD seats)
    if (seatStatus === 1) {
      console.log('❌ Cannot select SOLD seat:', seatId, 'Status:', seatStatus);
      setShowErrorModal(true); // Show error modal for sold seats
      return; // **COMPLETELY BLOCK** sold seats
    }

    // Check if seat is already selected
    if (selectedSeats.includes(seatId)) {
      // Deselect seat
      const newSelectedSeats = selectedSeats.filter(id => id !== seatId);
      setSelectedSeats(newSelectedSeats);

      // Update seat info
      if (newSelectedSeats.length > 0) {
        const lastSeatId = newSelectedSeats[newSelectedSeats.length - 1];
        const [lastDeck, lastRowStr, lastColStr] = lastSeatId.split('-');
        const lastRow = parseInt(lastRowStr);
        const lastCol = parseInt(lastColStr);
        const priceData = seatPrices[lastDeck]?.[lastRow]?.[lastCol];

        setSelectedSeatInfo({
          seat: `${String.fromCharCode(65 + lastRow)}${lastCol + 1}`,
          price: priceData || '₹0',
          deck: lastDeck === 'lower' ? 'Lower' : 'Upper',
          position: lastCol === 1 ? 'Aisle' : 'Window',
        });
      } else {
        setSelectedSeatInfo(null);
      }
    } else {
      // Check seat limit before selecting
      if (selectedSeats.length >= MAX_SEATS) {
        setShowErrorModal(true);
        return;
      }

      // Select seat
      const newSelectedSeats = [...selectedSeats, seatId];
      setSelectedSeats(newSelectedSeats);

      // Update seat info
      const priceData = seatPrices[deck]?.[row]?.[col];
      setSelectedSeatInfo({
        seat: `${String.fromCharCode(65 + row)}${col + 1}`,
        price: priceData || '₹0',
        deck: deck === 'lower' ? 'Lower' : 'Upper',
        position: col === 1 ? 'Aisle' : 'Window',
      });
    }
  };

  // 🔥 **UPDATED**: Enhanced seat styling - Show SOLD seats clearly
  const getSeatClass = (status, seatId) => {
    const isSelected = selectedSeats.includes(seatId);

    let baseClass = `${SEAT_WIDTH} ${SEAT_HEIGHT} rounded-lg border-2 flex flex-col items-center justify-center text-sm font-medium transition-all duration-200 relative`;

    // Special styling when bus has arrived and seats are available
    if (bookingStatus.busStatus === 'arrived' && bookingStatus.nextJourneyAvailable) {
      if (status === 1) {
        // Previously sold seats are now available
        return `${baseClass} bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 cursor-pointer hover:shadow-md`;
      }
    }

    // If booking is closed and not ready for next journey, make available seats appear disabled
    if (!bookingStatus.isBookingOpen && !bookingStatus.nextJourneyAvailable && status === 0) {
      return `${baseClass} bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60`;
    }

    // If seat is selected by user, override with selected style
    if (isSelected) {
      const selectedType = seatTypes.selected;
      return `${baseClass} ${selectedType.bgClass} ${selectedType.borderClass} ${selectedType.textClass} cursor-pointer hover:shadow-md`;
    }

    // Handle different seat statuses from database
    const seatType = seatTypes[status] || seatTypes[0]; // Default to available

    // 🔥 **UPDATED**: Special handling for SOLD seats (status 1) - Make them clearly blocked
    if (status === 1) {
      return `${baseClass} ${seatType.bgClass} ${seatType.borderClass} ${seatType.textClass} cursor-not-allowed opacity-90 select-none hover:opacity-100`;
    }

    // Regular seats with hover effects (only if booking is open or next journey available)
    const hoverClass = (bookingStatus.isBookingOpen || bookingStatus.nextJourneyAvailable) ? (seatType.hoverClass || '') : '';
    const cursorClass = (bookingStatus.isBookingOpen || bookingStatus.nextJourneyAvailable) ? 'cursor-pointer' : 'cursor-not-allowed';

    return `${baseClass} ${seatType.bgClass} ${seatType.borderClass} ${seatType.textClass} ${hoverClass} ${cursorClass} hover:shadow-md`;
  };

  // 🔥 **UPDATED**: Enhanced seat rendering - Clear SOLD display
  const renderSeat = (status, row, col, deck) => {
    const seatId = `${deck}-${row}-${col}`;
    const seatNumber = `${String.fromCharCode(65 + row)}${col + 1}`;
    const price = seatPrices[deck]?.[row]?.[col] || '₹0';
    const isSelected = selectedSeats.includes(seatId);

    // Determine tooltip message based on booking status
    const getTooltipMessage = () => {
      if (status === 1 && !bookingStatus.nextJourneyAvailable) {
        return `Seat ${seatNumber} - SOLD (Cannot be selected)`;
      }
      if (bookingStatus.busStatus === 'arrived' && status === 1) {
        return `Seat ${seatNumber} - Now available for next journey - ${price}`;
      }
      if (!bookingStatus.isBookingOpen && !bookingStatus.nextJourneyAvailable && status === 0) {
        return `Booking closed - ${bookingStatus.message}`;
      }
      if (status === 2) {
        return `Reserved seat ${seatNumber} - ${price}`;
      }
      return `Seat ${seatNumber} - ${price}`;
    };

    return (
      <div
        key={seatId}
        className="relative group"
        onMouseEnter={() => setHoveredSeat(seatId)}
        onMouseLeave={() => setHoveredSeat(null)}
      >
        <div
          className={getSeatClass(status, seatId)}
          onClick={() => toggleSeat(deck, row, col)}
          title={getTooltipMessage()}
        >
          {/* 🔥 **UPDATED**: Show clear SOLD indication for status 1 */}
          {status === 1 && !bookingStatus.nextJourneyAvailable ? (
            // **SOLD seats** - Clear blocked indication
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs font-bold leading-tight">SOLD</div>
              <div className="text-[8px] opacity-90 mt-0.5">{seatNumber}</div>
            </div>
          ) : status === 1 && bookingStatus.nextJourneyAvailable ? (
            // Previously sold seats, now available for next journey
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs font-bold">{seatNumber}</div>
              <div className="text-[10px] mt-1">{price}</div>
              <div className="text-[8px] text-green-600 font-bold">RESET</div>
            </div>
          ) : status === 2 ? (
            // Reserved seats
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs font-bold">{seatNumber}</div>
              <div className="text-[8px] mt-0.5">RES</div>
            </div>
          ) : (
            // Available seats (status 0) and selected seats
            <>
              <div className="text-xs font-bold">{seatNumber}</div>
              <div className="text-[10px] mt-1">{price}</div>
              {/* Show booking closed indicator on available seats */}
              {!bookingStatus.isBookingOpen && !bookingStatus.nextJourneyAvailable && status === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </>
          )}

          {/* 🔥 **UPDATED**: Visual cross indicator for SOLD seats (status 1) */}
          {status === 1 && !bookingStatus.nextJourneyAvailable && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-full h-0.5 bg-white transform rotate-45"></div>
              <div className="absolute w-full h-0.5 bg-white transform -rotate-45"></div>
            </div>
          )}

          {/* Next journey indicator for reset seats */}
          {bookingStatus.nextJourneyAvailable && status === 1 && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-garyu-400 rounded-full animate-pulse"></div>
          )}

          {/* Real-time update indicator */}
          {isRealTime && status === 0 && bookingStatus.isBookingOpen && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          )}
        </div>

        {/* Enhanced tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {getTooltipMessage()}
        </div>
      </div>
    );
  };

  const renderDeck = (seats, deckName) => {
    // Show loading if seats data is not available
    if (!seats || seats.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-gray-500">Loading seat layout...</div>
        </div>
      );
    }

    // 🔥 Calculate seat statistics
    const seatStats = seats.reduce((stats, row) => {
      row.forEach(seat => {
        switch (seat) {
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

    const totalSeatsCount = seats.length * 3;

    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-2 sm:p-4 ${!bookingStatus.isBookingOpen && !bookingStatus.nextJourneyAvailable ? 'opacity-75' : ''}`}>
        <div className="bg-white mr-12 p-2 sm:p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="inline-flex items-center bg-gray-100 px-4 py-2 rounded-full text-sm font-medium text-gray-700">
              {deckName === 'lower' ? 'Lower Deck' : 'Upper Deck'}
              {/* Show updated seat statistics */}
              <span className="ml-2 text-xs text-gray-500">
                ({seatStats.available} available, {seatStats.sold} sold, {seatStats.reserved} reserved)
                {bookingStatus.nextJourneyAvailable && seatStats.available === totalSeatsCount && (
                  <span className="text-green-600 font-medium"> - Ready for next journey!</span>
                )}
              </span>
            </div>
            {deckName === 'lower' && (
              <div className="text-black-600 px-3 py-2 flex items-center justify-center">
                <GiSteeringWheel className={`w-12 h-12 text-black ${bookingStatus.nextJourneyAvailable ? 'animate-spin' : ''}`} />
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="inline-block min-w-full">
            <div className={`${ROW_SPACING_Y}`}>
              {seats.map((row, rowIndex) => (
                <div key={rowIndex} className="flex items-center justify-center gap-x-2 sm:gap-x-4">
                  <div className="text-sm text-gray-500 w-5 text-center font-medium">{String.fromCharCode(65 + rowIndex)}</div>
                  <div className={`flex ${SEAT_GROUP_GAP}`}>
                    {renderSeat(row[0], rowIndex, 0, deckName)}
                    {renderSeat(row[1], rowIndex, 1, deckName)}
                  </div>
                  <div className={`${AISLE_WIDTH} ${SEAT_HEIGHT}`}></div>
                  <div className={`flex ${SEAT_GROUP_GAP}`}>
                    {renderSeat(row[2], rowIndex, 2, deckName)}
                  </div>
                  <div className="text-sm text-gray-500 w-5 text-center font-medium">{String.fromCharCode(65 + rowIndex)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {deckName === 'lower' && (
          <div className="text-center mt-4">
            <div className="inline-flex items-center bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-medium">
              <MapPin className="w-3 h-3 mr-1" />Entry/Exit
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 p-1 bg-gray-50 min-h-screen">
      {/* Enhanced Booking Status Banner */}
      <div className={`border rounded-lg p-4 mb-4 mx-2 ${bookingStatus.nextJourneyAvailable
          ? 'bg-green-50 border-green-200'
          : bookingStatus.isBookingOpen
            ? 'bg-green-50 border-green-200'
            : bookingStatus.busStatus === 'departed'
              ? 'bg-red-50 border-red-200'
              : bookingStatus.busStatus === 'arrived'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-yellow-50 border-yellow-200'
        }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {bookingStatus.nextJourneyAvailable ? (
              <RotateCcw className="w-5 h-5 text-green-600" />
            ) : bookingStatus.isBookingOpen ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <div className={`font-semibold ${bookingStatus.nextJourneyAvailable ? 'text-green-800' :
                  bookingStatus.isBookingOpen ? 'text-green-800' : 'text-red-800'
                }`}>
                {bookingStatus.message}
              </div>
              <div className={`text-sm ${bookingStatus.nextJourneyAvailable ? 'text-green-700' :
                  bookingStatus.isBookingOpen ? 'text-green-700' : 'text-red-700'
                }`}>
                {bookingStatus.timeRemaining}
                {bookingStatus.busStatus === 'boarding' && (
                  <span className="ml-2 font-medium">
                    (Booking closes {BOOKING_CUTOFF_MINUTES} minutes before departure)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Seat Reset Button */}
            {bookingStatus.canResetSeats && (
              <button
                onClick={resetAllSeats}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                title="Reset all seats for next journey"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Seats
              </button>
            )}

            {/* Bus Status Indicator */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${bookingStatus.busStatus === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                bookingStatus.busStatus === 'boarding' ? 'bg-yellow-100 text-yellow-800' :
                  bookingStatus.busStatus === 'departed' ? 'bg-red-100 text-red-800' :
                    bookingStatus.busStatus === 'arrived' ? 'bg-green-100 text-green-800' :
                      bookingStatus.busStatus === 'next_journey' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
              }`}>
              {bookingStatus.busStatus === 'scheduled' && '🕐 Scheduled'}
              {bookingStatus.busStatus === 'boarding' && '🚌 Boarding'}
              {bookingStatus.busStatus === 'departed' && '🚌 En Route'}
              {bookingStatus.busStatus === 'arrived' && '✅ Arrived'}
              {bookingStatus.busStatus === 'next_journey' && '🔄 Next Journey'}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Status Banner */}
      {isRealTime && realTimeStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 mx-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{realTimeStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleAutoRefresh}
                className={`p-1 rounded-full text-xs ${isAutoRefreshing
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                  }`}
                title={isAutoRefreshing ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              >
                <RefreshCw className={`w-3 h-3 ${isAutoRefreshing ? 'animate-spin' : ''}`} />
              </button>
              {lastUpdateTime && (
                <span className="text-xs text-blue-600">
                  Updated: {lastUpdateTime.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔥 **UPDATED**: Enhanced Error Modal for SOLD seats */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowErrorModal(false)}></div>
          <div className="relative bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              {!bookingStatus.isBookingOpen && !bookingStatus.nextJourneyAvailable ? (
                // Booking closed modal
                <>
                  <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-12 h-12 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Booking Closed!</h3>
                  <p className="text-gray-600 mb-4">
                    {bookingStatus.message}
                  </p>
                  <div className="bg-red-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-red-700">
                      <strong>Reason:</strong> {
                        bookingStatus.busStatus === 'departed' ? 'Bus has already departed' :
                          bookingStatus.busStatus === 'arrived' ? 'Bus journey is completed' :
                            `Booking closes ${BOOKING_CUTOFF_MINUTES} minutes before departure`
                      }
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      <strong>Status:</strong> {bookingStatus.timeRemaining}
                    </p>
                    {bookingStatus.busStatus === 'arrived' && (
                      <p className="text-sm text-green-600 mt-2">
                        <strong>Next:</strong> Seats will be available for next journey after reset
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowErrorModal(false)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    Understood
                  </button>
                </>
              ) : selectedSeats.length >= MAX_SEATS ? (
                // Seat limit modal
                <>
                  <div className="w-40 h-40 -rotate-[33deg] flex items-center justify-center mx-auto mb-4 relative">
                    <MdAirlineSeatReclineExtra className="w-28 h-28 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Seat Limit Reached!</h3>
                  <p className="text-gray-600 mb-4">
                    You can select maximum <span className="font-bold text-red-600">{MAX_SEATS} seats</span> per booking.
                  </p>
                  <button
                    onClick={() => setShowErrorModal(false)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    Okay
                  </button>
                </>
              ) : (
                // **NEW**: SOLD seat selection error modal
                <>
                  <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-12 h-12 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Seat Already SOLD!</h3>
                  <p className="text-gray-600 mb-4">
                    This seat has already been purchased by another passenger and cannot be selected.
                  </p>
                  <div className="bg-red-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-red-700">
                      <strong>Status:</strong> Booked – This seat is no longer available.
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      Kindly choose a seat from the available options.
                    </p>

                  </div>
                  <button
                    onClick={() => setShowErrorModal(false)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    Choose Different Seat
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected Seats Warning */}
      {selectedSeats.length >= MAX_SEATS - 1 && (bookingStatus.isBookingOpen || bookingStatus.nextJourneyAvailable) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 mx-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              {selectedSeats.length === MAX_SEATS - 1
                ? `You can select only 1 more seat (${selectedSeats.length}/${MAX_SEATS})`
                : `Maximum ${MAX_SEATS} seats reached (${selectedSeats.length}/${MAX_SEATS})`
              }
            </span>
          </div>
        </div>
      )}

      {/* Deck selection buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-2 mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-fit">
          <button
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeDeck === 'lower' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-600'
              }`}
            onClick={() => setActiveDeck('lower')}
          >
            Lower
          </button>
          <button
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeDeck === 'upper' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-600'
              }`}
            onClick={() => setActiveDeck('upper')}
          >
            Upper
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {activeDeck === 'lower' ? renderDeck(lowerDeckSeats, 'lower') : renderDeck(upperDeckSeats, 'upper')}

          {selectedSeats.length > 0 && (bookingStatus.isBookingOpen || bookingStatus.nextJourneyAvailable) && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Selected Seats ({selectedSeats.length})</h3>
                <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full">
                  {selectedSeats.length}/{MAX_SEATS} seats
                  {bookingStatus.nextJourneyAvailable && (
                    <span className="text-green-600 ml-1">• Next Journey</span>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="text-lg font-bold text-red-600">₹{selectedSeats.reduce((total, seatId) => {
                  const [deck, row, col] = seatId.split('-');
                  const priceString = seatPrices[deck]?.[parseInt(row)]?.[parseInt(col)] || '₹0';
                  const price = parseInt(priceString.replace('₹', '')) || 0;
                  return total + price;
                }, 0)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Seat Legend and Seat Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Seat Legend</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 0, type: seatTypes[0] },
                { key: 1, type: seatTypes[1] },
                { key: 2, type: seatTypes[2] },
                { key: 'selected', type: seatTypes.selected }
              ].map(({ key, type }) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-6 h-7 border-2 rounded flex-shrink-0 relative ${key === 1 && bookingStatus.nextJourneyAvailable
                      ? 'bg-green-50 border-green-300'
                      : `${type.bgClass} ${type.borderClass}`
                    } ${!bookingStatus.isBookingOpen && !bookingStatus.nextJourneyAvailable && key === 0 ? 'opacity-50' : ''
                    }`}>
                    {/* **UPDATED**: Show SOLD clearly in legend */}
                    {key === 1 && !bookingStatus.nextJourneyAvailable && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
                          SOLD
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="absolute w-full h-0.5 bg-white transform rotate-45"></div>
                          <div className="absolute w-full h-0.5 bg-white transform -rotate-45"></div>
                        </div>
                      </>
                    )}
                    {key === 1 && bookingStatus.nextJourneyAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-green-700">
                        RESET
                      </div>
                    )}
                    {key === 2 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-purple-700">
                        RES
                      </div>
                    )}
                    {/* Booking closed indicator */}
                    {!bookingStatus.isBookingOpen && !bookingStatus.nextJourneyAvailable && key === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <XCircle className="w-3 h-3 text-gray-400" />
                      </div>
                    )}
                    {/* Next journey indicator */}
                    {key === 1 && bookingStatus.nextJourneyAvailable && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    )}
                    {/* Real-time indicator */}
                    {key === 0 && isRealTime && bookingStatus.isBookingOpen && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-sm text-gray-700">
                    {key === 1 && bookingStatus.nextJourneyAvailable ? 'Sold' : type.label}
                    {key === 0 && !bookingStatus.isBookingOpen && !bookingStatus.nextJourneyAvailable && (
                      <span className="text-xs text-red-600 ml-1">(Closed)</span>
                    )}
                    {key === 0 && isRealTime && bookingStatus.isBookingOpen && (
                      <span className="text-xs text-blue-600 ml-1">(Live)</span>
                    )}
                    {key === 1 && bookingStatus.nextJourneyAvailable && (
                      <span className="text-xs text-green-600 ml-1"></span>
                    )}
                    {/* **NEW**: SOLD indicator in legend */}
                    {key === 1 && !bookingStatus.nextJourneyAvailable && (
                      <span className="text-xs text-red-600 ml-1">(Blocked)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Enhanced info section */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>Maximum {MAX_SEATS} seats per booking</span>
              </div>
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span><strong>SOLD seats are completely blocked</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Booking closes {BOOKING_CUTOFF_MINUTES} minutes before departure</span>
                </div>
                <div className="flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  <span>Seats reset automatically when bus arrives</span>
                </div>
              </div>
              {/* Real-time info */}
              {isRealTime && (
                <div className="mt-2 text-xs text-blue-600">
                  <div className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    <span>Real-time seat updates every second</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedSeatInfo && (bookingStatus.isBookingOpen || bookingStatus.nextJourneyAvailable) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-3">Seat Details</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Seat:</strong> {selectedSeatInfo.seat}</div>
                <div><strong>Price:</strong> {selectedSeatInfo.price}</div>
                <div><strong>Deck:</strong> {selectedSeatInfo.deck}</div>
                <div><strong>Position:</strong> {selectedSeatInfo.position}</div>
                {bookingStatus.nextJourneyAvailable && (
                  <div><strong>Journey:</strong> <span className="text-green-600">Next Journey</span></div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced status info card */}
          {!bookingStatus.isBookingOpen && !bookingStatus.nextJourneyAvailable && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-3">Booking Information</h3>
              <div className="space-y-2 text-sm text-red-700">
                <div><strong>Status:</strong> {bookingStatus.message}</div>
                <div><strong>Time:</strong> {bookingStatus.timeRemaining}</div>
                <div><strong>Reason:</strong> {
                  bookingStatus.busStatus === 'departed' ? 'Bus has departed' :
                    bookingStatus.busStatus === 'arrived' ? 'Journey completed' :
                      `Closes ${BOOKING_CUTOFF_MINUTES} min before departure`
                }</div>
                {bookingStatus.busStatus === 'arrived' && (
                  <div className="bg-blue-50 p-2 rounded mt-2">
                    <strong className="text-blue-700">Next Step:</strong>
                    <span className="text-blue-600 ml-1">Seats will be reset for next journey</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next Journey Ready Card */}
          {bookingStatus.nextJourneyAvailable && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-3">🚌 Next Journey Ready!</h3>
              <div className="space-y-2 text-sm text-green-700">
                <div><strong>Status:</strong> All seats available</div>
                <div><strong>Journey:</strong> Ready for next destination</div>
                <div><strong>Booking:</strong> Open for all passengers</div>
                <div className="bg-green-100 p-2 rounded mt-2">
                  <strong className="text-green-800">Note:</strong>
                  <span className="text-green-700 ml-1">Previously sold seats are now available</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Proceed button with next journey support */}
      {selectedSeats.length > 0 && (bookingStatus.isBookingOpen || bookingStatus.nextJourneyAvailable) && (
        <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold">Total Amount:</span>
              <span className="text-xl font-bold text-red-600">₹{selectedSeats.reduce((total, seatId) => {
                const [deck, row, col] = seatId.split('-');
                const priceString = seatPrices[deck]?.[parseInt(row)]?.[parseInt(col)] || '₹0';
                const price = parseInt(priceString.replace('₹', '')) || 0;
                return total + price;
              }, 0)}</span>
            </div>
            {bookingStatus.nextJourneyAvailable && (
              <div className="mb-3 p-2 bg-green-50 rounded text-xs text-green-700">
                <strong>Next Journey Booking</strong> - New destination available
              </div>
            )}
            <button
              onClick={onProceed}
              className={`w-full font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${bookingStatus.nextJourneyAvailable
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
            >
              {bookingStatus.nextJourneyAvailable ? 'Book Next Journey' : 'Proceed to Book'} ({selectedSeats.length} {selectedSeats.length === 1 ? 'seat' : 'seats'})
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSelectionCard;
