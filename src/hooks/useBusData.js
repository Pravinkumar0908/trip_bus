// hooks/useBusData.js
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useBusData = (initialBusData) => {
  const [busData, setBusData] = useState(initialBusData);
  const [seatLayout, setSeatLayout] = useState(null);
  const [boardingDropPoints, setBoardingDropPoints] = useState(null);
  const [operatorDetails, setOperatorDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    busDetails: false,
    seatLayout: false,
    points: false
  });
  const [error, setError] = useState(null);

  // Convert Firestore object format back to arrays for seat layout
  const convertObjectToArray = useCallback((seatObject) => {
    if (!seatObject) return [];
    
    const result = [];
    const sortedRows = Object.keys(seatObject).sort((a, b) => Number(a) - Number(b));
    
    sortedRows.forEach(rowKey => {
      const row = [];
      const sortedCols = Object.keys(seatObject[rowKey]).sort((a, b) => Number(a) - Number(b));
      
      sortedCols.forEach(colKey => {
        row.push(seatObject[rowKey][colKey]);
      });
      result.push(row);
    });
    
    return result;
  }, []);

  // Enhanced seat layout processing with validation
  const processSeatLayout = useCallback((rawSeatLayout) => {
    if (!rawSeatLayout) return null;

    try {
      const processedLayout = {
        lowerDeck: convertObjectToArray(rawSeatLayout.lowerDeck),
        upperDeck: convertObjectToArray(rawSeatLayout.upperDeck),
        seatPrices: {
          lower: convertObjectToArray(rawSeatLayout.seatPrices?.lower),
          upper: convertObjectToArray(rawSeatLayout.seatPrices?.upper)
        },
        // Add metadata
        totalSeats: 0,
        availableSeats: 0,
        bookedSeats: []
      };

      // Calculate seat statistics
      [processedLayout.lowerDeck, processedLayout.upperDeck].forEach(deck => {
        if (deck) {
          deck.forEach(row => {
            row.forEach(seat => {
              if (seat !== null && seat !== undefined) {
                processedLayout.totalSeats++;
                if (seat === 0) { // Available seat
                  processedLayout.availableSeats++;
                } else if (seat === 1) { // Booked seat
                  processedLayout.bookedSeats.push(`${deck}-${row}-${seat}`);
                }
              }
            });
          });
        }
      });

      return processedLayout;
    } catch (error) {
      console.error('Error processing seat layout:', error);
      return null;
    }
  }, [convertObjectToArray]);

  // 🔥 NEW: Fetch seat layout from separate bus_seats collection
  const fetchSeatLayout = useCallback(async (busId, busNumber) => {
    try {
      console.log('💺 Fetching seat layout from bus_seats collection:', { busId, busNumber });
      setLoadingStates(prev => ({ ...prev, seatLayout: true }));

      const seatsRef = collection(db, 'bus_seats');
      let seatsQuery;
      
      // Query by busId first, then fallback to busNumber
      if (busId) {
        seatsQuery = query(seatsRef, where('busId', '==', busId));
      } else if (busNumber) {
        seatsQuery = query(seatsRef, where('busNumber', '==', busNumber));
      } else {
        throw new Error('No busId or busNumber provided for seat layout fetch');
      }

      const seatsSnapshot = await getDocs(seatsQuery);
      
      if (!seatsSnapshot.empty) {
        const seatDoc = seatsSnapshot.docs[0];
        const seatData = seatDoc.data();
        
        console.log('✅ Seat layout data fetched:', seatData);

        // Process the seat layout from bus_seats collection
        if (seatData.seatLayout) {
          const processedSeatLayout = processSeatLayout(seatData.seatLayout);
          
          // Add pricing information
          const enhancedLayout = {
            ...processedSeatLayout,
            pricing: seatData.pricing || {},
            lowerDeckRows: seatData.lowerDeckRows || 15,
            upperDeckRows: seatData.upperDeckRows || 15,
            totalSeats: seatData.totalSeats || processedSeatLayout?.totalSeats || 0
          };
          
          setSeatLayout(enhancedLayout);
          console.log('✅ Enhanced seat layout processed:', enhancedLayout);
        } else {
          console.log('⚠️ No seatLayout found in bus_seats document');
          setSeatLayout(createDefaultSeatLayout());
        }
      } else {
        console.log('⚠️ No seat data found in bus_seats collection, creating default');
        setSeatLayout(createDefaultSeatLayout());
      }
    } catch (error) {
      console.error('❌ Error fetching seat layout:', error);
      setError(`Failed to fetch seat layout: ${error.message}`);
      // Fallback to default layout
      setSeatLayout(createDefaultSeatLayout());
    } finally {
      setLoadingStates(prev => ({ ...prev, seatLayout: false }));
    }
  }, [processSeatLayout]);

  // Create default seat layout if not found
  const createDefaultSeatLayout = useCallback(() => {
    const createDeckSeats = (rows) => {
      const seats = [];
      for (let row = 0; row < rows; row++) {
        seats.push([0, 0, 0]); // All available seats
      }
      return seats;
    };

    const createDeckPrices = (rows, price) => {
      const prices = [];
      for (let row = 0; row < rows; row++) {
        prices.push([`₹${price}`, `₹${price}`, `₹${price}`]);
      }
      return prices;
    };

    return {
      lowerDeck: createDeckSeats(15),
      upperDeck: createDeckSeats(15),
      seatPrices: {
        lower: createDeckPrices(15, '750'),
        upper: createDeckPrices(15, '700')
      },
      pricing: {
        lowerDeckPrice: '750',
        upperDeckPrice: '700',
        ladiesPrice: '850',
        reservedPrice: '800'
      },
      totalSeats: 90,
      availableSeats: 90,
      bookedSeats: [],
      lowerDeckRows: 15,
      upperDeckRows: 15
    };
  }, []);

  // Fallback search by operator and bus number
  const searchBusByDetails = useCallback(async (operatorName, busNumber) => {
    try {
      console.log('🔍 Searching bus by operator and number:', { operatorName, busNumber });
      
      const busesRef = collection(db, 'buses');
      const q = query(
        busesRef,
        where('operatorName', '==', operatorName),
        where('busNumber', '==', busNumber),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const busDoc = querySnapshot.docs[0];
        return { id: busDoc.id, ...busDoc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Error searching bus by details:', error);
      return null;
    }
  }, []);

  // 🔥 UPDATED: Main fetch function - fetches from buses collection (NO seat data)
  const fetchBusData = useCallback(async (busId) => {
    try {
      setLoading(true);
      setLoadingStates(prev => ({ ...prev, busDetails: true, points: true }));
      setError(null);

      console.log('🚌 Fetching bus data for ID:', busId);

      const busRef = doc(db, 'buses', busId);
      const busSnap = await getDoc(busRef);

      if (busSnap.exists()) {
        const data = busSnap.data();
        console.log('✅ Bus data fetched successfully (without seats):', data);

        // Set bus data with enhanced structure (NO SEAT LAYOUT HERE)
        const enhancedBusData = {
          id: busSnap.id,
          ...data,
          // Add computed fields
          routeDistance: data.route?.distance ? `${data.route.distance} km` : 'N/A',
          totalJourneyTime: data.duration || 'N/A',
          amenitiesCount: data.amenities?.length || 0,
          boardingPointsCount: data.boardingPoints?.length || 0,
          droppingPointsCount: data.droppingPoints?.length || 0
        };

        setBusData(enhancedBusData);
        setLoadingStates(prev => ({ ...prev, busDetails: false }));

        // 🔥 FETCH SEAT LAYOUT SEPARATELY from bus_seats collection
        await fetchSeatLayout(data.busId || busId, data.busNumber);

        // Set boarding/dropping points with validation
        if (data.boardingPoints || data.droppingPoints) {
          const validatedPoints = {
            boarding: (data.boardingPoints || []).filter(point => point.id && point.name && point.time),
            dropping: (data.droppingPoints || []).filter(point => point.id && point.name && point.time)
          };
          setBoardingDropPoints(validatedPoints);
          console.log('✅ Boarding/Dropping points set:', validatedPoints);
        }

        // Set operator details with enhanced info
        if (data.operatorDetails) {
          const enhancedOperatorDetails = {
            ...data.operatorDetails,
            experienceText: data.operatorDetails.experience ? `${data.operatorDetails.experience} years` : 'N/A',
            ratingText: data.operatorDetails.rating ? `${data.operatorDetails.rating}/5` : 'No rating'
          };
          setOperatorDetails(enhancedOperatorDetails);
        }

        setLoadingStates(prev => ({ ...prev, points: false }));

      } else {
        throw new Error(`Bus with ID ${busId} not found in database`);
      }
    } catch (error) {
      console.error('❌ Error fetching bus data:', error);
      setError(`Failed to fetch bus data: ${error.message}`);
    } finally {
      setLoading(false);
      setLoadingStates({
        busDetails: false,
        seatLayout: false,
        points: false
      });
    }
  }, [fetchSeatLayout]);

  // Effect to fetch data when bus changes
  useEffect(() => {
    const initializeData = async () => {
      if (initialBusData?.id || initialBusData?.busId) {
        const busId = initialBusData.id || initialBusData.busId;
        await fetchBusData(busId);
      } else if (initialBusData?.operatorName && initialBusData?.busNumber) {
        // Fallback search by operator and bus number
        console.log('⚠️ No busId found, searching by operator details...');
        
        try {
          setLoading(true);
          const foundBus = await searchBusByDetails(
            initialBusData.operatorName, 
            initialBusData.busNumber
          );
          
          if (foundBus) {
            console.log('✅ Bus found by search:', foundBus);
            await fetchBusData(foundBus.id);
          } else {
            // Use initial data as fallback and try to fetch seats
            console.log('⚠️ Bus not found in database, using initial data');
            setBusData(initialBusData);
            
            // Still try to fetch seat layout if we have busNumber
            if (initialBusData.busNumber) {
              await fetchSeatLayout(null, initialBusData.busNumber);
            }
            
            setError('Complete bus data not available in database');
          }
        } catch (error) {
          console.error('❌ Error in fallback search:', error);
          setBusData(initialBusData);
          setError('Failed to fetch complete bus data');
        } finally {
          setLoading(false);
        }
      } else if (initialBusData) {
        // Use provided data as is
        console.log('ℹ️ Using provided bus data without fetching');
        setBusData(initialBusData);
        
        // Try to fetch seat layout if possible
        if (initialBusData.busId || initialBusData.busNumber) {
          await fetchSeatLayout(initialBusData.busId, initialBusData.busNumber);
        }
      }
    };

    initializeData();
  }, [initialBusData, fetchBusData, searchBusByDetails, fetchSeatLayout]);

  // Refetch function
  const refetch = useCallback(() => {
    if (busData?.id || busData?.busId) {
      const busId = busData.id || busData.busId;
      fetchBusData(busId);
    } else if (busData?.operatorName && busData?.busNumber) {
      // Trigger re-initialization
      const initData = { ...busData };
      setBusData(null);
      setTimeout(() => setBusData(initData), 100);
    }
  }, [busData, fetchBusData]);

  // Update seat status (for booking functionality)
  const updateSeatStatus = useCallback((seatId, newStatus) => {
    setSeatLayout(prevLayout => {
      if (!prevLayout) return prevLayout;

      const updateDeck = (deck) => {
        return deck.map((row, rowIndex) => 
          row.map((seat, colIndex) => {
            const currentSeatId = `${deck === prevLayout.lowerDeck ? 'lower' : 'upper'}-${rowIndex}-${colIndex}`;
            return currentSeatId === seatId ? newStatus : seat;
          })
        );
      };

      return {
        ...prevLayout,
        lowerDeck: updateDeck(prevLayout.lowerDeck),
        upperDeck: updateDeck(prevLayout.upperDeck)
      };
    });
  }, []);

  // Computed values
  const isDataReady = !loading && busData && seatLayout;
  const hasError = !!error;
  const isLoading = loading || Object.values(loadingStates).some(state => state);

  return {
    // Data
    busData,
    seatLayout,
    boardingDropPoints,
    operatorDetails,
    
    // States
    loading,
    loadingStates,
    error,
    isDataReady,
    hasError,
    isLoading,
    
    // Actions
    refetch,
    updateSeatStatus,
    
    // Utilities
    fetchBusData: useCallback((busId) => fetchBusData(busId), [fetchBusData])
  };
};

// Additional hook for multiple buses (route search) - Updated to NOT include seat data
export const useBusSearch = (searchParams) => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchBuses = useCallback(async (from, to, date) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Searching buses for route:', { from, to, date });

      const busesRef = collection(db, 'buses');
      const q = query(
        busesRef,
        where('route.from', '==', from),
        where('route.to', '==', to),
        where('date', '==', date),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const busesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
        // NOTE: No seat data included here for performance
      }));

      setBuses(busesData);
      console.log(`✅ Found ${busesData.length} buses for route ${from} → ${to} (without seat data)`);
      
    } catch (error) {
      console.error('❌ Error searching buses:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchParams?.from && searchParams?.to && searchParams?.date) {
      searchBuses(searchParams.from, searchParams.to, searchParams.date);
    }
  }, [searchParams, searchBuses]);

  return {
    buses,
    loading,
    error,
    searchBuses,
    refetch: () => searchBuses(searchParams?.from, searchParams?.to, searchParams?.date)
  };
};
