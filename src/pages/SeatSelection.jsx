// pages/SeatSelection.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle, RefreshCw, ArrowRight, MapPin } from 'lucide-react';

// Custom hooks
import { useBusData } from '../hooks/useBusData';

// Components
import SeatSelectionCard from '../components/SeatSelectionCard';
import BusInfoCard from '../components/BusInfoCard';
import BoardingPointCard from '../components/Boarding';
import PassengerInfoCard from '../components/Userinfo';
import BookingSummary from '../components/BookingSummary';
import LoadingSpinner from '../components/LoadingSpinner';

const SeatSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🔥 LOCALHOST FIRST: Priority localhost search data
  const [isRouteInitialized, setIsRouteInitialized] = useState(false);
  const [routeData, setRouteData] = useState({
    from: 'Loading...',
    to: 'Loading...',
    date: new Date().toISOString().split('T')[0]
  });

  // Initial data from navigation
  const initialBusData = location.state?.bus || null;

  // 🚀 NEW: Real-time seat status management
  const [realTimeSeatLayout, setRealTimeSeatLayout] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);

  // 🔥 LOCALHOST PRIORITY: Fetch route from search first, NOT database
  useEffect(() => {
    console.log('🔄 Initializing route data (LOCALHOST PRIORITY)...');
    console.log('Location state:', location.state);
    
    let fromCity = 'Origin';
    let toCity = 'Destination';
    let travelDate = new Date().toISOString().split('T')[0];

    // 🎯 PRIORITY 1: Location state searchData (LOCALHOST SEARCH)
    if (location.state?.searchData) {
      const searchData = location.state.searchData;
      fromCity = searchData.from || fromCity;
      toCity = searchData.to || toCity;
      travelDate = searchData.date || travelDate;
      console.log('✅ Using LOCALHOST searchData:', searchData);
    }
    // 🎯 PRIORITY 2: localStorage (PREVIOUS LOCALHOST SEARCH)
    else {
      try {
        const savedData = JSON.parse(localStorage.getItem('currentSearchData') || '{}');
        if (savedData.from && savedData.to) {
          fromCity = savedData.from;
          toCity = savedData.to;
          travelDate = savedData.date || travelDate;
          console.log('✅ Using localStorage LOCALHOST data:', savedData);
        }
      } catch (error) {
        console.log('❌ localStorage error:', error);
      }
    }

    // 🚫 IGNORE DATABASE ROUTE - Only use localhost search data
    console.log('🚫 IGNORING database route data, using localhost search only');

    const finalRouteData = {
      from: fromCity,
      to: toCity,
      date: travelDate
    };

    console.log('🎯 Final LOCALHOST route data:', finalRouteData);
    
    setRouteData(finalRouteData);
    setIsRouteInitialized(true);

    // Save to localStorage for future use
    if (fromCity !== 'Origin' && toCity !== 'Destination') {
      localStorage.setItem('currentSearchData', JSON.stringify(finalRouteData));
    }
  }, [location.state]);

  console.log('🚌 Initial bus data received:', initialBusData);
  console.log('🛣️ Current LOCALHOST route data:', routeData);
  console.log('🔄 Route initialized:', isRouteInitialized);
  
  // Custom hook for bus data management with dynamic fetch
  const { 
    busData, 
    seatLayout, 
    boardingDropPoints, 
    operatorDetails,
    loading, 
    loadingStates,
    error, 
    refetch,
    isDataReady 
  } = useBusData(initialBusData);
  
  // Component states
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeDeck, setActiveDeck] = useState('lower');
  const [selectedSeatInfo, setSelectedSeatInfo] = useState(null);
  const [activeStep, setActiveStep] = useState(1);
  const [isBusInfoOpen, setIsBusInfoOpen] = useState(false);
  
  // NEW: State for boarding/dropping points selection
  const [selectedBoardingPoint, setSelectedBoardingPoint] = useState(null);
  const [selectedDroppingPoint, setSelectedDroppingPoint] = useState(null);

  // 🚀 NEW: Check if bus has departed/arrived and reset seats
  const checkBusTimingAndResetSeats = useCallback(() => {
    if (!busData || !busData.departureTime || !busData.arrivalTime) return;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    // Parse departure and arrival times  
    const departureTime = busData.departureTime;
    const arrivalTime = busData.arrivalTime;
    
    console.log('🕒 Checking bus timing:', {
      currentTime,
      departureTime,
      arrivalTime
    });

    // Check if bus has departed or arrived
    const hasDeparted = currentTime >= departureTime;
    const hasArrived = currentTime >= arrivalTime;
    
    if (hasDeparted || hasArrived) {
      console.log('🚌 Bus has departed/arrived, resetting seats to available');
      resetAllSeatsToAvailable();
    }
  }, [busData]);

  // 🚀 NEW: Reset all seats to available (status 0)
  const resetAllSeatsToAvailable = useCallback(() => {
    if (!seatLayout) return;

    const resetSeatDeck = (deckData) => {
      if (!deckData || typeof deckData !== 'object') return {};
      
      const resetDeck = {};
      Object.keys(deckData).forEach(rowKey => {
        resetDeck[rowKey] = {};
        const rowData = deckData[rowKey];
        
        if (rowData && typeof rowData === 'object') {
          Object.keys(rowData).forEach(colKey => {
            resetDeck[rowKey][colKey] = 0; // Set all seats to available
          });
        }
      });
      return resetDeck;
    };

    const resetLayout = {
      lowerDeck: resetSeatDeck(seatLayout.lowerDeck),
      upperDeck: resetSeatDeck(seatLayout.upperDeck),
      seatPrices: seatLayout.seatPrices || {}
    };

    setRealTimeSeatLayout(resetLayout);
    setLastUpdateTime(new Date());
    console.log('✅ All seats reset to available');
  }, [seatLayout]);

  // 🚀 NEW: Real-time seat status fetching (every 1 second)
  useEffect(() => {
    if (!isAutoRefreshing || !busData) return;

    const interval = setInterval(() => {
      checkBusTimingAndResetSeats();
      
      // Also fetch real-time seat status from server
      fetchRealTimeSeatStatus();
    }, 1000); // Check every 1 second

    return () => clearInterval(interval);
  }, [checkBusTimingAndResetSeats, isAutoRefreshing, busData]);

  // 🚀 NEW: Fetch real-time seat status from server
  const fetchRealTimeSeatStatus = useCallback(async () => {
    if (!busData?.id) return;

    try {
      const response = await fetch(`/api/buses/${busData.id}/seats/realtime`);
      if (response.ok) {
        const realtimeData = await response.json();
        setRealTimeSeatLayout(realtimeData.seatLayout);
        setLastUpdateTime(new Date());
        console.log('🔄 Real-time seat status updated');
      }
    } catch (error) {
      console.error('❌ Failed to fetch real-time seat status:', error);
    }
  }, [busData?.id]);

  // 🔥 LOCALHOST ROUTE: Use search data, NOT database route
  const getCurrentRoute = () => {
    // 🎯 ALWAYS USE LOCALHOST SEARCH DATA, NEVER DATABASE ROUTE
    const fromCity = routeData.from; // Only from localhost search
    const toCity = routeData.to; // Only from localhost search
    const travelDate = routeData.date; // Only from localhost search
    
    // Only times come from bus data, NOT cities
    const departureTime = busData?.departureTime || busData?.departure || busData?.time || '';
    const arrivalTime = busData?.arrivalTime || busData?.arrival || '';
    
    console.log('🎯 Using LOCALHOST route cities:', { fromCity, toCity });
    console.log('🕒 Using bus data for times only:', { departureTime, arrivalTime });
    
    return {
      from: fromCity,
      to: toCity,
      date: travelDate,
      departureTime,
      arrivalTime,
      fullRoute: `${fromCity} → ${toCity}`
    };
  };

  const currentRoute = getCurrentRoute();

  // 🔥 NEW: Process seat layout with correct status mapping and real-time updates
  const processedSeatLayout = useMemo(() => {
    // Use real-time seat layout if available, otherwise use original
    const layoutToProcess = realTimeSeatLayout || seatLayout;
    
    if (!layoutToProcess) return null;

    const processSeatDeck = (deckData) => {
      if (!deckData || typeof deckData !== 'object') return [];
      
      // Convert object structure to array and map seat statuses
      const processedDeck = [];
      const sortedRows = Object.keys(deckData).sort((a, b) => Number(a) - Number(b));
      
      sortedRows.forEach(rowKey => {
        const row = [];
        const rowData = deckData[rowKey];
        
        if (rowData && typeof rowData === 'object') {
          const sortedCols = Object.keys(rowData).sort((a, b) => Number(a) - Number(b));
          
          sortedCols.forEach(colKey => {
            const seatValue = rowData[colKey];
            
            // 🔥 CORRECT MAPPING:
            // Database: 0 = Available, 1 = Booked/Sold, 2 = Reserved
            // Component: 0 = Available, 1 = Booked/Sold, 2 = Reserved
            let mappedStatus;
            switch (seatValue) {
              case 0:
                mappedStatus = 0; // Available
                break;
              case 1:
                mappedStatus = 1; // Booked/Sold
                break;
              case 2:
                mappedStatus = 2; // Reserved
                break;
              default:
                mappedStatus = 0; // Default to available
            }
            
            row.push(mappedStatus);
          });
        }
        
        // Ensure each row has exactly 3 seats
        while (row.length < 3) {
          row.push(0); // Fill missing seats as available
        }
        
        processedDeck.push(row);
      });
      
      return processedDeck;
    };

    const processed = {
      lowerDeck: processSeatDeck(layoutToProcess.lowerDeck),
      upperDeck: processSeatDeck(layoutToProcess.upperDeck),
      seatPrices: layoutToProcess.seatPrices || {}
    };

    console.log('🔄 Processed seat layout (real-time):', processed);
    return processed;
  }, [seatLayout, realTimeSeatLayout]);

  // Debug logging
  useEffect(() => {
    console.log('🔄 Bus data updated:', busData);
    console.log('🔄 Current LOCALHOST route info:', currentRoute);
    console.log('🔄 LOCALHOST route data state:', routeData);
    console.log('🔄 Loading states:', loadingStates);
    console.log('🔄 Real-time seat layout:', realTimeSeatLayout);
    console.log('🔄 Last update time:', lastUpdateTime);
  }, [busData, currentRoute, routeData, loadingStates, realTimeSeatLayout, lastUpdateTime]);

  // Effect for body scroll management
  useEffect(() => {
    if (activeStep === 1 && isBusInfoOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isBusInfoOpen, activeStep]);

  // Navigation functions
  const handleProceedToBoarding = () => {
    if (selectedSeats.length > 0) setActiveStep(2);
  };
  
  // UPDATED: Handle boarding point selection and proceed to passenger info
  const handleProceedToPassengerInfo = (boardingData) => {
    if (boardingData) {
      setSelectedBoardingPoint(boardingData.boardingPoint);
      setSelectedDroppingPoint(boardingData.droppingPoint);
    }
    setActiveStep(3);
  };
  
  const handleProceedToPayment = () => {
    navigate('/payment', {
      state: {
        busData,
        selectedSeats,
        selectedBoardingPoint,
        selectedDroppingPoint,
        boardingDropPoints,
        searchData: routeData, // LOCALHOST search data
        currentRoute,
        totalAmount
      }
    });
  };

  // Calculate total amount using processed seat layout
  const totalAmount = useMemo(() => {
    if (!processedSeatLayout?.seatPrices) return 0;
    
    return selectedSeats.reduce((total, seatId) => {
      const [deck, rowStr, colStr] = seatId.split('-');
      const priceString = processedSeatLayout.seatPrices[deck]?.[parseInt(rowStr)]?.[parseInt(colStr)];
      if (!priceString) return total;
      const price = parseInt(priceString.replace('₹', '')) || 0;
      return total + price;
    }, 0);
  }, [selectedSeats, processedSeatLayout]);

  // Tab configuration
  const tabs = [
    { id: 1, title: '1. Select Seats', enabled: true },
    { id: 2, title: '2. Board/Drop Point', enabled: selectedSeats.length > 0 },
    { id: 3, title: '3. Passenger Info', enabled: selectedSeats.length > 0 }
  ];

  const handleTabClick = (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && tab.enabled) setActiveStep(tabId);
  };

  const handleBackClick = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    } else {
      navigate(-1);
    }
  };
  
  const getButtonProps = () => {
    switch (activeStep) {
      case 1:
        return {
          text: 'Select Boarding Point',
          action: handleProceedToBoarding,
          disabled: selectedSeats.length === 0
        };
      case 2:
        return {
          text: 'Fill Passenger Details',
          action: () => handleProceedToPassengerInfo(),
          disabled: !selectedBoardingPoint || !selectedDroppingPoint
        };
      case 3:
        return {
          text: 'Continue to Payment',
          action: handleProceedToPayment,
          disabled: false
        };
      default:
        return { text: '', action: () => {}, disabled: true };
    }
  };
  
  const buttonProps = getButtonProps();

  // 🔥 NEW: Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  // 🔥 UPDATED: Dynamic header content with LOCALHOST route info and real-time status
  const getDynamicHeaderContent = () => {
    if (!isRouteInitialized) {
      return {
        title: 'Loading LOCALHOST Route...',
        subtitle: '',
        showOffer: false
      };
    }

    const { from, to, date, departureTime, arrivalTime } = currentRoute;

    // 🚀 NEW: Show real-time status in header
    const getRealTimeStatus = () => {
      if (!departureTime || !arrivalTime) return '';
      
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      
      if (currentTime >= arrivalTime) {
        return '🟢 ARRIVED - All seats available';
      } else if (currentTime >= departureTime) {
        return '🔴 DEPARTED - All seats available';
      } else {
        return '🟡 ON TIME';
      }
    };

    switch (activeStep) {
      case 1:
        return {
          title: (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-black font-semibold">{from}</span>
                <ArrowRight className="w-4 h-4 text-gray-500" />
                <span className="text-black font-semibold">{to}</span>
              </div>
            </div>
          ),
          subtitle: (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{formatDate(date)}</span>
                {departureTime && (
                  <>
                    <span>•</span>
                    <span>Dep: {departureTime}</span>
                  </>
                )}
                {arrivalTime && (
                  <>
                    <span>•</span>
                    <span>Arr: {arrivalTime}</span>
                  </>
                )}
              </div>
              <div className="text-xs font-medium">
                {getRealTimeStatus()}
                {lastUpdateTime && (
                  <span className="ml-2 text-gray-400">
                    Updated: {lastUpdateTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          ),
          showOffer: true
        };
      case 2:
        return {
          title: 'Select Boarding & Dropping Points',
          subtitle: (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-black font-medium">{from}</span>
              <ArrowRight className="w-4 h-4 text-gray-500" />
              <span className="text-black font-medium">{to}</span>
              <span className="text-gray-500">• {formatDate(date)}</span>
            </div>
          ),
          showOffer: true
        };
      case 3:
        return {
          title: 'Passenger Information',
          subtitle: (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected</span>
              <span>•</span>
              <span>{from} → {to}</span>
            </div>
          ),
          showOffer: false
        };
      default:
        return {
          title: (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-black font-semibold">{from}</span>
              <ArrowRight className="w-4 h-4 text-gray-500" />
              <span className="text-black font-semibold">{to}</span>
            </div>
          ),
          subtitle: formatDate(date),
          showOffer: true
        };
    }
  };

  const headerContent = getDynamicHeaderContent();

  // Render active component based on step
  const renderActiveComponent = () => {
    switch (activeStep) {
      case 1:
        if (loadingStates.seatLayout || !processedSeatLayout) {
          return (
            <div className="p-8">
              <LoadingSpinner size="large" message="Loading real-time seat layout..." />
            </div>
          );
        }
        
        return (
          <SeatSelectionCard 
            selectedSeats={selectedSeats}
            setSelectedSeats={setSelectedSeats}
            activeDeck={activeDeck}
            setActiveDeck={setActiveDeck}
            selectedSeatInfo={selectedSeatInfo}
            setSelectedSeatInfo={setSelectedSeatInfo}
            lowerDeckSeats={processedSeatLayout?.lowerDeck || []}
            upperDeckSeats={processedSeatLayout?.upperDeck || []}
            seatPrices={processedSeatLayout?.seatPrices || {}}
            onProceed={handleProceedToBoarding}
            currentRoute={currentRoute}
            // 🚀 NEW: Pass real-time props
            isRealTime={true}
            lastUpdateTime={lastUpdateTime}
            isAutoRefreshing={isAutoRefreshing}
            onToggleAutoRefresh={() => setIsAutoRefreshing(!isAutoRefreshing)}
          />
        );
      case 2:
        return (
          <BoardingPointCard 
            onContinue={handleProceedToPassengerInfo}
            boardingPoints={boardingDropPoints?.boarding || []}
            droppingPoints={boardingDropPoints?.dropping || []}
            loading={loadingStates.points}
            selectedSeats={selectedSeats}
            seatLayout={processedSeatLayout}
            busData={busData}
            searchData={routeData}
            currentRoute={currentRoute}
          />
        );
      case 3:
        return (
          <PassengerInfoCard 
            selectedSeats={selectedSeats}
            seatLayout={processedSeatLayout}
            busData={busData}
            selectedBoardingPoint={selectedBoardingPoint}
            selectedDroppingPoint={selectedDroppingPoint}
            totalAmount={totalAmount}
            onContinue={handleProceedToPayment}
            currentRoute={currentRoute}
          />
        );
      default:
        return null;
    }
  };

  // Show loading state until route is initialized
  if (!isRouteInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner size="large" message="Loading LOCALHOST route information..." />
      </div>
    );
  }

  // Error handling
  if (error && !busData && !loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md border border-gray-200 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Bus Details</h2>
          <p className="text-gray-600 mb-2">LOCALHOST Route: {currentRoute.fullRoute}</p>
          <p className="text-gray-600 mb-4">Unable to fetch bus information. Please try again.</p>
          <div className="space-y-2">
            <button 
              onClick={refetch}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-300"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show Booking Summary only on Step 1
  const showBookingSummary = activeStep === 1 && selectedSeats.length > 0;

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <div className="flex flex-col h-full max-w-7xl mx-auto w-full">
        
        {/* 🔥 UPDATED: Dynamic Sticky Header with LOCALHOST Route and Real-time Status */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-4 border-b bg-white text-gray-800 shadow-lg flex-shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <ChevronLeft 
              className="w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-800 hover:scale-110 transition-all duration-200" 
              onClick={handleBackClick} 
            />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                {headerContent.title}
              </div>
              {headerContent.subtitle && (
                <div className="text-xs sm:text-sm text-gray-500 truncate">
                  {headerContent.subtitle}
                </div>
              )}
            </div>
            {loading && (
              <LoadingSpinner 
                size="small" 
                showMessage={false} 
                className="p-0 flex-shrink-0"
              />
            )}
          </div>
          {headerContent.showOffer && (
            <div className="bg-pink-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium animate-bounce hidden sm:block flex-shrink-0 ml-2">
              Women 10% OFF 💃
            </div>
          )}
        </div>

        {/* Progress Tabs */}
        <div className="bg-white border-t border-gray-200 z-20 flex-shrink-0">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex justify-center items-center">
              {tabs.map((tab) => {
                const isActive = activeStep === tab.id;
                const isCompleted = tab.id < activeStep;
                const isEnabled = tab.enabled;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    disabled={!isEnabled}
                    className={`
                      px-2 sm:px-6 py-3 text-xs sm:text-base font-medium transition-all duration-300 border-b-2
                      ${isActive ? 'text-red-600 border-red-600 bg-red-50' : 'border-transparent'}
                      ${!isActive && isEnabled ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-50' : ''}
                      ${!isEnabled ? 'text-gray-300 cursor-not-allowed' : ''}
                      ${isCompleted ? 'text-green-600 bg-green-50' : ''}
                    `}
                  >
                    {tab.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden p-2">
          
          {/* Left Column - Main Content - Scrollable */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                {renderActiveComponent()}
              </div>
            </div>
          </div>
          
          {/* Right Column - Bus Info - Scrollable */}
          {activeStep === 1 && (
            <div className="hidden lg:block w-full lg:max-w-md xl:max-w-lg flex-shrink-0">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 h-full overflow-hidden">
                <div className="h-full overflow-y-auto">
                  {loadingStates.busDetails ? (
                    <div className="p-8">
                      <LoadingSpinner size="medium" message="Loading bus info..." />
                    </div>
                  ) : (
                    <BusInfoCard 
                      selectedSeats={selectedSeats} 
                      busData={busData}
                      operatorDetails={operatorDetails}
                      currentRoute={currentRoute}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Booking Summary */}
      {showBookingSummary && (
        <div className="hidden lg:block fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-7xl px-4">
          <div className="max-w-md mx-auto">
            <BookingSummary
              totalAmount={totalAmount}
              seatCount={selectedSeats.length}
              buttonText={buttonProps.text}
              onButtonClick={buttonProps.action}
              disabled={buttonProps.disabled}
              currentRoute={currentRoute}
            />
          </div>
        </div>
      )}

      {/* Mobile Price Summary Bar */}
      {showBookingSummary && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-20 bg-white border-t border-gray-200 p-2">
          <BookingSummary
            totalAmount={totalAmount}
            seatCount={selectedSeats.length}
            buttonText={buttonProps.text}
            onButtonClick={buttonProps.action}
            disabled={buttonProps.disabled}
            currentRoute={currentRoute}
          />
        </div>
      )}
    </div>
  );
};

export default SeatSelection;
