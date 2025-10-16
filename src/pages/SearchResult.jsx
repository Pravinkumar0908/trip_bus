import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase'; // Apni Firebase config file
import Navbar from '../components/Navbar';


// All icons from your original design
import { Search, Calendar, MapPin, Star, Zap, Clock, Users, Shield, Wifi, Coffee, Car, Filter, ChevronDown, ChevronUp, X, Menu, ArrowRight, ArrowLeft, Play, SkipForward } from 'lucide-react';
import { HiOutlineSwitchHorizontal } from "react-icons/hi";
import { TbAirConditioning } from "react-icons/tb";
import { FaBed, FaFemale, FaBusAlt, FaMapMarkerAlt, FaWheelchair, FaRoute, FaCheckCircle } from "react-icons/fa";
import { PiArmchairFill } from "react-icons/pi";
import { MdWorkspacePremium } from "react-icons/md";
import { BsFillSunriseFill } from "react-icons/bs";
import {
  FaBus,
} from 'react-icons/fa';

export default function SearchResult({
  initialFrom = "Jainagar",
  initialTo = "Jaipur",
  onSearch = () => { },
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  // States for Firestore data
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mobile filter states
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('busType');

  // Onboarding States
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [skipOnboarding, setSkipOnboarding] = useState(false);

  // Filter states
  const [selectedFilters, setSelectedFilters] = useState({
    busType: [
      ...(queryParams.get('ac') === 'true' ? ['ac'] : []),
      ...(queryParams.get('sleeper') === 'true' ? ['sleeper'] : []),
      ...(queryParams.get('womenOnly') === 'true' ? ['womenOnly'] : []),
      ...(queryParams.get('accessible') === 'true' ? ['accessible'] : []),
    ],
    departure: queryParams.get('time') && queryParams.get('time') !== 'any' ? [queryParams.get('time')] : [],
    arrival: [],
    amenities: [],
    price: { min: 0, max: 5000 },
    rating: 0,
    operators: []
  });

  const [sortBy, setSortBy] = useState('ratings');
  const [expandedSections, setExpandedSections] = useState({
    busType: true,
    departure: true,
    arrival: true,
    amenities: true,
    price: true,
    rating: true,
    operators: true
  });

  const [from, setFrom] = useState(queryParams.get('from') || initialFrom);
  const [to, setTo] = useState(queryParams.get('to') || initialTo);
  const [rotated, setRotated] = useState(false);
  const [selectedDate, setSelectedDate] = useState(queryParams.get('date') || 'today');

  // Onboarding Configuration
  const onboardingSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Bus Search! 🚌',
      description: 'Let me show you how to find the perfect bus for your journey. This quick tour will help you navigate through all features.',
      position: 'center',
      showOverlay: true,
      buttons: ['Skip Tour', 'Start Tour']
    },
    {
      id: 'search-bar',
      title: 'Search Your Route',
      description: 'Enter your departure and destination cities here. Use the switch button to swap locations quickly.',
      element: '[data-tour="search-section"]',
      position: 'bottom',
      showOverlay: true,
      buttons: ['Previous', 'Next']
    },
    {
      id: 'date-selection',
      title: 'Choose Travel Date',
      description: 'Select your travel date. You can choose today, tomorrow, or pick a custom date for your journey.',
      element: '[data-tour="date-section"]',
      position: 'bottom',
      showOverlay: true,
      buttons: ['Previous', 'Next']
    },
    {
      id: 'filters',
      title: 'Smart Filters',
      description: 'Use these filters to find buses that match your preferences - AC/Non-AC, sleeper, departure time, price range, and more.',
      element: '[data-tour="filters-section"]',
      position: 'right',
      showOverlay: true,
      buttons: ['Previous', 'Next']
    },
    {
      id: 'eazzy-filter',
      title: 'AI-Powered Search',
      description: 'Try our Eazzy Filter! Just type what you want like "morning departure AC bus" and we\'ll filter results for you.',
      element: '[data-tour="eazzy-filter"]',
      position: 'right',
      showOverlay: true,
      buttons: ['Previous', 'Next']
    },
    {
      id: 'sort-options',
      title: 'Sort Results',
      description: 'Sort buses by ratings, price, departure time, or duration to find exactly what you need.',
      element: '[data-tour="sort-section"]',
      position: 'bottom',
      showOverlay: true,
      buttons: ['Previous', 'Next']
    },
    {
      id: 'bus-card',
      title: 'Bus Information',
      description: 'Each bus card shows operator, timings, amenities, ratings, and price. Click "View Seats" to see seat layout or "Book Now" to proceed.',
      element: '[data-tour="bus-card"]',
      position: 'left',
      showOverlay: true,
      buttons: ['Previous', 'Next']
    },
    {
      id: 'mobile-filters',
      title: 'Mobile Filters',
      description: 'On mobile, tap the Filters button to access all filtering options in a convenient popup.',
      element: '[data-tour="mobile-filter-btn"]',
      position: 'bottom',
      showOverlay: true,
      buttons: ['Previous', 'Finish Tour'],
      mobileOnly: true
    }
  ];

  // Check if user has seen onboarding before
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('bus-search-onboarding-seen');
    if (!hasSeenOnboarding && !skipOnboarding) {
      setTimeout(() => {
        setShowOnboarding(true);
      }, 1000); // Show after 1 second
    }
  }, [skipOnboarding]);

  // Onboarding Functions
  const startOnboarding = () => {
    setShowOnboarding(true);
    setOnboardingStep(0);
  };

  const nextOnboardingStep = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      finishOnboarding();
    }
  };

  const previousOnboardingStep = () => {
    if (onboardingStep > 0) {
      setOnboardingStep(onboardingStep - 1);
    }
  };

  const finishOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('bus-search-onboarding-seen', 'true');
  };

  const skipOnboardingTour = () => {
    setShowOnboarding(false);
    setSkipOnboarding(true);
    localStorage.setItem('bus-search-onboarding-seen', 'true');
  };

  // Get current step configuration
  const currentStep = onboardingSteps[onboardingStep];

  // Calculate spotlight position for highlighted elements
  const getSpotlightStyle = (element) => {
    if (!element) return {};

    const targetElement = document.querySelector(element);
    if (!targetElement) return {};

    const rect = targetElement.getBoundingClientRect();
    return {
      top: rect.top - 10,
      left: rect.left - 10,
      width: rect.width + 20,
      height: rect.height + 20,
    };
  };

  // === CSS Styles for Glowing Shimmer Effect + Onboarding ===
  const shimmerButtonStyles = `
  .shimmer-button {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border: 1px solid #dc2626;
    transition: all 0.3s ease;
    color: white;
  }

  .shimmer-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.6),
      transparent
    );
    transform: skewX(-25deg);
    animation: shimmer 2s infinite;
    filter: blur(4px);
  }

  .shimmer-button:hover {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.81), 0 0 25px rgba(255, 255, 255, 0.96);
    transform: translateY(-1px);
  }

  .shimmer-button-mobile {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border: 1px solid #dc2626;
    transition: all 0.3s ease;
    color: white;
  }

  .shimmer-button-mobile::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.6),
      transparent
    );
    transform: skewX(-25deg);
    animation: shimmer 2s infinite;
    filter: blur(2px);
  }

  @keyframes shimmer {
    0% {
      left: -100%;
    }
    25% {
      left: 100%;
    }
    75% {
      left: 100%;
    }
    100% {
      left: 100%;
    }
  }

  /* Onboarding Styles */
  .onboarding-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 9998;
    transition: all 0.3s ease;
  }

  .onboarding-spotlight {
    position: fixed;
    border: 3px solid #3b82f6;
    border-radius: 8px;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px #3b82f6;
    z-index: 9999;
    transition: all 0.3s ease;
    pointer-events: none;
    animation: pulse-border 2s infinite;
  }

  @keyframes pulse-border {
    0%, 100% {
      border-color: #3b82f6;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px #3b82f6;
    }
    50% {
      border-color: #60a5fa;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 30px #60a5fa;
    }
  }

  .onboarding-tooltip {
    position: fixed;
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    z-index: 10000;
    max-width: 320px;
    padding: 0;
    animation: tooltip-enter 0.3s ease-out;
  }

  @keyframes tooltip-enter {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .onboarding-arrow {
    position: absolute;
    width: 0;
    height: 0;
  }

  .onboarding-arrow.top {
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid white;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
  }

  .onboarding-arrow.bottom {
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid white;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
  }

  .onboarding-arrow.left {
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-right: 10px solid white;
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
  }

  .onboarding-arrow.right {
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-left: 10px solid white;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
  }

  .onboarding-progress {
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
  }

  .onboarding-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    transition: width 0.3s ease;
    border-radius: 2px;
  }
`;

  // === MAIN DATA FETCHING LOGIC ===
  useEffect(() => {
    const fetchBuses = async () => {
      if (!from || !to) {
        setBuses([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Step 1: Query Firestore for buses containing 'from' location in routes
        const busesRef = collection(db, 'buses');
        const q = query(busesRef, where('routes', 'array-contains', from));
        const querySnapshot = await getDocs(q);

        const fetchedBuses = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedBuses.push({
            id: doc.id,
            ...data,
            // Ensure required fields with fallbacks
            departure: data.departureTime || data.departure || '00:00',
            arrival: data.arrivalTime || data.arrival || '00:00',
            seats: data.seats || `${data.totalSeats || 20} Seats`,
            features: data.features || [],
            amenities: data.amenities || [],
            isPrime: data.isPrime || false,
            womenOnly: data.womenOnly || false,
            accessible: data.accessible || false,
            rating: data.rating || 0,
            reviews: data.reviews || 0,
            price: data.price || 0,
            operator: data.operator || 'Unknown Operator',
            type: data.type || 'Standard Bus'
          });
        });

        // Step 2: Filter client-side for 'to' location
        const finalBuses = fetchedBuses.filter(bus =>
          bus.routes && bus.routes.includes(to)
        );

        setBuses(finalBuses);
        console.log(`Found ${finalBuses.length} buses for route ${from} → ${to}`);

      } catch (err) {
        console.error("Error fetching buses: ", err);
        setError("Failed to fetch buses. Please try again.");
        setBuses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, [from, to]);

  // Update state when URL params change
  useEffect(() => {
    setFrom(queryParams.get('from') || initialFrom);
    setTo(queryParams.get('to') || initialTo);
    setSelectedDate(queryParams.get('date') || 'today');
  }, [initialFrom, initialTo, location.search]);

  // Add shimmer styles to document head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = shimmerButtonStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Navigation functions
  const handleViewSeats = (bus) => {
    if (showOnboarding) return; // Prevent navigation during onboarding

    navigate('/seat-selection', {
      state: {
        bus: {
          ...bus,
          totalSeats: 40,
          availableSeats: parseInt(bus.seats?.split(' ')[0]) || 20,
          operatorContact: '+91-9876543210',
          busNumber: `${bus.operator?.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 1000)}`,
          route: `${from} → ${to}`,
          journeyDate: selectedDate,
          operatorName: bus.operator,
          busType: bus.type,
          departureTime: bus.departure,
          arrivalTime: bus.arrival,
          journeyDuration: bus.duration,
          baseFare: bus.price,
          totalFare: bus.price + Math.floor(bus.price * 0.12),
          amenities: bus.amenities || [],
          features: bus.features || [],
          rating: bus.rating,
          totalReviews: bus.reviews
        },
        searchData: {
          from,
          to,
          date: selectedDate,
          passengers: 1
        }
      }
    });
  };

  const handleBookNow = (bus) => {
    handleViewSeats(bus);
  };

  // Generate filter options dynamically based on fetched data
  const generateFilterOptions = (buses) => {
    const operators = [...new Set(buses.map(bus => bus.operator))];

    return {
      busType: [
        { label: 'Primo Bus', count: buses.filter(b => b.isPrime).length, type: 'primo' },
        { label: 'AC', count: buses.filter(b => b.features?.includes('AC')).length, type: 'ac' },
        { label: 'SLEEPER', count: buses.filter(b => b.features?.includes('Sleeper')).length, type: 'sleeper' },
        { label: 'Women Only', count: buses.filter(b => b.womenOnly).length, type: 'womenOnly' },
        { label: 'Accessible', count: buses.filter(b => b.accessible).length, type: 'accessible' },
        { label: 'Single Seats', count: buses.filter(b => b.seats?.includes('Single')).length, type: 'single' },
        { label: 'SEATER', count: buses.filter(b => b.type?.includes('Seater')).length, type: 'seater' },
        { label: 'NONAC', count: buses.filter(b => !b.features?.includes('AC')).length, type: 'nonac' },
        { label: 'High Rated Buses', count: buses.filter(b => b.rating >= 4.5).length, type: 'rated' },
        { label: 'Live Tracking', count: buses.filter(b => b.features?.includes('Live Tracking')).length, type: 'tracking' },
        { label: 'Volvo Buses', count: buses.filter(b => b.features?.includes('Volvo')).length, type: 'volvo' }
      ].filter(option => option.count > 0),
      departure: [
        {
          label: 'Early Morning (06:00-10:00)', count: buses.filter(b => {
            const hour = parseInt(b.departure?.split(':')[0] || 0);
            return hour >= 6 && hour < 10;
          }).length, type: 'morning'
        },
        {
          label: 'Morning (10:00-14:00)', count: buses.filter(b => {
            const hour = parseInt(b.departure?.split(':')[0] || 0);
            return hour >= 10 && hour < 14;
          }).length, type: 'late-morning'
        },
        {
          label: 'Afternoon (14:00-18:00)', count: buses.filter(b => {
            const hour = parseInt(b.departure?.split(':')[0] || 0);
            return hour >= 14 && hour < 18;
          }).length, type: 'afternoon'
        },
        {
          label: 'Evening (18:00-24:00)', count: buses.filter(b => {
            const hour = parseInt(b.departure?.split(':')[0] || 0);
            return hour >= 18 || hour < 6;
          }).length, type: 'evening'
        }
      ].filter(option => option.count > 0),
      arrival: [
        {
          label: 'Early Morning (06:00-10:00)', count: buses.filter(b => {
            const hour = parseInt(b.arrival?.split(':')[0] || 0);
            return hour >= 6 && hour < 10;
          }).length, type: 'morning-arrival'
        },
        {
          label: 'Morning (10:00-14:00)', count: buses.filter(b => {
            const hour = parseInt(b.arrival?.split(':')[0] || 0);
            return hour >= 10 && hour < 14;
          }).length, type: 'late-morning-arrival'
        },
        {
          label: 'Afternoon (14:00-18:00)', count: buses.filter(b => {
            const hour = parseInt(b.arrival?.split(':')[0] || 0);
            return hour >= 14 && hour < 18;
          }).length, type: 'afternoon-arrival'
        },
        {
          label: 'Evening (18:00-24:00)', count: buses.filter(b => {
            const hour = parseInt(b.arrival?.split(':')[0] || 0);
            return hour >= 18 || hour < 6;
          }).length, type: 'evening-arrival'
        }
      ].filter(option => option.count > 0),
      amenities: [
        { label: 'WiFi', count: buses.filter(b => b.amenities?.includes('wifi')).length, type: 'wifi', icon: <Wifi className="w-4 h-4" /> },
        { label: 'Charging Point', count: buses.filter(b => b.amenities?.includes('charging')).length, type: 'charging', icon: <Zap className="w-4 h-4" /> },
        { label: 'Food/Coffee', count: buses.filter(b => b.amenities?.includes('coffee')).length, type: 'coffee', icon: <Coffee className="w-4 h-4" /> },
        { label: 'Blanket', count: buses.filter(b => b.amenities?.includes('blanket')).length, type: 'blanket', icon: <Shield className="w-4 h-4" /> },
        { label: 'Entertainment', count: buses.filter(b => b.amenities?.includes('entertainment')).length, type: 'entertainment', icon: <Users className="w-4 h-4" /> }
      ].filter(option => option.count > 0),
      operators: operators.map(op => ({
        label: op,
        count: buses.filter(b => b.operator === op).length
      }))
    };
  };

  const filterOptions = generateFilterOptions(buses);

  // Rest of your filter and sort functions (unchanged)
  const handleSwitch = () => {
    if (showOnboarding) return; // Prevent action during onboarding

    const newFrom = to;
    const newTo = from;
    setFrom(newFrom);
    setTo(newTo);
    setRotated(!rotated);
    // Update URL
    navigate(`/search?from=${newFrom}&to=${newTo}&date=${selectedDate}`);
  };

  const handleSearch = () => {
    if (showOnboarding) return; // Prevent action during onboarding
    navigate(`/search?from=${from}&to=${to}&date=${selectedDate}`);
  };

  const toggleFilter = (category, filterType) => {
    if (showOnboarding) return; // Prevent action during onboarding

    setSelectedFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(filterType)
        ? prev[category].filter(f => f !== filterType)
        : [...prev[category], filterType]
    }));
  };

  const clearAllFilters = () => {
    if (showOnboarding) return; // Prevent action during onboarding

    setSelectedFilters({
      busType: [],
      departure: [],
      arrival: [],
      amenities: [],
      price: { min: 0, max: 5000 },
      rating: 0,
      operators: []
    });
  };

  // Filtering and sorting logic
  const getFilteredBuses = () => {
    return buses.filter(bus => {
      const matchesPrice = bus.price >= selectedFilters.price.min && bus.price <= selectedFilters.price.max;
      const matchesRating = bus.rating >= selectedFilters.rating;

      if (selectedFilters.busType.includes('ac') && !bus.features?.includes('AC')) return false;
      if (selectedFilters.busType.includes('sleeper') && !bus.features?.includes('Sleeper')) return false;
      if (selectedFilters.busType.includes('primo') && !bus.isPrime) return false;
      if (selectedFilters.busType.includes('volvo') && !bus.features?.includes('Volvo')) return false;
      if (selectedFilters.busType.includes('rated') && bus.rating < 4.5) return false;
      if (selectedFilters.busType.includes('womenOnly') && !bus.womenOnly) return false;
      if (selectedFilters.busType.includes('accessible') && !bus.accessible) return false;

      if (selectedFilters.departure.length > 0) {
        const hour = parseInt(bus.departure?.split(':')[0] || 0);
        const matchesDeparture = selectedFilters.departure.some(filter => {
          switch (filter) {
            case 'morning': return hour >= 6 && hour < 10;
            case 'late-morning': return hour >= 10 && hour < 14;
            case 'afternoon': return hour >= 14 && hour < 18;
            case 'evening': return hour >= 18 || hour < 6;
            default: return false;
          }
        });
        if (!matchesDeparture) return false;
      }

      if (selectedFilters.arrival.length > 0) {
        const hour = parseInt(bus.arrival?.split(':')[0] || 0);
        const matchesArrival = selectedFilters.arrival.some(filter => {
          switch (filter) {
            case 'morning-arrival': return hour >= 6 && hour < 10;
            case 'late-morning-arrival': return hour >= 10 && hour < 14;
            case 'afternoon-arrival': return hour >= 14 && hour < 18;
            case 'evening-arrival': return hour >= 18 || hour < 6;
            default: return false;
          }
        });
        if (!matchesArrival) return false;
      }

      if (selectedFilters.amenities.length > 0) {
        const hasAmenities = selectedFilters.amenities.every(amenity =>
          bus.amenities?.includes(amenity)
        );
        if (!hasAmenities) return false;
      }

      if (selectedFilters.operators.length > 0 && !selectedFilters.operators.includes(bus.operator)) return false;

      return matchesPrice && matchesRating;
    }).sort((a, b) => {
      if (sortBy === 'ratings') return b.rating - a.rating;
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'departure') return a.departure.localeCompare(b.departure);
      if (sortBy === 'duration') return (a.duration || '').localeCompare(b.duration || '');
      return 0;
    });
  };

  const filteredBuses = getFilteredBuses();
  const totalFiltersApplied = selectedFilters.busType.length + selectedFilters.departure.length +
    selectedFilters.arrival.length + selectedFilters.amenities.length + selectedFilters.operators.length +
    (selectedFilters.rating > 0 ? 1 : 0);

  const getAmenityIcon = (amenity) => {
    switch (amenity) {
      case 'wifi': return <Wifi className="w-4 h-4" />;
      case 'coffee': return <Coffee className="w-4 h-4" />;
      case 'charging': return <Zap className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  // Filter tabs configuration
  const filterTabs = [
    { id: 'busType', label: 'Bus Type', count: selectedFilters.busType.length },
    { id: 'departure', label: 'Departure', count: selectedFilters.departure.length },
    { id: 'arrival', label: 'Arrival', count: selectedFilters.arrival.length },
    { id: 'price', label: 'Price', count: selectedFilters.price.min > 0 || selectedFilters.price.max < 5000 ? 1 : 0 },
    { id: 'rating', label: 'Rating', count: selectedFilters.rating > 0 ? 1 : 0 },
    { id: 'amenities', label: 'Amenities', count: selectedFilters.amenities.length },
    { id: 'operators', label: 'Operators', count: selectedFilters.operators.length }
  ];

  // Render filter content based on active tab
  const renderFilterContent = () => {
    switch (activeFilterTab) {
      case 'busType':
        return (
          <div className="space-y-2">
            {filterOptions.busType.map((filter, index) => (
              <button
                key={index}
                onClick={() => toggleFilter('busType', filter.type)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${selectedFilters.busType.includes(filter.type)
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <span className="flex items-center space-x-3">
                  {filter.type === 'primo' && <Star className="w-5 h-5 text-black" />}
                  {filter.type === 'ac' && <TbAirConditioning className="w-5 h-5 text-black" />}
                  {filter.type === 'sleeper' && <FaBed className="w-5 h-5 text-black" />}
                  {filter.type === 'womenOnly' && <FaFemale className="w-5 h-5 text-black" />}
                  {filter.type === 'single' && <PiArmchairFill className="w-5 h-5 text-black" />}
                  {filter.type === 'volvo' && <FaBusAlt className="w-5 h-5 text-black" />}
                  {filter.type === 'tracking' && <FaMapMarkerAlt className="w-5 h-5 text-black" />}
                  {filter.type === 'rated' && <MdWorkspacePremium className="w-5 h-5 text-black" />}
                  {filter.type === 'accessible' && <FaWheelchair className="w-5 h-5 text-black" />}
                  <span className="text-sm font-medium">{filter.label}</span>
                </span>
                <span className="text-gray-500 text-sm">({filter.count})</span>
              </button>
            ))}
          </div>
        );

      case 'departure':
        return (
          <div className="space-y-2">
            {filterOptions.departure.map((filter, index) => (
              <button
                key={index}
                onClick={() => toggleFilter('departure', filter.type)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${selectedFilters.departure.includes(filter.type)
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <span className="font-medium">{filter.label}</span>
                <span className="text-gray-500">({filter.count})</span>
              </button>
            ))}
          </div>
        );

      case 'arrival':
        return (
          <div className="space-y-2">
            {filterOptions.arrival.map((filter, index) => (
              <button
                key={index}
                onClick={() => toggleFilter('arrival', filter.type)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${selectedFilters.arrival.includes(filter.type)
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <span className="font-medium">{filter.label}</span>
                <span className="text-gray-500">({filter.count})</span>
              </button>
            ))}
          </div>
        );

      case 'price':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={selectedFilters.price.min}
                onChange={(e) => setSelectedFilters(prev => ({
                  ...prev,
                  price: { ...prev.price, min: parseInt(e.target.value) || 0 }
                }))}
                className="w-20 p-2 border rounded text-sm"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={selectedFilters.price.max}
                onChange={(e) => setSelectedFilters(prev => ({
                  ...prev,
                  price: { ...prev.price, max: parseInt(e.target.value) || 5000 }
                }))}
                className="w-20 p-2 border rounded text-sm"
              />
            </div>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={selectedFilters.price.max}
              onChange={(e) => setSelectedFilters(prev => ({
                ...prev,
                price: { ...prev.price, max: parseInt(e.target.value) }
              }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>₹0</span>
              <span>₹5000</span>
            </div>
          </div>
        );

      case 'rating':
        return (
          <div className="space-y-2">
            {[4.5, 4.0, 3.5, 3.0].map((rating) => (
              <button
                key={rating}
                onClick={() => setSelectedFilters(prev => ({
                  ...prev,
                  rating: prev.rating === rating ? 0 : rating
                }))}
                className={`w-full flex items-center p-3 rounded-lg border text-sm transition-all ${selectedFilters.rating === rating
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <Star className="w-4 h-4 fill-current text-yellow-500 mr-2" />
                <span className="font-medium">{rating} & above</span>
              </button>
            ))}
          </div>
        );

      case 'amenities':
        return (
          <div className="space-y-2">
            {filterOptions.amenities.map((amenity, index) => (
              <button
                key={index}
                onClick={() => toggleFilter('amenities', amenity.type)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${selectedFilters.amenities.includes(amenity.type)
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <span className="flex items-center space-x-3">
                  {amenity.icon}
                  <span className="font-medium">{amenity.label}</span>
                </span>
                <span className="text-gray-500">({amenity.count})</span>
              </button>
            ))}
          </div>
        );

      case 'operators':
        return (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filterOptions.operators.map((operator, index) => (
              <button
                key={index}
                onClick={() => toggleFilter('operators', operator.label)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${selectedFilters.operators.includes(operator.label)
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
              >
                <span className="font-medium">{operator.label}</span>
                <span className="text-gray-500">({operator.count})</span>
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // Desktop Filter Sidebar Component
  const FilterSidebar = ({ isMobile = false }) => (
    <div className={`space-y-4 ${isMobile ? 'h-full overflow-y-auto p-4 bg-w' : ''}`} data-tour="filters-section">
      {/* Eazzy Filter Section */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg border border-purple-200" data-tour="eazzy-filter">
        <h3 className="font-bold text-purple-800 mb-2">Eazzy Filter</h3>
        <p className="text-sm text-purple-600 mb-3">AI-powered smart filtering</p>
        <input
          type="text"
          placeholder="Try 'evening departure'"
          className="w-full p-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {/* Main Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter buses
            {totalFiltersApplied > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {totalFiltersApplied}
              </span>
            )}
          </h3>
          {totalFiltersApplied > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-red-500 text-sm hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Bus Type Filter */}
        {filterOptions.busType.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, busType: !prev.busType }))}
              className="w-full flex items-center justify-between py-2 font-bold text-lg text-gray-800"
            >
              Bus Type
              {expandedSections.busType ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.busType && (
              <div className="space-y-2 mt-2">
                {filterOptions.busType.map((filter, index) => (
                  <button
                    key={index}
                    onClick={() => toggleFilter('busType', filter.type)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-sm transition-all ${selectedFilters.busType.includes(filter.type)
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                  >
                    <span className="flex items-center space-x-2">
                      {filter.type === 'primo' && <Star className="w-4 h-4 sm:w-6 sm:h-6 text-black font-bold" />}
                      {filter.type === 'ac' && <TbAirConditioning className="w-4 h-4 sm:w-6 sm:h-6 text-black font-bold" />}
                      {filter.type === 'sleeper' && <FaBed className="w-4 h-4 sm:w-6 sm:h-6 text-black font-bold" />}
                      {filter.type === 'womenOnly' && <FaFemale className="w-4 h-4 sm:w-6 sm:h-6 text-black font-bold" />}
                      {filter.type === 'single' && <PiArmchairFill className="w-4 h-4 sm:w-6 sm:h-6 text-black font-bold" />}
                      {filter.type === 'volvo' && <FaBusAlt className="w-4 h-4 sm:w-6 sm:h-6 text-black font-bold" />}
                      {filter.type === 'tracking' && <FaMapMarkerAlt className="w-4 h-4 sm:w-6 sm:h-6 text-black font-bold" />}
                      {filter.type === 'rated' && <MdWorkspacePremium className="w-4 h-4 sm:w-6 sm:h-6 text-black font-bold" />}
                      {filter.type === 'accessible' && <FaWheelchair className="w-4 h-4 sm:w-6 sm:h-6 text-black font-bold" />}
                      <span className="text-xs sm:text-sm">{filter.label}</span>
                    </span>
                    <span className="text-gray-500 text-xs sm:text-sm">({filter.count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Departure Time Filter */}
        {filterOptions.departure.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, departure: !prev.departure }))}
              className="w-full flex items-center justify-between py-2 font-bold text-lg text-gray-800"
            >
              Departure Time
              {expandedSections.departure ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.departure && (
              <div className="space-y-2 mt-2">
                {filterOptions.departure.map((filter, index) => (
                  <button
                    key={index}
                    onClick={() => toggleFilter('departure', filter.type)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-sm transition-all ${selectedFilters.departure.includes(filter.type)
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                  >
                    <span className="font-medium">{filter.label}</span>
                    <span className="text-gray-500">({filter.count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add other filter sections similarly for amenities, arrival, etc. */}

      </div>
    </div>
  );

  // Onboarding Tooltip Component
  const OnboardingTooltip = () => {
    if (!showOnboarding || !currentStep) return null;

    // Calculate tooltip position
    let tooltipStyle = {};
    let arrowClass = '';

    if (currentStep.position === 'center') {
      tooltipStyle = {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    } else if (currentStep.element) {
      const targetElement = document.querySelector(currentStep.element);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const tooltipWidth = 320;
        const tooltipHeight = 200;

        switch (currentStep.position) {
          case 'bottom':
            tooltipStyle = {
              top: rect.bottom + 20,
              left: Math.max(20, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 20)),
            };
            arrowClass = 'top';
            break;
          case 'top':
            tooltipStyle = {
              top: rect.top - tooltipHeight - 20,
              left: Math.max(20, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 20)),
            };
            arrowClass = 'bottom';
            break;
          case 'right':
            tooltipStyle = {
              top: Math.max(20, rect.top + rect.height / 2 - tooltipHeight / 2),
              left: rect.right + 20,
            };
            arrowClass = 'left';
            break;
          case 'left':
            tooltipStyle = {
              top: Math.max(20, rect.top + rect.height / 2 - tooltipHeight / 2),
              left: Math.max(20, rect.left - tooltipWidth - 20),
            };
            arrowClass = 'right';
            break;
        }
      }
    }

    return (
      <div className="onboarding-tooltip" style={tooltipStyle}>
        {arrowClass && <div className={`onboarding-arrow ${arrowClass}`}></div>}

        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-800">{currentStep.title}</h3>
            <button
              onClick={skipOnboardingTour}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="onboarding-progress">
            <div
              className="onboarding-progress-bar"
              style={{ width: `${((onboardingStep + 1) / onboardingSteps.length) * 100}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <span>Step {onboardingStep + 1} of {onboardingSteps.length}</span>
            <span>{Math.round(((onboardingStep + 1) / onboardingSteps.length) * 100)}% Complete</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {currentStep.description}
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={onboardingStep === 0 ? skipOnboardingTour : previousOnboardingStep}
              disabled={onboardingStep === 0}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${onboardingStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-200'
                }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{currentStep.buttons?.[0] || 'Previous'}</span>
            </button>

            <div className="flex space-x-2">
              <button
                onClick={skipOnboardingTour}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Skip Tour
              </button>
              <button
                onClick={nextOnboardingStep}
                className="flex items-center space-x-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                <span>{onboardingStep === onboardingSteps.length - 1 ? 'Finish' : 'Next'}</span>
                {onboardingStep === onboardingSteps.length - 1 ?
                  <SkipForward className="w-4 h-4" /> :
                  <ArrowRight className="w-4 h-4" />
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // === MAIN RETURN JSX (With Onboarding System) ===
  return (
    <div className="min-h-screen bg-[#f2f2f8] border">
      <Navbar/>
      {/* Onboarding Overlay and Spotlight */}
      {showOnboarding && (
        <>
          {currentStep.showOverlay && <div className="onboarding-overlay"></div>}
          {currentStep.element && (
            <div
              className="onboarding-spotlight"
              style={getSpotlightStyle(currentStep.element)}
            ></div>
          )}
          <OnboardingTooltip />
        </>
      )}

      {/* Header Section - Responsive */}
      <div className="bg-white shadow-sm border-b sticky  z-10">
        <div className="max-w-7xl mt-2 mx-auto px-2 sm:px-4 py-2 sm:py-4">
          {/* Route Title */}
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-lg sm:text-2xl font-bold text-gray-800">{from} → {to}</div>
              <div className="text-xs sm:text-sm text-gray-600">
                {loading ? 'Searching...' : `${filteredBuses.length} buses`}
              </div>
            </div>

            {/* Help & Mobile Filter Buttons */}
            <div className="flex items-center space-x-2">
              {/* Restart Tour Button */}
              <button
                onClick={startOnboarding}
                className="hidden sm:flex items-center space-x-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Help Tour</span>
              </button>

              {/* Mobile Filter Button */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center space-x-2 bg-red-500 text-white px-3 py-2 rounded-lg text-sm"
                data-tour="mobile-filter-btn"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {totalFiltersApplied > 0 && (
                  <span className="bg-white text-red-500 text-xs px-1 py-0.5 rounded-full">
                    {totalFiltersApplied}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Controls - Responsive */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center space-y-2 lg:space-y-0 lg:space-x-4" data-tour="search-section">
            {/* From/To Inputs */}
            <div className="flex flex-1">
              <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-50 p-2 sm:p-4 border border-black border-r-0 rounded-l-lg w-full">
                <FaBus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="font-medium bg-transparent outline-none w-full text-sm sm:text-base"
                  placeholder="From city"
                  disabled={showOnboarding}
                />
              </div>
              <button
                onClick={handleSwitch}
                disabled={loading || showOnboarding}
                className="flex items-center justify-center px-2 sm:px-4 py-2 sm:py-4 transition disabled:opacity-50"
              >
                <HiOutlineSwitchHorizontal
                  className={`w-4 h-4 sm:w-5 sm:h-5 text-black-600 transform transition-transform duration-300 ${rotated ? 'rotate-180' : ''}`}
                />
              </button>
              <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-50 p-2 sm:p-4 border border-black border-l-0 rounded-r-lg w-full">
                <FaBus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="font-medium bg-transparent outline-none w-full text-sm sm:text-base"
                  placeholder="To city"
                  disabled={showOnboarding}
                />
              </div>
            </div>

            {/* Date Selection and Search */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-4" data-tour="date-section">
              <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-50 p-1 border border-black rounded-lg">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                <button
                  onClick={() => setSelectedDate('today')}
                  disabled={showOnboarding}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${selectedDate === 'today'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${showOnboarding ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  Today
                </button>
                <button
                  onClick={() => setSelectedDate('tomorrow')}
                  disabled={showOnboarding}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${selectedDate === 'tomorrow'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${showOnboarding ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  Tomorrow
                </button>
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || showOnboarding}
                className="bg-red-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                <Search className="w-4 h-4 inline mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal with Tab Layout */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="bg-white h-3/4 w-full absolute bottom-0 rounded-t-2xl flex">
            {/* Left Sidebar - Filter Tabs */}
            <div className="w-1/3 bg-gray-100 rounded-tl-2xl border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 text-sm">Filters</h3>
              </div>
              <div className="overflow-y-auto h-[calc(100%-60px)]">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilterTab(tab.id)}
                    className={`w-full flex items-center justify-between p-3 border-b border-gray-200 text-left transition-colors ${activeFilterTab === tab.id
                      ? 'bg-white text-blue-600 border-r-2 border-r-blue-600'
                      : 'text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <span className="text-sm font-medium">{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Content Area */}
            <div className="w-2/3 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800">
                  {filterTabs.find(tab => tab.id === activeFilterTab)?.label}
                </h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Area with Scroll */}
              <div className="flex-1 overflow-y-auto p-4">
                {renderFilterContent()}
              </div>

              {/* Fixed Bottom Buttons */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex space-x-3">
                  <button
                    onClick={clearAllFilters}
                    className="flex-1 bg-white text-gray-700 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50"
                  >
                    Clear all
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="flex-1 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600"
                  >
                    Apply ({filteredBuses.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 flex gap-4 lg:gap-6">
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block w-80 h-[calc(100vh-200px)] overflow-y-auto sticky top-32">
          <FilterSidebar />
        </div>

        {/* Bus Results */}
        <div className="flex-1">
          {/* Sort Controls - Responsive */}
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm mb-4" data-tour="sort-section">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="text-gray-700 font-medium text-sm sm:text-base">Sort by:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'ratings', label: 'Ratings' },
                    { value: 'price-low', label: 'Price: Low to High' },
                    { value: 'price-high', label: 'Price: High to Low' },
                    { value: 'departure', label: 'Departure' },
                    { value: 'duration', label: 'Duration' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      disabled={showOnboarding}
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${sortBy === option.value
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } ${showOnboarding ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                {filteredBuses.length} buses found
              </div>
            </div>
          </div>

          <div className="space-y-3 p-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                <span className="ml-3 text-gray-600">Searching for buses...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : filteredBuses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">No buses found for this route</div>
                <div className="text-gray-400 text-sm">Try searching for a different route or clearing filters</div>
              </div>
            ) : (
              filteredBuses.map((bus, index) => {
                // Time-based status calculation
                const getBusStatus = () => {
                  const now = new Date();
                  const currentTime = now.getHours() * 60 + now.getMinutes();

                  const depTime = bus.departure.split(':');
                  const arrTime = bus.arrival.split(':');
                  const departureTime = parseInt(depTime[0]) * 60 + parseInt(depTime[1]);
                  const arrivalTime = parseInt(arrTime[0]) * 60 + parseInt(arrTime[1]);

                  if (currentTime < departureTime) {
                    return { status: 'Starting Soon', color: 'bg-blue-100 text-blue-800', icon: <FaBus /> };
                  } else if (currentTime >= departureTime && currentTime <= arrivalTime) {
                    return { status: 'On Route', color: 'bg-green-100 text-green-800', icon: <FaRoute /> };
                  } else {
                    return { status: 'Completed', color: 'bg-gray-100 text-gray-800', icon: <FaCheckCircle /> };
                  }
                };

                const busStatus = getBusStatus();

                return (
                  <div
                    key={bus.id}
                    className="bg-white rounded-[24px] border shadow-sm transform transition duration-300 hover:scale-[1.01] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
                    data-tour={index === 0 ? "bus-card" : ""}
                  >
                    <div className="p-3 sm:p-6">
                      {/* Top Row - Bus Number (Left) & Status (Center) */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="inline-block bg-yellow-400 text-black text-sm font-semibold px-3 py-1 rounded-md shadow-sm tracking-wide">
                          {bus.busNumber}
                        </div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${busStatus.color}`}>
                          <span className="mr-1">{busStatus.icon}</span>
                          {busStatus.status}
                        </div>
                        <div className="w-20"></div> {/* Spacer for balance */}
                      </div>

                      {/* Mobile Layout */}
                      <div className="block sm:hidden">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-bold text-base text-gray-800">{bus.operator}</h3>
                              {bus.isPrime && (
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                                  <Star className="w-3 h-3 mr-1 fill-current" />
                                  Primo
                                </span>
                              )}
                            </div>
                            <div className="text-gray-600 text-xs mb-2">{bus.type}</div>
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="flex items-center space-x-1">
                                {/* Mobile Star Rating */}
                                <div className="flex text-yellow-500">
                                  {"★".repeat(Math.floor(bus.rating))}
                                  {bus.rating % 1 !== 0 ? "☆" : ""}
                                  <span className="text-gray-300">
                                    {"☆".repeat(5 - Math.ceil(bus.rating))}
                                  </span>
                                </div>
                                <span className="font-medium text-gray-800 text-sm">{bus.rating}</span>
                              </div>
                              <div className="text-gray-500 text-xs">{bus.reviews} reviews</div>
                            </div>
                          </div>
                          <div className="text-right">
                            {bus.discount && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium block mb-2">
                                {bus.discount}
                              </span>
                            )}
                            <div className="text-2xl font-bold text-gray-800">₹{bus.price}</div>
                            <div className="text-xs text-gray-600">per seat</div>
                          </div>
                        </div>

                        {/* Journey Details */}
                        <div className="flex items-center justify-between mb-2 bg-gray-50 p-2 rounded-md">
                          <div className="text-center flex-1">
                            <div className="text-base font-semibold text-gray-800">{bus.departure}</div>
                            <div className="text-xs text-gray-500">{from}</div>
                          </div>
                          <div className="flex-1 flex flex-col items-center mx-2">
                            <div className="text-xs text-gray-600 mb-0.5">{bus.duration || '9h'}</div>
                            <div className="h-px w-full bg-gray-300 relative">
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            </div>
                          </div>
                          <div className="text-center flex-1">
                            <div className="text-base font-semibold text-gray-800">{bus.arrival}</div>
                            <div className="text-xs text-gray-500">{to}</div>
                          </div>
                        </div>

                        {/* Features and Amenities */}
                        <div className="mb-1">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {bus.features?.slice(0, 3).map((feature, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                          {bus.amenities && bus.amenities.length > 0 && (
                            <div className="flex items-center space-x-2">
                              {bus.amenities.slice(0, 3).map((amenity, index) => (
                                <div key={index} className="flex items-center space-x-1 text-gray-600">
                                  {getAmenityIcon(amenity)}
                                  <span className="text-xs capitalize">{amenity}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Mobile Actions with Shimmer Effect */}
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-600">{bus.seats}</div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewSeats(bus)}
                              disabled={showOnboarding}
                              className="text-red-500 text-xs hover:underline font-medium px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              View Seats
                            </button>
                            <button
                              onClick={() => handleBookNow(bus)}
                              disabled={showOnboarding}
                              className="shimmer-button-mobile text-white px-4 py-2 rounded-lg font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Desktop/Tablet Layout */}
                      <div className="hidden sm:block">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-bold text-lg text-gray-800">{bus.operator}</h3>
                              {bus.isPrime && (
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                                  <Star className="w-3 h-3 mr-1 fill-current" />
                                  Primo
                                </span>
                              )}
                            </div>
                            <div className="text-gray-600 text-sm mb-3">{bus.type}</div>
                            <div className="flex items-center space-x-4 mb-4">
                              <div className="flex items-center space-x-1">
                                {/* Desktop Star Rating */}
                                <div className="flex text-yellow-500">
                                  {"★".repeat(Math.floor(bus.rating))}
                                  {bus.rating % 1 !== 0 ? "☆" : ""}
                                  <span className="text-gray-300">
                                    {"☆".repeat(5 - Math.ceil(bus.rating))}
                                  </span>
                                </div>
                                <span className="font-medium text-gray-800">{bus.rating}</span>
                              </div>
                              <div className="text-gray-500 text-sm">{bus.reviews} reviews</div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {bus.features?.map((feature, index) => (
                                <span
                                  key={index}
                                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                            {bus.amenities && bus.amenities.length > 0 && (
                              <div className="flex items-center space-x-3">
                                {bus.amenities.map((amenity, index) => (
                                  <div key={index} className="flex items-center space-x-1 text-gray-600">
                                    {getAmenityIcon(amenity)}
                                    <span className="text-xs capitalize">{amenity}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 mx-4 sm:mx-8">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-center">
                                <div className="text-xl sm:text-2xl font-bold text-gray-800">{bus.departure}</div>
                                <div className="text-sm text-gray-600">{from}</div>
                              </div>
                              <div className="flex-1 mx-4">
                                <div className="text-center text-sm text-gray-600 mb-1">{bus.duration || '9h'}</div>
                                <div className="h-px bg-gray-300 relative">
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-xl sm:text-2xl font-bold text-gray-800">{bus.arrival}</div>
                                <div className="text-sm text-gray-600">{to}</div>
                              </div>
                            </div>
                            <div className="text-center text-sm text-gray-600">{bus.seats}</div>
                          </div>

                          {/* Desktop Actions with Shimmer Effect */}
                          <div className="text-right">
                            <div className="mb-2">
                              {bus.discount && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                  {bus.discount}
                                </span>
                              )}
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">₹{bus.price}</div>
                            <div className="text-sm text-gray-600 mb-4">per seat</div>
                            <button
                              onClick={() => handleBookNow(bus)}
                              disabled={showOnboarding}
                              className="shimmer-button text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium w-full mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Book Now
                            </button>
                            <button
                              onClick={() => handleViewSeats(bus)}
                              disabled={showOnboarding}
                              className="text-red-500 text-sm hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              View Seats
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Load More */}
          {filteredBuses.length > 0 && !loading && (
            <div className="text-center mt-8">
              <button
                className="bg-gray-100 text-gray-700 px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={showOnboarding}
              >
                Load More Buses
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
