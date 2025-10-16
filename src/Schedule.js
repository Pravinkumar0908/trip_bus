import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaMale, 
  FaFemale, 
  FaWheelchair, 
  FaChild, 
  FaSave, 
  FaUndo, 
  FaRedo,
  FaDownload,
  FaUpload,
  FaSearch,
  FaFilter,
  FaPrint,
  FaExpandArrowsAlt,
  FaCompressArrowsAlt,
  FaCog,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';

// Configuration Constants
const BUS_CONFIGURATIONS = {
  standard: { total: 40, perRow: 4, name: 'Standard Bus' },
  luxury: { total: 32, perRow: 4, name: 'Luxury Bus' },
  mini: { total: 25, perRow: 3, name: 'Mini Bus' },
  sleeper: { total: 36, perRow: 6, name: 'Sleeper Bus' },
  volvo: { total: 45, perRow: 5, name: 'Volvo AC Bus' }
};

const SEAT_TYPES = {
  none: { 
    label: 'Available', 
    color: 'bg-white', 
    textColor: 'text-gray-800',
    borderColor: 'border-gray-300',
    icon: null 
  },
  male: { 
    label: 'Male', 
    color: 'bg-blue-200', 
    textColor: 'text-blue-800',
    borderColor: 'border-blue-400',
    icon: FaMale 
  },
  female: { 
    label: 'Female', 
    color: 'bg-pink-200', 
    textColor: 'text-pink-800',
    borderColor: 'border-pink-400',
    icon: FaFemale 
  },
  disabled: { 
    label: 'Disabled', 
    color: 'bg-purple-200', 
    textColor: 'text-purple-800',
    borderColor: 'border-purple-400',
    icon: FaWheelchair 
  },
  child: { 
    label: 'Child', 
    color: 'bg-yellow-200', 
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-400',
    icon: FaChild 
  },
  reserved: { 
    label: 'Reserved', 
    color: 'bg-red-200', 
    textColor: 'text-red-800',
    borderColor: 'border-red-400',
    icon: null 
  },
  vip: { 
    label: 'VIP', 
    color: 'bg-gradient-to-r from-yellow-400 to-orange-500', 
    textColor: 'text-white',
    borderColor: 'border-orange-500',
    icon: null 
  }
};

// Individual Seat Component
const Seat = ({ 
  seat, 
  onClick, 
  isSelected, 
  showSeatNumbers, 
  seatSize, 
  isHighlighted,
  passengerInfo 
}) => {
  const seatType = SEAT_TYPES[seat.type] || SEAT_TYPES.none;
  const IconComponent = seatType.icon;
  
  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-12 h-12 text-sm',
    large: 'w-16 h-16 text-base'
  };

  return (
    <div className="relative group">
      <button
        className={`
          ${sizeClasses[seatSize]} 
          m-1 rounded-lg border-2 transition-all duration-200
          ${seatType.color} 
          ${seatType.textColor} 
          ${seatType.borderColor}
          ${isSelected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
          ${isHighlighted ? 'animate-pulse ring-2 ring-green-400' : ''}
          hover:scale-110 hover:shadow-lg active:scale-95
          flex flex-col items-center justify-center
          font-semibold relative overflow-hidden
        `}
        onClick={() => onClick(seat.id)}
        title={`Seat ${seat.id} - ${seatType.label}`}
      >
        {/* Background Pattern for VIP seats */}
        {seat.type === 'vip' && (
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-orange-400 animate-pulse"></div>
          </div>
        )}
        
        {/* Seat Content */}
        <div className="flex flex-col items-center justify-center z-10">
          {IconComponent && <IconComponent className="text-xs mb-1" />}
          {showSeatNumbers && (
            <span className="text-xs font-bold">{seat.id}</span>
          )}
        </div>

        {/* Status Indicator */}
        {seat.type !== 'none' && (
          <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full transform translate-x-1 -translate-y-1"></div>
        )}
      </button>

      {/* Passenger Info Tooltip */}
      {passengerInfo && passengerInfo[seat.id] && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            {passengerInfo[seat.id].name}
            <br />
            Age: {passengerInfo[seat.id].age}
          </div>
        </div>
      )}
    </div>
  );
};

