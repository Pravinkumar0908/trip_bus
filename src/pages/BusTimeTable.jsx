// BusTimeTable.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FaChevronDown,
  FaChevronUp,
  FaMapMarkerAlt,
  FaClock,
  FaFilter,
  FaSearch,
  FaSyncAlt,
  FaBus,
  FaExclamationTriangle,
  FaSpinner,
  FaStar,
  FaWifi,
  FaPercent,
  FaCrown,
  FaShieldAlt
} from 'react-icons/fa';
import { 
  collection, 
  getDocs, 
  query, 
  onSnapshot} from 'firebase/firestore';
import { db } from '../config/firebase'; // Adjust path as needed
import Navbar from '../components/Navbar';

const BusTimeTable = () => {
    const [selectedRoute, setSelectedRoute] = useState('all');
    const [selectedDay, setSelectedDay] = useState('today');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('time');
    const [sortOrder, setSortOrder] = useState('asc');
    const [showFilters, setShowFilters] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [selectedBusType, setSelectedBusType] = useState('all');
    const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
    const [busData, setBusData] = useState([]);
    const [error, setError] = useState(null);
    const [realTimeUpdates, setRealTimeUpdates] = useState(true);
    const [selectedOperator, setSelectedOperator] = useState('all');
    const [showWomenOnly, setShowWomenOnly] = useState(false);
    const [showPrimeOnly, setShowPrimeOnly] = useState(false);

    // Fetch bus data from Firestore without composite index requirement
    const fetchBusData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const busCollection = collection(db, 'buses');
            // Simple query without multiple conditions to avoid index requirement
            const busQuery = query(busCollection);
            const querySnapshot = await getDocs(busQuery);
            
            const buses = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Filter active buses in JavaScript instead of Firestore query
                if (data.isActive === true) {
                    buses.push({
                        id: doc.id,
                        ...data,
                        // Calculate available seats
                        availableSeats: data.availableSeats || (data.totalSeats - (data.bookedSeats || 0)),
                        // Create route string for filtering
                        routeString: data.route ? `${data.route.from} - ${data.route.to}` : '',
                        // Format features as amenities
                        amenities: data.features || [],
                        // Use departureTime as departure for compatibility
                        departure: data.departureTime,
                        arrival: data.arrivalTime,
                        // Calculate occupancy percentage
                        occupancyPercentage: ((data.totalSeats - (data.availableSeats || data.totalSeats)) / data.totalSeats) * 100
                    });
                }
            });
            
            // Sort in JavaScript instead of Firestore
            buses.sort((a, b) => {
                if (a.departureTime < b.departureTime) return -1;
                if (a.departureTime > b.departureTime) return 1;
                return 0;
            });
            
            setBusData(buses);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error fetching bus data:', err);
            setError('Failed to fetch bus data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Set up real-time listener without composite index requirement
    const setupRealTimeListener = useCallback(() => {
        if (!realTimeUpdates) return;

        const busCollection = collection(db, 'buses');
        // Simple query without complex conditions
        const busQuery = query(busCollection);
        
        const unsubscribe = onSnapshot(busQuery, (querySnapshot) => {
            const buses = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Filter in JavaScript to avoid index requirement
                if (data.isActive === true) {
                    buses.push({
                        id: doc.id,
                        ...data,
                        availableSeats: data.availableSeats || (data.totalSeats - (data.bookedSeats || 0)),
                        routeString: data.route ? `${data.route.from} - ${data.route.to}` : '',
                        amenities: data.features || [],
                        departure: data.departureTime,
                        arrival: data.arrivalTime,
                        occupancyPercentage: ((data.totalSeats - (data.availableSeats || data.totalSeats)) / data.totalSeats) * 100
                    });
                }
            });
            
            // Sort in JavaScript
            buses.sort((a, b) => {
                if (a.departureTime < b.departureTime) return -1;
                if (a.departureTime > b.departureTime) return 1;
                return 0;
            });
            
            setBusData(buses);
            setLastUpdated(new Date());
        }, (err) => {
            console.error('Real-time listener error:', err);
            setError('Real-time updates failed. Using cached data.');
        });

        return unsubscribe;
    }, [realTimeUpdates]);

    // Alternative fetch method with individual queries to avoid index issues
    const fetchBusDataAlternative = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const busCollection = collection(db, 'buses');
            
            // Fetch all buses first
            const allBusesQuery = query(busCollection);
            const querySnapshot = await getDocs(allBusesQuery);
            
            const buses = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                buses.push({
                    id: doc.id,
                    ...data,
                    availableSeats: data.availableSeats || (data.totalSeats - (data.bookedSeats || 0)),
                    routeString: data.route ? `${data.route.from} - ${data.route.to}` : '',
                    amenities: data.features || [],
                    departure: data.departureTime,
                    arrival: data.arrivalTime,
                    occupancyPercentage: ((data.totalSeats - (data.availableSeats || data.totalSeats)) / data.totalSeats) * 100
                });
            });
            
            setBusData(buses);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error fetching bus data:', err);
            setError('Failed to fetch bus data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Calculate dynamic status based on current time
    const calculateBusStatus = useCallback((bus) => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        
        const [depHour, depMinute] = bus.departureTime.split(':').map(Number);
        const [arrHour, arrMinute] = bus.arrivalTime.split(':').map(Number);
        
        const depTotalMinutes = depHour * 60 + depMinute;
        const arrTotalMinutes = arrHour * 60 + arrMinute;
        
        // Handle overnight journeys
        const isOvernightJourney = arrTotalMinutes < depTotalMinutes;
        
        if (isOvernightJourney) {
            if (currentTotalMinutes >= depTotalMinutes || currentTotalMinutes <= arrTotalMinutes) {
                return 'Running';
            }
        } else {
            if (currentTotalMinutes >= depTotalMinutes && currentTotalMinutes <= arrTotalMinutes) {
                return 'Running';
            }
        }
        
        // Check if bus is about to depart (30 minutes before)
        const timeToDeparture = depTotalMinutes - currentTotalMinutes;
        if (timeToDeparture > 0 && timeToDeparture <= 30) {
            return 'Boarding';
        }
        
        // Random delay simulation for realism
        const delayChance = Math.random();
        if (delayChance < 0.1) {
            return 'Delayed';
        }
        
        return 'On Time';
    }, []);

    // Enhanced bus data with calculated status
    const enhancedBusData = useMemo(() => {
        return busData
            .filter(bus => bus.isActive === true) // Additional filter in JavaScript
            .map(bus => ({
                ...bus,
                calculatedStatus: calculateBusStatus(bus)
            }));
    }, [busData, calculateBusStatus]);

    // Get unique routes from Firestore data
    const routes = useMemo(() => {
        const uniqueRoutes = ['all', ...new Set(enhancedBusData.map(bus => bus.routeString).filter(Boolean))];
        return uniqueRoutes;
    }, [enhancedBusData]);

    // Get unique bus types
    const busTypes = useMemo(() => {
        const uniqueTypes = ['all', ...new Set(enhancedBusData.map(bus => bus.type).filter(Boolean))];
        return uniqueTypes;
    }, [enhancedBusData]);

    // Get unique operators
    const operators = useMemo(() => {
        const uniqueOperators = ['all', ...new Set(enhancedBusData.map(bus => bus.operator).filter(Boolean))];
        return uniqueOperators;
    }, [enhancedBusData]);

    const days = ['today', 'tomorrow', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Initialize data fetching
    useEffect(() => {
        // Try alternative fetch method first
        fetchBusDataAlternative();
        
        // Set up real-time listener
        const unsubscribe = setupRealTimeListener();
        
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [fetchBusDataAlternative, setupRealTimeListener]);

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    // Auto-refresh data every 5 minutes
    useEffect(() => {
        const refreshTimer = setInterval(() => {
            if (!realTimeUpdates) {
                fetchBusDataAlternative();
            }
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(refreshTimer);
    }, [fetchBusDataAlternative, realTimeUpdates]);

    // Filter and sort buses
    const filteredAndSortedBuses = useMemo(() => {
        let filtered = enhancedBusData.filter(bus => {
            const matchesRoute = selectedRoute === 'all' || bus.routeString === selectedRoute;
            const matchesSearch = bus.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                bus.routeString?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                bus.operator?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesBusType = selectedBusType === 'all' || bus.type === selectedBusType;
            const matchesOperator = selectedOperator === 'all' || bus.operator === selectedOperator;
            const matchesPrice = bus.price >= priceRange.min && bus.price <= priceRange.max;
            const matchesWomenOnly = !showWomenOnly || bus.womenOnly;
            const matchesPrime = !showPrimeOnly || bus.isPrime;
            
            return matchesRoute && matchesSearch && matchesBusType && matchesOperator && 
                   matchesPrice && matchesWomenOnly && matchesPrime;
        });

        // Sort buses
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'time':
                    aValue = a.departureTime;
                    bValue = b.departureTime;
                    break;
                case 'price':
                    aValue = a.price;
                    bValue = b.price;
                    break;
                case 'duration':
                    // Extract hours from duration string like "7h 1m"
                    aValue = parseInt(a.duration?.split('h')[0] || '0');
                    bValue = parseInt(b.duration?.split('h')[0] || '0');
                    break;
                case 'rating':
                    aValue = a.rating || 0;
                    bValue = b.rating || 0;
                    break;
                case 'seats':
                    aValue = a.availableSeats;
                    bValue = b.availableSeats;
                    break;
                default:
                    aValue = a.busNumber;
                    bValue = b.busNumber;
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [enhancedBusData, selectedRoute, selectedDay, searchTerm, selectedBusType, selectedOperator, priceRange, showWomenOnly, showPrimeOnly, sortBy, sortOrder]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'On Time':
                return 'text-green-600 bg-green-100 border-green-200';
            case 'Delayed':
                return 'text-yellow-600 bg-yellow-100 border-yellow-200';
            case 'Cancelled':
                return 'text-red-600 bg-red-100 border-red-200';
            case 'Running':
                return 'text-blue-600 bg-blue-100 border-blue-200';
            case 'Boarding':
                return 'text-purple-600 bg-purple-100 border-purple-200';
            default:
                return 'text-gray-600 bg-gray-100 border-gray-200';
        }
    };

    const getBusTypeColor = (type) => {
        switch (type) {
            case 'AC Sleeper':
                return 'text-blue-600 bg-blue-100 border-blue-200';
            case 'Non AC Sleeper':
                return 'text-green-600 bg-green-100 border-green-200';
            case 'Volvo AC':
                return 'text-purple-600 bg-purple-100 border-purple-200';
            case 'AC Seater':
                return 'text-indigo-600 bg-indigo-100 border-indigo-200';
            case 'Semi Sleeper':
                return 'text-orange-600 bg-orange-100 border-orange-200';
            default:
                return 'text-gray-600 bg-gray-100 border-gray-200';
        }
    };

    const getOccupancyColor = (percentage) => {
        if (percentage >= 90) return 'text-red-600 bg-red-100';
        if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
        return 'text-green-600 bg-green-100';
    };

    const refreshData = async () => {
        await fetchBusDataAlternative();
    };

    const toggleRealTimeUpdates = () => {
        setRealTimeUpdates(!realTimeUpdates);
        if (!realTimeUpdates) {
            setupRealTimeListener();
        }
    };

    if (loading && busData.length === 0) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <FaSpinner className="animate-spin h-12 w-12 text-red-600 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700">Loading Bus Data...</h2>
                        <p className="text-gray-500 mt-2">Fetching latest schedules from database</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-red-600 mb-2">Live Bus Time Table</h1>
                        <p className="text-gray-600 text-lg">Real-time bus schedules with live tracking</p>
                        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${realTimeUpdates ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                                    {enhancedBusData.length} buses loaded
                                </span>
                            </div>
                            <button
                                onClick={toggleRealTimeUpdates}
                                className="text-red-600 hover:text-red-700 font-medium"
                            >
                                {realTimeUpdates ? 'Live Updates ON' : 'Live Updates OFF'}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <FaExclamationTriangle className="h-5 w-5 text-red-600 mr-3" />
                                <div className="text-red-700">{error}</div>
                                <button
                                    onClick={refreshData}
                                    className="ml-auto text-red-600 hover:text-red-700 font-medium"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Search and Filters */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                            {/* Search Bar */}
                            <div className="relative flex-1 max-w-md">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search bus number, route, or operator..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <FaFilter className="h-5 w-5" />
                                Filters
                                {showFilters ? <FaChevronUp className="h-4 w-4" /> : <FaChevronDown className="h-4 w-4" />}
                            </button>

                            {/* Refresh Button */}
                            <button
                                onClick={refreshData}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                <FaSyncAlt className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>

                        {/* Expanded Filters */}
                        {showFilters && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                                    {/* Route Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Route ({routes.length - 1} available)
                                        </label>
                                        <select
                                            value={selectedRoute}
                                            onChange={(e) => setSelectedRoute(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        >
                                            {routes.map(route => (
                                                <option key={route} value={route}>
                                                    {route === 'all' ? 'All Routes' : route}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Bus Type Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Bus Type ({busTypes.length - 1} types)
                                        </label>
                                        <select
                                            value={selectedBusType}
                                            onChange={(e) => setSelectedBusType(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        >
                                            {busTypes.map(type => (
                                                <option key={type} value={type}>
                                                    {type === 'all' ? 'All Types' : type}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Operator Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Operator ({operators.length - 1} operators)
                                        </label>
                                        <select
                                            value={selectedOperator}
                                            onChange={(e) => setSelectedOperator(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        >
                                            {operators.map(operator => (
                                                <option key={operator} value={operator}>
                                                    {operator === 'all' ? 'All Operators' : operator}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Sort By */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        >
                                            <option value="time">Departure Time</option>
                                            <option value="price">Price</option>
                                            <option value="duration">Duration</option>
                                            <option value="rating">Rating</option>
                                            <option value="seats">Available Seats</option>
                                            <option value="busNumber">Bus Number</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Special Filters */}
                                <div className="flex flex-wrap gap-4 mb-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={showWomenOnly}
                                            onChange={(e) => setShowWomenOnly(e.target.checked)}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            Women Only ({enhancedBusData.filter(b => b.womenOnly).length})
                                        </span>
                                        <FaShieldAlt className="h-4 w-4 text-pink-500" />
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={showPrimeOnly}
                                            onChange={(e) => setShowPrimeOnly(e.target.checked)}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            Prime Buses ({enhancedBusData.filter(b => b.isPrime).length})
                                        </span>
                                        <FaCrown className="h-4 w-4 text-yellow-500" />
                                    </label>
                                </div>

                                {/* Price Range Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Price Range: ₹{priceRange.min} - ₹{priceRange.max}
                                    </label>
                                    <div className="flex gap-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="5000"
                                            step="50"
                                            value={priceRange.min}
                                            onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) }))}
                                            className="flex-1"
                                        />
                                        <input
                                            type="range"
                                            min="0"
                                            max="5000"
                                            step="50"
                                            value={priceRange.max}
                                            onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results Summary */}
                    <div className="mb-6">
                        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                            <div className="flex justify-between items-center flex-wrap gap-4">
                                <p className="text-gray-700">
                                    Found <span className="font-bold text-red-600">{filteredAndSortedBuses.length}</span> buses
                                    {selectedRoute !== 'all' && (
                                        <span> for route <span className="font-medium">{selectedRoute}</span></span>
                                    )}
                                </p>
                                <div className="flex items-center gap-4 text-sm flex-wrap">
                                    <span className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        On Time: {filteredAndSortedBuses.filter(b => b.calculatedStatus === 'On Time').length}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        Running: {filteredAndSortedBuses.filter(b => b.calculatedStatus === 'Running').length}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                        Delayed: {filteredAndSortedBuses.filter(b => b.calculatedStatus === 'Delayed').length}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        Boarding: {filteredAndSortedBuses.filter(b => b.calculatedStatus === 'Boarding').length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bus Cards - Mobile View */}
                    <div className="block lg:hidden space-y-4">
                        {filteredAndSortedBuses.map(bus => (
                            <div key={bus.id} className="bg-white rounded-lg shadow-lg overflow-hidden border-l-4 border-red-500">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                                {bus.busNumber}
                                                {bus.calculatedStatus === 'Running' && (
                                                    <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full animate-pulse">
                                                        LIVE
                                                    </span>
                                                )}
                                                {bus.isPrime && (
                                                    <FaCrown className="h-4 w-4 text-yellow-500" title="Prime Bus" />
                                                )}
                                                {bus.womenOnly && (
                                                    <FaShieldAlt className="h-4 w-4 text-pink-500" title="Women Only" />
                                                )}
                                            </h3>
                                            <p className="text-gray-600">{bus.operator}</p>
                                            {bus.rating > 0 && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <FaStar className="h-4 w-4 text-yellow-500" />
                                                    <span className="text-sm text-gray-600">
                                                        {bus.rating} ({bus.reviews} reviews)
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(bus.calculatedStatus)}`}>
                                                {bus.calculatedStatus}
                                            </span>
                                            <span className={`px-2 py-1 text-xs rounded-full ${getOccupancyColor(bus.occupancyPercentage)}`}>
                                                {bus.availableSeats} seats left
                                            </span>
                                            {bus.discount && (
                                                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
                                                    <FaPercent className="h-3 w-3" />
                                                    {bus.discount}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <FaMapMarkerAlt className="h-5 w-5 text-red-500" />
                                        <span className="text-gray-700 font-medium">{bus.routeString}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-500">Departure</p>
                                            <p className="text-lg font-bold text-red-600">{bus.departureTime}</p>
                                            {bus.boardingPoints && bus.boardingPoints[0] && (
                                                <p className="text-xs text-gray-500">{bus.boardingPoints[0].name}</p>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-gray-500">Arrival</p>
                                            <p className="text-lg font-bold text-red-600">{bus.arrivalTime}</p>
                                            {bus.droppingPoints && bus.droppingPoints[0] && (
                                                <p className="text-xs text-gray-500">{bus.droppingPoints[0].name}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm mb-4">
                                        <span className="text-gray-600">Duration: {bus.duration}</span>
                                        <span className="text-gray-600">
                                            {bus.totalSeats - bus.availableSeats}/{bus.totalSeats} booked
                                        </span>
                                    </div>

                                    {/* Features/Amenities */}
                                    {bus.amenities && bus.amenities.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex flex-wrap gap-1">
                                                {bus.amenities.slice(0, 3).map((amenity, index) => (
                                                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded flex items-center gap-1">
                                                        {amenity === 'wifi' && <FaWifi className="h-3 w-3" />}
                                                        {amenity}
                                                    </span>
                                                ))}
                                                {bus.amenities.length > 3 && (
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                                        +{bus.amenities.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getBusTypeColor(bus.type)}`}>
                                            {bus.type}
                                        </span>
                                        <div className="text-right">
                                            {bus.discount && (
                                                <div className="text-sm line-through text-gray-500">
                                                    ₹{Math.round(bus.price / (1 - parseInt(bus.discount) / 100))}
                                                </div>
                                            )}
                                            <span className="text-2xl font-bold text-red-600">₹{bus.price}</span>
                                        </div>
                                    </div>

                                    <button 
                                        className={`w-full mt-4 py-2 px-4 rounded-lg font-medium transition-colors ${
                                            bus.calculatedStatus === 'Cancelled' || bus.availableSeats === 0
                                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                                : 'bg-red-600 text-white hover:bg-red-700'
                                        }`}
                                        disabled={bus.calculatedStatus === 'Cancelled' || bus.availableSeats === 0}
                                    >
                                        {bus.calculatedStatus === 'Cancelled' ? 'Service Cancelled' : 
                                         bus.availableSeats === 0 ? 'Fully Booked' : 'Book Now'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bus Table - Desktop View */}
                    <div className="hidden lg:block bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-red-600">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Bus Details</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Route</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Timing</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Duration</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Availability</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredAndSortedBuses.map((bus, index) => (
                                        <tr key={bus.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-red-50'} hover:bg-red-100 transition-colors`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                        {bus.busNumber}
                                                        {bus.calculatedStatus === 'Running' && (
                                                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full animate-pulse">
                                                                LIVE
                                                            </span>
                                                        )}
                                                        {bus.isPrime && (
                                                            <FaCrown className="h-4 w-4 text-yellow-500" title="Prime Bus" />
                                                        )}
                                                        {bus.womenOnly && (
                                                            <FaShieldAlt className="h-4 w-4 text-pink-500" title="Women Only" />
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{bus.operator}</div>
                                                    {bus.rating > 0 && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <FaStar className="h-3 w-3 text-yellow-500" />
                                                            <span className="text-xs text-gray-400">
                                                                {bus.rating} ({bus.reviews})
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <FaMapMarkerAlt className="h-4 w-4 text-red-500 mr-2" />
                                                    <div>
                                                        <span className="text-sm text-gray-900">{bus.routeString}</span>
                                                        <div className="text-xs text-gray-500">
                                                            Distance: {bus.route?.distance}km
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <FaClock className="h-4 w-4 text-gray-400" />
                                                        <span className="font-medium text-red-600">{bus.departureTime}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">to {bus.arrivalTime}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {bus.duration}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getBusTypeColor(bus.type)}`}>
                                                    {bus.type}
                                                </span>
                                                {bus.amenities && bus.amenities.includes('wifi') && (
                                                    <div className="mt-1">
                                                        <FaWifi className="h-3 w-3 text-blue-500" title="WiFi Available" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getOccupancyColor(bus.occupancyPercentage)}`}>
                                                        {bus.availableSeats} left
                                                    </span>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {bus.totalSeats - bus.availableSeats}/{bus.totalSeats} booked
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-right">
                                                    {bus.discount && (
                                                        <div className="text-xs line-through text-gray-500">
                                                            ₹{Math.round(bus.price / (1 - parseInt(bus.discount) / 100))}
                                                        </div>
                                                    )}
                                                    <span className="text-lg font-bold text-red-600">₹{bus.price}</span>
                                                    {bus.discount && (
                                                        <div className="text-xs text-green-600 font-medium">
                                                            {bus.discount} OFF
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(bus.calculatedStatus)}`}>
                                                    {bus.calculatedStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button 
                                                    className={`px-4 py-2 rounded-lg transition-colors ${
                                                        bus.calculatedStatus === 'Cancelled' || bus.availableSeats === 0
                                                            ? 'bg-gray-400 text-white cursor-not-allowed'
                                                            : 'bg-red-600 text-white hover:bg-red-700'
                                                    }`}
                                                    disabled={bus.calculatedStatus === 'Cancelled' || bus.availableSeats === 0}
                                                >
                                                    {bus.calculatedStatus === 'Cancelled' ? 'Cancelled' : 
                                                     bus.availableSeats === 0 ? 'Full' : 'Book'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* No Results */}
                    {filteredAndSortedBuses.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <div className="bg-white rounded-lg shadow-lg p-8">
                                <div className="text-gray-400 mb-4">
                                    <FaBus className="mx-auto h-16 w-16" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No buses found</h3>
                                <p className="text-gray-500 mb-4">Try adjusting your search criteria or filters.</p>
                                <button
                                    onClick={() => {
                                        setSelectedRoute('all');
                                        setSelectedDay('today');
                                        setSearchTerm('');
                                        setSelectedBusType('all');
                                        setSelectedOperator('all');
                                        setPriceRange({ min: 0, max: 5000 });
                                        setShowWomenOnly(false);
                                        setShowPrimeOnly(false);
                                        setSortBy('time');
                                        setSortOrder('asc');
                                    }}
                                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer Stats */}
                    <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-center">
                            <div>
                                <div className="text-red-600 text-2xl font-bold mb-2">{enhancedBusData.length}</div>
                                <div className="text-gray-600">Total Active Buses</div>
                            </div>
                            <div>
                                <div className="text-red-600 text-2xl font-bold mb-2">{routes.length - 1}</div>
                                <div className="text-gray-600">Active Routes</div>
                            </div>
                            <div>
                                <div className="text-red-600 text-2xl font-bold mb-2">
                                    {filteredAndSortedBuses.filter(b => b.calculatedStatus === 'Running').length}
                                </div>
                                <div className="text-gray-600">Currently Running</div>
                            </div>
                            <div>
                                <div className="text-red-600 text-2xl font-bold mb-2">
                                    {enhancedBusData.filter(b => b.isPrime).length}
                                </div>
                                <div className="text-gray-600">Prime Buses</div>
                            </div>
                            <div>
                                <div className="text-red-600 text-2xl font-bold mb-2">
                                    {enhancedBusData.filter(b => b.womenOnly).length}
                                </div>
                                <div className="text-gray-600">Women Only</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BusTimeTable;
