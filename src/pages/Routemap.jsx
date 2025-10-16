// pages/RouteMap.jsx - Complete Interactive Route Map with City Pairs
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
  FaRoute, 
  FaBus, 
  FaMapMarkerAlt, 
  FaSearch, 
  FaLocationArrow,
  FaPlay,
  FaPause,
  FaArrowRight,
  FaTimes
} from 'react-icons/fa';

const RouteMap = () => {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredRoute, setHoveredRoute] = useState(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFromTo, setSelectedFromTo] = useState(null);

  // All Indian cities with their positions (800x700 viewBox)
  const cities = [
    { name: "Delhi", x: 400, y: 120, type: "metro", population: "32M" },
    { name: "Mumbai", x: 200, y: 300, type: "metro", population: "21M" },
    { name: "Bengaluru", x: 480, y: 520, type: "metro", population: "13M" },
    { name: "Chennai", x: 580, y: 480, type: "metro", population: "11M" },
    { name: "Hyderabad", x: 520, y: 420, type: "metro", population: "10M" },
    { name: "Kolkata", x: 650, y: 300, type: "metro", population: "15M" },
    { name: "Pune", x: 280, y: 360, type: "major", population: "6M" },
    { name: "Ahmedabad", x: 220, y: 260, type: "major", population: "8M" },
    { name: "Jaipur", x: 320, y: 180, type: "major", population: "4M" },
    { name: "Surat", x: 240, y: 280, type: "major", population: "5M" },
    { name: "Lucknow", x: 420, y: 220, type: "major", population: "3M" },
    { name: "Kanpur", x: 440, y: 240, type: "major", population: "3M" },
    { name: "Indore", x: 340, y: 280, type: "major", population: "2M" },
    { name: "Bhopal", x: 380, y: 300, type: "major", population: "2M" },
    { name: "Nagpur", x: 480, y: 320, type: "major", population: "3M" },
    { name: "Vadodara", x: 260, y: 290, type: "city", population: "2M" },
    { name: "Nashik", x: 300, y: 320, type: "city", population: "2M" },
    { name: "Patna", x: 560, y: 240, type: "major", population: "2M" },
    { name: "Ranchi", x: 580, y: 280, type: "city", population: "1M" },
    { name: "Raipur", x: 520, y: 340, type: "city", population: "1M" },
    { name: "Vijayawada", x: 540, y: 440, type: "city", population: "1M" },
    { name: "Visakhapatnam", x: 600, y: 420, type: "city", population: "2M" },
    { name: "Coimbatore", x: 500, y: 520, type: "city", population: "2M" },
    { name: "Madurai", x: 520, y: 580, type: "city", population: "1M" },
    { name: "Trichy", x: 540, y: 560, type: "city", population: "1M" },
    { name: "Tirupati", x: 560, y: 500, type: "city", population: "0.5M" },
    { name: "Kochi", x: 460, y: 600, type: "city", population: "2M" },
    { name: "Thiruvananthapuram", x: 440, y: 620, type: "city", population: "1M" },
    { name: "Mysuru", x: 460, y: 560, type: "city", population: "1M" },
    { name: "Hubli", x: 440, y: 480, type: "city", population: "1M" },
    { name: "Belagavi", x: 420, y: 460, type: "city", population: "0.5M" },
    { name: "Guwahati", x: 720, y: 200, type: "city", population: "1M" },
    { name: "Jodhpur", x: 280, y: 200, type: "city", population: "1M" },
    { name: "Udaipur", x: 300, y: 240, type: "city", population: "0.5M" },
    { name: "Gwalior", x: 380, y: 200, type: "city", population: "1M" },
    { name: "Agra", x: 360, y: 180, type: "city", population: "2M" },
    { name: "Meerut", x: 390, y: 150, type: "city", population: "1M" },
    { name: "Dehradun", x: 380, y: 120, type: "city", population: "0.7M" },
    { name: "Haridwar", x: 390, y: 130, type: "city", population: "0.3M" },
    { name: "Varanasi", x: 560, y: 210, type: "city", population: "1M" },
    { name: "Prayagraj", x: 570, y: 240, type: "city", population: "1M" },
    { name: "Bhagalpur", x: 590, y: 260, type: "city", population: "0.4M" },
    { name: "Jamshedpur", x: 610, y: 290, type: "city", population: "1M" },
    { name: "Guntur", x: 580, y: 440, type: "city", population: "0.7M" },
    { name: "Warangal", x: 520, y: 400, type: "city", population: "0.8M" },
    { name: "Rewari", x: 350, y: 160, type: "city", population: "0.3M" },
    { name: "Gurugram", x: 360, y: 140, type: "city", population: "1.5M" },
    { name: "Mangalore", x: 470, y: 565, type: "city", population: "0.7M" },
    { name: "Silchar", x: 750, y: 220, type: "city", population: "0.3M" },
    { name: "Bilaspur", x: 540, y: 360, type: "city", population: "0.4M" }
  ];

  // 🔥 NEW: Bus routes connecting the cities (as per your requirements)
  const routes = [
    // Delhi routes
    { from: "Delhi", to: "Jaipur", type: "express", color: "#3b82f6" },
    { from: "Delhi", to: "Agra", type: "express", color: "#3b82f6" },
    { from: "Delhi", to: "Lucknow", type: "express", color: "#3b82f6" },
    { from: "Delhi", to: "Dehradun", type: "regular", color: "#3b82f6" },
    
    // Mumbai routes
    { from: "Mumbai", to: "Pune", type: "express", color: "#3b82f6" },
    { from: "Mumbai", to: "Surat", type: "regular", color: "#3b82f6" },
    { from: "Mumbai", to: "Ahmedabad", type: "express", color: "#3b82f6" },
    { from: "Nashik", to: "Mumbai", type: "regular", color: "#3b82f6" },
    
    // Gujarat routes
    { from: "Ahmedabad", to: "Udaipur", type: "regular", color: "#3b82f6" },
    { from: "Surat", to: "Vadodara", type: "regular", color: "#3b82f6" },
    { from: "Vadodara", to: "Ahmedabad", type: "regular", color: "#3b82f6" },
    
    // Rajasthan routes
    { from: "Jaipur", to: "Jodhpur", type: "regular", color: "#3b82f6" },
    { from: "Jaipur", to: "Udaipur", type: "regular", color: "#3b82f6" },
    { from: "Rewari", to: "Jaipur", type: "regular", color: "#3b82f6" },
    { from: "Gurugram", to: "Rewari", type: "regular", color: "#3b82f6" },
    
    // South India routes
    { from: "Bengaluru", to: "Mysuru", type: "regular", color: "#3b82f6" },
    { from: "Bengaluru", to: "Hyderabad", type: "express", color: "#3b82f6" },
    { from: "Mysuru", to: "Mangalore", type: "regular", color: "#3b82f6" },
    { from: "Belagavi", to: "Hubli", type: "regular", color: "#3b82f6" },
    
    // Hyderabad routes
    { from: "Hyderabad", to: "Vijayawada", type: "regular", color: "#3b82f6" },
    { from: "Hyderabad", to: "Visakhapatnam", type: "regular", color: "#3b82f6" },
    { from: "Tirupati", to: "Hyderabad", type: "regular", color: "#3b82f6" },
    { from: "Warangal", to: "Vijayawada", type: "regular", color: "#3b82f6" },
    
    // Tamil Nadu routes
    { from: "Chennai", to: "Coimbatore", type: "express", color: "#3b82f6" },
    { from: "Chennai", to: "Madurai", type: "express", color: "#3b82f6" },
    { from: "Chennai", to: "Tirupati", type: "regular", color: "#3b82f6" },
    { from: "Coimbatore", to: "Trichy", type: "regular", color: "#3b82f6" },
    { from: "Madurai", to: "Trichy", type: "regular", color: "#3b82f6" },
    
    // East India routes
    { from: "Kolkata", to: "Bhagalpur", type: "regular", color: "#3b82f6" },
    { from: "Kolkata", to: "Ranchi", type: "regular", color: "#3b82f6" },
    { from: "Jamshedpur", to: "Ranchi", type: "regular", color: "#3b82f6" },
    
    // Central India routes
    { from: "Patna", to: "Varanasi", type: "regular", color: "#3b82f6" },
    { from: "Patna", to: "Ranchi", type: "regular", color: "#3b82f6" },
    { from: "Varanasi", to: "Prayagraj", type: "regular", color: "#3b82f6" },
    { from: "Lucknow", to: "Kanpur", type: "regular", color: "#3b82f6" },
    { from: "Kanpur", to: "Prayagraj", type: "regular", color: "#3b82f6" },
    
    // MP routes
    { from: "Indore", to: "Bhopal", type: "regular", color: "#3b82f6" },
    { from: "Bhopal", to: "Nagpur", type: "regular", color: "#3b82f6" },
    { from: "Nagpur", to: "Raipur", type: "regular", color: "#3b82f6" },
    { from: "Raipur", to: "Bilaspur", type: "regular", color: "#3b82f6" },
    
    // North routes
    { from: "Dehradun", to: "Haridwar", type: "regular", color: "#3b82f6" },
    { from: "Agra", to: "Gwalior", type: "regular", color: "#3b82f6" },
    { from: "Meerut", to: "Delhi", type: "regular", color: "#3b82f6" },
    
    // Andhra Pradesh routes
    { from: "Visakhapatnam", to: "Guntur", type: "regular", color: "#3b82f6" },
    
    // Northeast route
    { from: "Guwahati", to: "Silchar", type: "regular", color: "#3b82f6" }
  ];

  // Filter cities based on search
  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get city position by name
  const getCityPosition = (cityName) => {
    const city = cities.find(c => c.name === cityName);
    return city ? { x: city.x, y: city.y } : { x: 0, y: 0 };
  };

  // Get routes for a specific city
  const getCityRoutes = (cityName) => {
    return routes.filter(route => route.from === cityName || route.to === cityName);
  };

  // Handle city click
  const handleCityClick = (city) => {
    setSelectedCity(city);
    setSelectedFromTo(null);
  };

  // Handle route click/selection
  const handleRouteClick = (route) => {
    setSelectedFromTo({
      from: route.from,
      to: route.to,
      route: route
    });
  };

  // Navigate to booking
  const handleBookBus = (fromCity, toCity) => {
    navigate('/search', { 
      state: { 
        from: fromCity, 
        to: toCity,
        date: new Date().toISOString().split('T')[0]
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="py-8" style={{ paddingTop: '80px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <FaRoute className="text-red-600" />
                  <span>Interactive Route Map</span>
                </h1>
                <p className="text-gray-600 mt-2">Click on cities to explore bus routes and book tickets</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsAnimating(!isAnimating)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isAnimating ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {isAnimating ? <FaPause /> : <FaPlay />}
                  <span>{isAnimating ? 'Pause' : 'Play'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* From-To Selection Box */}
          {selectedFromTo && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-lg">{selectedFromTo.from}</span>
                  </div>
                  <FaArrowRight className="text-blue-500" />
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-semibold text-lg">{selectedFromTo.to}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleBookBus(selectedFromTo.from, selectedFromTo.to)}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
                  >
                    <FaBus />
                    <span>Book Bus</span>
                  </button>
                  <button
                    onClick={() => setSelectedFromTo(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Sidebar - Cities List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <FaMapMarkerAlt className="text-red-600" />
                  <span>Cities</span>
                </h2>
                
                {/* Search Cities */}
                <div className="relative mb-4">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search cities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-full"
                  />
                </div>

                {/* Cities List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredCities.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => handleCityClick(city)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                        selectedCity?.name === city.name
                          ? 'bg-red-100 border-red-200 border-2'
                          : 'hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            city.type === 'metro' ? 'bg-red-500' : 
                            city.type === 'major' ? 'bg-blue-500' : 'bg-green-500'
                          }`}></div>
                          <div>
                            <div className="font-medium text-gray-900">{city.name}</div>
                            <div className="text-xs text-gray-500">{city.population}</div>
                          </div>
                        </div>
                        {selectedCity?.name === city.name && (
                          <div className="text-red-600">
                            <FaLocationArrow />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Routes from selected city */}
                {selectedCity && (
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Routes from {selectedCity.name}
                    </h3>
                    <div className="space-y-2">
                      {getCityRoutes(selectedCity.name).map((route, index) => {
                        const destination = route.from === selectedCity.name ? route.to : route.from;
                        return (
                          <button
                            key={index}
                            onClick={() => handleRouteClick(route)}
                            className="w-full text-left p-2 rounded-lg hover:bg-blue-50 border border-gray-200 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <FaArrowRight className="text-blue-500 text-sm" />
                                <span className="text-sm font-medium">{destination}</span>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                route.type === 'express' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {route.type}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Map Container */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <svg
                  viewBox="0 0 800 700"
                  className="w-full h-96 md:h-[600px]"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  {/* Background Pattern */}
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                    </pattern>
                    
                    {/* Route gradient */}
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6">
                        {isAnimating && (
                          <animate attributeName="stop-opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                        )}
                      </stop>
                      <stop offset="50%" stopColor="#06b6d4">
                        {isAnimating && (
                          <animate attributeName="stop-opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
                        )}
                      </stop>
                      <stop offset="100%" stopColor="#3b82f6">
                        {isAnimating && (
                          <animate attributeName="stop-opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                        )}
                      </stop>
                    </linearGradient>
                    
                    {/* City glow effect */}
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Background Grid */}
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Routes */}
                  {routes.map((route, index) => {
                    const fromPos = getCityPosition(route.from);
                    const toPos = getCityPosition(route.to);
                    const isHighlighted = selectedCity && (selectedCity.name === route.from || selectedCity.name === route.to);
                    const isSelectedRoute = selectedFromTo && 
                      ((selectedFromTo.from === route.from && selectedFromTo.to === route.to) ||
                       (selectedFromTo.from === route.to && selectedFromTo.to === route.from));
                    
                    return (
                      <g key={index}>
                        <line
                          x1={fromPos.x}
                          y1={fromPos.y}
                          x2={toPos.x}
                          y2={toPos.y}
                          stroke={isSelectedRoute ? "url(#routeGradient)" : 
                                  isHighlighted ? route.color : "rgba(255,255,255,0.2)"}
                          strokeWidth={isSelectedRoute ? "4" : isHighlighted ? "3" : "1"}
                          strokeDasharray={route.type === 'express' ? "none" : "5,5"}
                          className="transition-all duration-300 cursor-pointer hover:stroke-4"
                          onClick={() => handleRouteClick(route)}
                          onMouseEnter={() => setHoveredRoute(route)}
                          onMouseLeave={() => setHoveredRoute(null)}
                        >
                          {isAnimating && isHighlighted && (
                            <animate attributeName="stroke-dashoffset" values="0;20" dur="1s" repeatCount="indefinite" />
                          )}
                        </line>
                        
                        {/* Route direction indicator for selected route */}
                        {isSelectedRoute && (
                          <circle
                            cx={fromPos.x + (toPos.x - fromPos.x) * 0.5}
                            cy={fromPos.y + (toPos.y - fromPos.y) * 0.5}
                            r="4"
                            fill="#3b82f6"
                          >
                            {isAnimating && (
                              <animateTransform
                                attributeName="transform"
                                type="translate"
                                values={`${fromPos.x - (fromPos.x + (toPos.x - fromPos.x) * 0.5)},${fromPos.y - (fromPos.y + (toPos.y - fromPos.y) * 0.5)};${toPos.x - (fromPos.x + (toPos.x - fromPos.x) * 0.5)},${toPos.y - (fromPos.y + (toPos.y - fromPos.y) * 0.5)};${fromPos.x - (fromPos.x + (toPos.x - fromPos.x) * 0.5)},${fromPos.y - (fromPos.y + (toPos.y - fromPos.y) * 0.5)}`}
                                dur="3s"
                                repeatCount="indefinite"
                              />
                            )}
                          </circle>
                        )}
                      </g>
                    );
                  })}

                  {/* Cities */}
                  {filteredCities.map((city, index) => {
                    const isSelected = selectedCity && selectedCity.name === city.name;
                    const isInSelectedRoute = selectedFromTo && 
                      (selectedFromTo.from === city.name || selectedFromTo.to === city.name);
                    const cityColor = city.type === 'metro' ? '#dc2626' : city.type === 'major' ? '#2563eb' : '#16a34a';
                    const radius = city.type === 'metro' ? 8 : city.type === 'major' ? 6 : 4;
                    
                    return (
                      <g key={index}>
                        {/* City glow effect */}
                        {(isSelected || isInSelectedRoute) && (
                          <circle
                            cx={city.x}
                            cy={city.y}
                            r={radius + 8}
                            fill={isInSelectedRoute ? '#3b82f6' : cityColor}
                            opacity="0.3"
                            filter="url(#glow)"
                          >
                            {isAnimating && (
                              <animate attributeName="r" values={`${radius + 8};${radius + 15};${radius + 8}`} dur="2s" repeatCount="indefinite" />
                            )}
                          </circle>
                        )}
                        
                        {/* City node */}
                        <circle
                          cx={city.x}
                          cy={city.y}
                          r={radius}
                          fill={isInSelectedRoute ? '#3b82f6' : cityColor}
                          stroke="white"
                          strokeWidth="2"
                          className="cursor-pointer transition-all duration-300 hover:scale-110"
                          onClick={() => handleCityClick(city)}
                        >
                          {isAnimating && isSelected && (
                            <animate attributeName="r" values={`${radius};${radius + 2};${radius}`} dur="1s" repeatCount="indefinite" />
                          )}
                        </circle>
                        
                        {/* City name */}
                        <text
                          x={city.x}
                          y={city.y - radius - 8}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight="600"
                          fill="white"
                          className="pointer-events-none"
                          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
                        >
                          {city.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* Route info tooltip */}
                  {hoveredRoute && (
                    <g>
                      <rect
                        x="10"
                        y="10"
                        width="220"
                        height="80"
                        fill="rgba(0,0,0,0.8)"
                        rx="8"
                      />
                      <text x="20" y="30" fill="white" fontSize="12" fontWeight="600">
                        {hoveredRoute.from} → {hoveredRoute.to}
                      </text>
                      <text x="20" y="45" fill="rgba(255,255,255,0.8)" fontSize="10">
                        Type: {hoveredRoute.type === 'express' ? 'Express Route' : 'Regular Route'}
                      </text>
                      <text x="20" y="60" fill="rgba(59,130,246,1)" fontSize="10">
                        Click route to select • Click cities to explore
                      </text>
                      <text x="20" y="75" fill="rgba(34,197,94,1)" fontSize="10">
                        Book buses between these cities
                      </text>
                    </g>
                  )}
                </svg>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{cities.filter(c => c.type === 'metro').length}</div>
              <div className="text-sm text-gray-600">Metro Cities</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{cities.filter(c => c.type === 'major').length}</div>
              <div className="text-sm text-gray-600">Major Cities</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{cities.filter(c => c.type === 'city').length}</div>
              <div className="text-sm text-gray-600">Other Cities</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{routes.length}</div>
              <div className="text-sm text-gray-600">Bus Routes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMap;