// Statistics Card Component
const StatsCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className={`${color} rounded-lg p-4 shadow-md`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {Icon && <Icon className="text-2xl text-gray-700" />}
    </div>
  </div>
);

// Filter Component
const FilterPanel = ({ filters, onFilterChange, onReset }) => (
  <div className="bg-gray-50 rounded-lg p-4 mb-4">
    <h3 className="text-lg font-semibold mb-3 flex items-center">
      <FaFilter className="mr-2" />
      Filters
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Seat Type</label>
        <select 
          value={filters.type}
          onChange={(e) => onFilterChange('type', e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">All Types</option>
          {Object.entries(SEAT_TYPES).map(([key, type]) => (
            <option key={key} value={key}>{type.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Deck</label>
        <select 
          value={filters.deck}
          onChange={(e) => onFilterChange('deck', e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Both Decks</option>
          <option value="lower">Lower Deck</option>
          <option value="upper">Upper Deck</option>
        </select>
      </div>
      <div className="flex items-end">
        <button 
          onClick={onReset}
          className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Reset Filters
        </button>
      </div>
    </div>
  </div>
);

// Main Component
const AdvancedSeatLayoutSelector = () => {
  // State Management
  const [deck, setDeck] = useState('lower');
  const [busConfig, setBusConfig] = useState('standard');
  const [seats, setSeats] = useState({});
  const [selectedType, setSelectedType] = useState('male');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showSeatNumbers, setShowSeatNumbers] = useState(true);
  const [seatSize, setSeatSize] = useState('medium');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ type: '', deck: '' });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showStats, setShowStats] = useState(true);
  const [passengerInfo, setPassengerInfo] = useState({});
  const [showPassengerForm, setShowPassengerForm] = useState(false);
  const [currentSeatForInfo, setCurrentSeatForInfo] = useState(null);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Get current bus configuration
  const currentConfig = BUS_CONFIGURATIONS[busConfig];

  // Initialize seats when configuration changes
  useEffect(() => {
    const initializeSeats = () => {
      const newSeats = {};
      ['lower', 'upper'].forEach(deckType => {
        newSeats[deckType] = Array.from({ length: currentConfig.total }, (_, i) => ({
          id: `${deckType === 'lower' ? 'L' : 'U'}-${String(i + 1).padStart(2, '0')}`,
          type: 'none',
          row: Math.floor(i / currentConfig.perRow) + 1,
          column: (i % currentConfig.perRow) + 1,
          deck: deckType
        }));
      });
      setSeats(newSeats);
      saveToHistory(newSeats);
    };

    initializeSeats();
  }, [busConfig]);

  // History Management
  const saveToHistory = (newSeats) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newSeats)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSeats(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSeats(history[historyIndex + 1]);
    }
  };

  // Seat Management
  const handleSeatClick = (seatId) => {
    if (bulkSelectMode) {
      setSelectedSeats(prev => 
        prev.includes(seatId) 
          ? prev.filter(id => id !== seatId)
          : [...prev, seatId]
      );
      return;
    }

    const newSeats = { ...seats };
    const currentSeat = newSeats[deck].find(s => s.id === seatId);
    
    if (currentSeat) {
      const oldType = currentSeat.type;
      currentSeat.type = currentSeat.type === selectedType ? 'none' : selectedType;
      
      // Remove passenger info if seat is being cleared
      if (currentSeat.type === 'none' && passengerInfo[seatId]) {
        const newPassengerInfo = { ...passengerInfo };
        delete newPassengerInfo[seatId];
        setPassengerInfo(newPassengerInfo);
      }
      
      setSeats(newSeats);
      saveToHistory(newSeats);
      
      // Show notification
      addNotification(
        `Seat ${seatId} ${currentSeat.type === 'none' ? 'cleared' : `assigned to ${SEAT_TYPES[currentSeat.type].label}`}`,
        'success'
      );

      // Show passenger form for new assignments
      if (currentSeat.type !== 'none' && currentSeat.type !== oldType) {
        setCurrentSeatForInfo(seatId);
        setShowPassengerForm(true);
      }
    }
  };

  // Bulk Operations
  const applyBulkOperation = (operation) => {
    if (selectedSeats.length === 0) return;

    const newSeats = { ...seats };
    selectedSeats.forEach(seatId => {
      const seatDeck = seatId.startsWith('L') ? 'lower' : 'upper';
      const seat = newSeats[seatDeck].find(s => s.id === seatId);
      if (seat) {
        switch (operation) {
          case 'assign':
            seat.type = selectedType;
            break;
          case 'clear':
            seat.type = 'none';
            break;
          case 'reserve':
            seat.type = 'reserved';
            break;
        }
      }
    });

    setSeats(newSeats);
    saveToHistory(newSeats);
    setSelectedSeats([]);
    setBulkSelectMode(false);
    addNotification(`Bulk operation applied to ${selectedSeats.length} seats`, 'success');
  };

  // Passenger Information Management
  const handlePassengerInfoSubmit = (info) => {
    if (currentSeatForInfo) {
      setPassengerInfo(prev => ({
        ...prev,
        [currentSeatForInfo]: info
      }));
    }
    setShowPassengerForm(false);
    setCurrentSeatForInfo(null);
  };

  // Statistics Calculation
  const statistics = useMemo(() => {
    const allSeats = [...(seats.lower || []), ...(seats.upper || [])];
    const counts = allSeats.reduce((acc, seat) => {
      acc[seat.type] = (acc[seat.type] || 0) + 1;
      return acc;
    }, {});

    const totalSeats = currentConfig.total * 2;
    const occupiedSeats = totalSeats - (counts.none || 0);
    const occupancyRate = totalSeats > 0 ? ((occupiedSeats / totalSeats) * 100).toFixed(1) : 0;

    return {
      total: totalSeats,
      occupied: occupiedSeats,
      available: counts.none || 0,
      male: counts.male || 0,
      female: counts.female || 0,
      disabled: counts.disabled || 0,
      child: counts.child || 0,
      reserved: counts.reserved || 0,
      vip: counts.vip || 0,
      occupancyRate
    };
  }, [seats, currentConfig.total]);

  // Notification System
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Export/Import Functions
  const exportData = () => {
    const data = {
      seats,
      passengerInfo,
      busConfig,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bus-layout-${new Date().getTime()}.json`;
    a.click();
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setSeats(data.seats);
        setPassengerInfo(data.passengerInfo || {});
        setBusConfig(data.busConfig || 'standard');
        addNotification('Data imported successfully', 'success');
      } catch (error) {
        addNotification('Error importing data', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Filter seats based on search and filters
  const filteredSeats = useMemo(() => {
    if (!seats[deck]) return [];
    
    return seats[deck].filter(seat => {
      if (searchTerm && !seat.id.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filters.type && seat.type !== filters.type) {
        return false;
      }
      return true;
    });
  }, [seats, deck, searchTerm, filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Advanced Bus Seat Management System
              </h1>
              <p className="text-gray-600">
                {currentConfig.name} - {deck.toUpperCase()} Deck Layout
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="flex items-center px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              >
                <FaUndo className="mr-1" /> Undo
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="flex items-center px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              >
                <FaRedo className="mr-1" /> Redo
              </button>
              <button
                onClick={exportData}
                className="flex items-center px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <FaDownload className="mr-1" /> Export
              </button>
              <label className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">
                <FaUpload className="mr-1" /> Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`
                  px-4 py-2 rounded-lg shadow-lg text-white animate-slide-in
                  ${notification.type === 'success' ? 'bg-green-500' : 
                    notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}
                `}
              >
                {notification.message}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Configuration Panel */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaCog className="mr-2" />
                Configuration
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Bus Type Selector */}
                <div>
                  <label className="block text-sm font-medium mb-2">Bus Type</label>
                  <select
                    value={busConfig}
                    onChange={(e) => setBusConfig(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    {Object.entries(BUS_CONFIGURATIONS).map(([key, config]) => (
                      <option key={key} value={key}>{config.name}</option>
                    ))}
                  </select>
                </div>

                {/* Deck Selector */}
                <div>
                  <label className="block text-sm font-medium mb-2">Current Deck</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeck('lower')}
                      className={`flex-1 py-2 px-4 rounded-lg transition ${
                        deck === 'lower' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      Lower
                    </button>
                    <button
                      onClick={() => setDeck('upper')}
                      className={`flex-1 py-2 px-4 rounded-lg transition ${
                        deck === 'upper' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      Upper
                    </button>
                  </div>
                </div>

                {/* Seat Size */}
                <div>
                  <label className="block text-sm font-medium mb-2">Seat Size</label>
                  <select
                    value={seatSize}
                    onChange={(e) => setSeatSize(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>

              {/* Display Options */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showSeatNumbers}
                    onChange={(e) => setShowSeatNumbers(e.target.checked)}
                    className="mr-2"
                  />
                  Show Seat Numbers
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showStats}
                    onChange={(e) => setShowStats(e.target.checked)}
                    className="mr-2"
                  />
                  Show Statistics
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={bulkSelectMode}
                    onChange={(e) => setBulkSelectMode(e.target.checked)}
                    className="mr-2"
                  />
                  Bulk Select Mode
                </label>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Search Seats</label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by seat ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <FilterPanel
                filters={filters}
                onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
                onReset={() => setFilters({ type: '', deck: '' })}
              />
            </div>

            {/* Seat Type Selector */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Select Seat Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {Object.entries(SEAT_TYPES).filter(([key]) => key !== 'none').map(([key, type]) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedType(key)}
                      className={`
                        flex flex-col items-center p-3 rounded-lg border-2 transition
                        ${selectedType === key 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      {IconComponent && <IconComponent className="text-xl mb-1" />}
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bulk Operations */}
            {bulkSelectMode && selectedSeats.length > 0 && (
              <div className="bg-yellow-50 rounded-xl shadow-lg p-6 border border-yellow-200">
                <h3 className="text-lg font-semibold mb-4">
                  Bulk Operations ({selectedSeats.length} seats selected)
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => applyBulkOperation('assign')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Assign Selected Type
                  </button>
                  <button
                    onClick={() => applyBulkOperation('clear')}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => applyBulkOperation('reserve')}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Reserve All
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSeats([]);
                      setBulkSelectMode(false);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Seat Layout */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Seat Layout - {deck.toUpperCase()} Deck
                </h3>
                <div className="text-sm text-gray-600">
                  {filteredSeats.length} of {currentConfig.total} seats shown
                </div>
              </div>

              {/* Bus Front Indicator */}
              <div className="text-center mb-4">
                <div className="inline-block bg-gray-800 text-white px-6 py-2 rounded-full text-sm font-medium">
                  🚌 FRONT OF BUS
                </div>
              </div>

              {/* Seat Grid */}
              <div 
                className="grid gap-2 justify-center"
                style={{ 
                  gridTemplateColumns: `repeat(${currentConfig.perRow}, minmax(0, 1fr))`,
                  maxWidth: `${currentConfig.perRow * (seatSize === 'large' ? 80 : seatSize === 'medium' ? 60 : 40)}px`,
                  margin: '0 auto'
                }}
              >
                {filteredSeats.map((seat) => (
                  <Seat
                    key={seat.id}
                    seat={seat}
                    onClick={handleSeatClick}
                    isSelected={selectedSeats.includes(seat.id)}
                    showSeatNumbers={showSeatNumbers}
                    seatSize={seatSize}
                    isHighlighted={searchTerm && seat.id.toLowerCase().includes(searchTerm.toLowerCase())}
                    passengerInfo={passengerInfo}
                  />
                ))}
              </div>

              {/* Bus Rear Indicator */}
              <div className="text-center mt-4">
                <div className="inline-block bg-gray-600 text-white px-6 py-2 rounded-full text-sm font-medium">
                  REAR OF BUS
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            {showStats && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FaInfoCircle className="mr-2" />
                  Statistics
                </h3>
                
                <div className="space-y-3">
                  <StatsCard
                    title="Total Seats"
                    value={statistics.total}
                    color="bg-gray-100"
                    subtitle={`${currentConfig.name}`}
                  />
                  
                  <StatsCard
                    title="Occupancy Rate"
                    value={`${statistics.occupancyRate}%`}
                    color="bg-blue-100"
                    subtitle={`${statistics.occupied}/${statistics.total} occupied`}
                  />
                  
                  <StatsCard
                    title="Available"
                    value={statistics.available}
                    icon={FaCheckCircle}
                    color="bg-green-100"
                  />
                  
                  <StatsCard
                    title="Male"
                    value={statistics.male}
                    icon={FaMale}
                    color="bg-blue-100"
                  />
                  
                  <StatsCard
                    title="Female"
                    value={statistics.female}
                    icon={FaFemale}
                    color="bg-pink-100"
                  />
                  
                  <StatsCard
                    title="Disabled"
                    value={statistics.disabled}
                    icon={FaWheelchair}
                    color="bg-purple-100"
                  />
                  
                  <StatsCard
                    title="Children"
                    value={statistics.child}
                    icon={FaChild}
                    color="bg-yellow-100"
                  />
                  
                  <StatsCard
                    title="Reserved"
                    value={statistics.reserved}
                    icon={FaExclamationTriangle}
                    color="bg-red-100"
                  />
                  
                  <StatsCard
                    title="VIP"
                    value={statistics.vip}
                    color="bg-gradient-to-r from-yellow-100 to-orange-100"
                  />
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Legend</h3>
              <div className="space-y-2">
                {Object.entries(SEAT_TYPES).map(([key, type]) => {
                  const IconComponent = type.icon;
                  return (
                    <div key={key} className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded border ${type.color} ${type.borderColor} flex items-center justify-center`}>
                        {IconComponent && <IconComponent className="text-xs" />}
                      </div>
                      <span className="text-sm">{type.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const newSeats = { ...seats };
                    newSeats[deck].forEach(seat => { seat.type = 'none'; });
                    setSeats(newSeats);
                    saveToHistory(newSeats);
                    setPassengerInfo({});
                    addNotification(`${deck} deck cleared`, 'success');
                  }}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Clear Current Deck
                </button>
                
                <button
                  onClick={() => {
                    const newSeats = { ...seats };
                    Object.keys(newSeats).forEach(deckKey => {
                      newSeats[deckKey].forEach(seat => { seat.type = 'none'; });
                    });
                    setSeats(newSeats);
                    saveToHistory(newSeats);
                    setPassengerInfo({});
                    addNotification('All seats cleared', 'success');
                  }}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Clear All Seats
                </button>
                
                <button
                  onClick={() => window.print()}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center justify-center"
                >
                  <FaPrint className="mr-2" />
                  Print Layout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Passenger Information Modal */}
        {showPassengerForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Passenger Information - Seat {currentSeatForInfo}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handlePassengerInfoSubmit({
                  name: formData.get('name'),
                  age: formData.get('age'),
                  phone: formData.get('phone'),
                  email: formData.get('email')
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full p-2 border rounded"
                      placeholder="Passenger name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Age</label>
                    <input
                      type="number"
                      name="age"
                      required
                      min="1"
                      max="120"
                      className="w-full p-2 border rounded"
                      placeholder="Age"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      className="w-full p-2 border rounded"
                      placeholder="Phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="w-full p-2 border rounded"
                      placeholder="Email address"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPassengerForm(false);
                      setCurrentSeatForInfo(null);
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSeatLayoutSelector;
