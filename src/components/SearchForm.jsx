import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaExchangeAlt,
  FaBus,
  FaFemale,
  FaCalendarAlt,
  FaBusAlt,
  FaExclamationTriangle,
} from 'react-icons/fa';

const citySuggestions = [
  'Delhi', 'Mumbai', 'Jaipur', 'Bangalore', 'Chennai',
  'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Kota',
  'Tiruchirapalli', 'Trichy'
];

// Enhanced Portal Suggestion Dropdown for Mobile & Desktop
function SuggestionPortal({ anchorRef, show, items, onSelect, isMobile = false }) {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (anchorRef.current && show) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({
        left: rect.left + window.scrollX,
        top: rect.bottom + window.scrollY,
        width: rect.width,
      });
    }
  }, [show, anchorRef, items.length]);

  if (!show || !coords || items.length === 0) return null;

  // Different styling for mobile vs desktop
  const dropdownStyle = isMobile ? {
    position: 'fixed',
    left: '16px',
    right: '16px',
    top: coords.top + 8,
    zIndex: 50000,
    background: 'white',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 8px 25px rgba(0,0,0,0.1)',
    borderRadius: 16,
    marginTop: 0,
    maxHeight: window.innerHeight * 0.4,
    overflowY: 'auto',
    padding: 0,
    listStyle: 'none',
    border: '1px solid rgba(0,0,0,0.05)',
  } : {
    position: 'absolute',
    left: coords.left - (coords.width * 0.10),
    top: coords.top,
    width: coords.width * 1.2,
    zIndex: 10000,
    background: 'white',
    boxShadow: '0 8px 32px rgba(30,30,60,0.20)',
    borderRadius: 16,
    marginTop: 3,
    maxHeight: 340,
    overflowY: 'auto',
    padding: 0,
    listStyle: 'none',
  };

  return createPortal(
    <div>
      {/* Mobile overlay */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 49999,
          }}
          onClick={() => onSelect(null)}
        />
      )}
      
      <ul style={dropdownStyle}>
        {isMobile && (
          <li style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f0f0f0',
            color: '#666',
            fontSize: '14px',
            fontWeight: '600',
            background: '#f8f9fa',
            borderRadius: '16px 16px 0 0',
          }}>
            Select City
          </li>
        )}
        
        {items.map((city, idx) => (
          <li
            key={idx}
            style={{
              padding: isMobile ? '18px 20px' : '20px 32px',
              cursor: 'pointer',
              fontWeight: 600,
              borderBottom: idx < items.length - 1 ? '1px solid #f4f4f4' : 'none',
              letterSpacing: '.02em',
              fontSize: isMobile ? '18px' : '22px',
              lineHeight: isMobile ? '24px' : '32px',
              background: '#fff',
              transition: 'all 0.2s ease',
              ...(idx === items.length - 1 && {
                borderRadius: '0 0 16px 16px'
              })
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(city);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              onSelect(city);
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = isMobile ? '#f0f8ff' : '#f6f8fc';
              e.currentTarget.style.color = '#1a73e8';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = 'inherit';
            }}
          >
            {city}
          </li>
        ))}
      </ul>
    </div>,
    document.body
  );
}

const SearchForm = ({ initialFrom = '', initialTo = '', initialDate = '' }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    from: initialFrom,
    to: initialTo,
    date: initialDate || '2025-07-22',
    womenOnly: false,
    accessible: false,
    ac: false,
    sleeper: false,
  });
  const [error, setError] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);

  const fromInputRef = useRef();
  const toInputRef = useRef();

  // Enhanced click outside handler
  useEffect(() => {
    function handleClick(e) {
      // Don't close if clicking on suggestion items
      if (e.target.closest('[data-suggestion-item]')) {
        return;
      }
      
      if (fromInputRef.current && !fromInputRef.current.contains(e.target)) {
        setShowFrom(false);
      }
      if (toInputRef.current && !toInputRef.current.contains(e.target)) {
        setShowTo(false);
      }
    }

    function handleTouchStart(e) {
      // Don't close if touching suggestion items
      if (e.target.closest('[data-suggestion-item]')) {
        return;
      }
      
      if (fromInputRef.current && !fromInputRef.current.contains(e.target)) {
        setShowFrom(false);
      }
      if (toInputRef.current && !toInputRef.current.contains(e.target)) {
        setShowTo(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleTouchStart);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const swapCities = () => {
    setForm((prev) => ({
      ...prev,
      from: prev.to,
      to: prev.from,
    }));
  };

  const handleSearch = async () => {
    if (!form.from || !form.to || form.from === form.to) {
      setError(true);
      setTimeout(() => setError(false), 1000);
      return;
    }
    setIsSearching(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const searchParams = new URLSearchParams({
      from: form.from,
      to: form.to,
      date: form.date,
      womenOnly: form.womenOnly.toString(),
      accessible: form.accessible.toString(),
      ac: form.ac.toString(),
      sleeper: form.sleeper.toString(),
    });
    navigate(`/Search?${searchParams.toString()}`);
    setIsSearching(false);
  };

  const getTodayTomorrowLabel = () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (form.date === today) return 'Today';
    if (form.date === tomorrow) return 'Tomorrow';
    return new Date(form.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const setQuickDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setForm(prev => ({
      ...prev,
      date: date.toISOString().split('T')[0],
    }));
  };

  const getFromSuggestions = () => {
    if (!form.from.trim()) {
      return citySuggestions;
    }
    return citySuggestions.filter(city =>
      city.toLowerCase().includes(form.from.toLowerCase())
    );
  };

  const getToSuggestions = () => {
    let availableCities = citySuggestions;

    if (form.from.trim()) {
      availableCities = citySuggestions.filter(city =>
        city.toLowerCase() !== form.from.toLowerCase()
      );
    }

    if (!form.to.trim()) {
      return availableCities;
    }
    return availableCities.filter(city =>
      city.toLowerCase().includes(form.to.toLowerCase())
    );
  };

  const filteredFrom = getFromSuggestions();
  const filteredTo = getToSuggestions();

  // Handle suggestion selection
  const handleFromSelect = (city) => {
    if (city) {
      setForm(prev => ({ ...prev, from: city }));
    }
    setShowFrom(false);
  };

  const handleToSelect = (city) => {
    if (city) {
      setForm(prev => ({ ...prev, to: city }));
    }
    setShowTo(false);
  };

  return (
    <>
      {/* Mobile/Tablet View (up to 1024px) */}
      <div className="lg:hidden w-full min-h-screen bg-gray-50 relative">
        {/* Header */}
        <div className="bg-white px-4 py-6 border-b border-gray-100 relative z-10">
          <h1 className="text-2xl font-bold text-gray-900">Bus Tickets</h1>
        </div>

        {/* Main Form Container */}
        <div className="px-4 py-6 relative z-10">
          <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 ${error ? 'border-red-300 bg-red-50' : ''}`}>
            
            {/* From Section */}
            <div className="px-4 py-4 border-b border-gray-100 relative" ref={fromInputRef}>
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <FaBus className="text-gray-500 mr-3 text-lg" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">From</div>
                    <input
                      name="from"
                      autoComplete="off"
                      value={form.from}
                      onChange={handleChange}
                      onFocus={() => setShowFrom(true)}
                      onClick={() => setShowFrom(true)}
                      onTouchStart={() => setShowFrom(true)}
                      placeholder="Departure city"
                      className="w-full border-none outline-none text-xl font-bold text-gray-900 bg-transparent placeholder-gray-400"
                    />
                  </div>
                </div>
                <button
                  onClick={swapCities}
                  className="bg-gray-800 text-white p-2 rounded-full mt-10 hover:scale-105 transition-all duration-200 ml-3"
                  disabled={isSearching}
                  type="button"
                >
                  <FaExchangeAlt className="text-sm" />
                </button>
              </div>
            </div>

            {/* To Section */}
            <div className="px-4 py-4 border-b border-gray-100 relative" ref={toInputRef}>
              <div className="flex items-center">
                <FaBus className="text-gray-500 mr-3 text-lg" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">To</div>
                  <input
                    name="to"
                    autoComplete="off"
                    value={form.to}
                    onChange={handleChange}
                    onFocus={() => setShowTo(true)}
                    onClick={() => setShowTo(true)}
                    onTouchStart={() => setShowTo(true)}
                    placeholder="Destination city"
                    className="w-full border-none outline-none text-xl font-bold text-gray-900 bg-transparent placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Date Section */}
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center mb-3">
                <FaCalendarAlt className="text-gray-500 mr-3 text-lg" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">Date of Journey</div>
                  <div className="text-xl font-bold text-gray-900">
                    {new Date(form.date).toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setQuickDate(0)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    form.date === new Date().toISOString().split('T')[0]
                      ? 'bg-pink-500 text-white'
                      : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                  }`}
                  type="button"
                >
                  Today
                </button>
                <button
                  onClick={() => setQuickDate(1)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    form.date === new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      ? 'bg-pink-500 text-white'
                      : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                  }`}
                  type="button"
                >
                  Tomorrow
                </button>
              </div>
            </div>

            {/* Women Only Section */}
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                    <FaFemale className="text-pink-500 text-sm" />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-gray-900">Booking for women</div>
                    <a href="#" className="text-sm text-blue-500 underline">Know more</a>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="womenOnly"
                    checked={form.womenOnly}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                    form.womenOnly ? 'bg-pink-500' : 'bg-gray-300'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      form.womenOnly ? 'translate-x-6' : 'translate-x-0.5'
                    } mt-0.5`} />
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="mt-6">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className={`w-full bg-red-600 hover:bg-red-700 text-white text-lg font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${
                isSearching ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg'
              }`}
              type="button"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Searching...
                </>
              ) : (
                <>
                  <FaSearch className="text-lg" />
                  Search buses
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <FaExclamationTriangle className="text-red-500 text-lg flex-shrink-0" />
              <div className="text-red-700 text-sm font-medium">
                Please enter valid source and destination cities.
              </div>
            </div>
          )}
        </div>

        {/* Mobile Suggestion Portals */}
        <SuggestionPortal
          anchorRef={fromInputRef}
          show={showFrom}
          items={filteredFrom}
          onSelect={handleFromSelect}
          isMobile={true}
        />
        
        <SuggestionPortal
          anchorRef={toInputRef}
          show={showTo}
          items={filteredTo}
          onSelect={handleToSelect}
          isMobile={true}
        />
      </div>

      {/* Desktop/Laptop View (1024px and above) - ORIGINAL DESIGN */}
      <div className="hidden lg:block relative max-w-7xl mt-20 mx-auto px-4 z-30 animate-fade-in">
        <div className={`relative bg-white border border-gray-200 shadow-2xl rounded-3xl p-4 md:p-5 transition-all duration-500 min-h-[150px] ${error ? 'animate-pulse border-red-500 bg-red-50/60' : ''}`}>
          <div className="flex flex-col md:flex-row items-stretch rounded-2xl shadow-lg overflow-hidden border border-gray-200 max-w-full md:max-w-[1200px] mx-auto">
            {/* From Section */}
            <div className="flex-1 px-4 py-2 border-r border-gray-200 relative flex flex-col" ref={fromInputRef}>
              <label className="text-xs font-bold text-gray-700 mb-1 uppercase">From</label>
              <div className="relative flex items-center">
                <FaBus className="text-gray-500 mr-2 text-base flex-shrink-0" />
                <input
                  name="from"
                  autoComplete="off"
                  value={form.from}
                  onChange={handleChange}
                  onFocus={() => setShowFrom(true)}
                  onClick={() => setShowFrom(true)}
                  placeholder="Departure city"
                  className="w-full border-none outline-none text-base font-bold text-gray-800 bg-transparent placeholder-gray-400 h-9"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex items-center justify-center px-2 border-r border-gray-200 bg-gray-50">
              <button
                onClick={swapCities}
                className="bg-black text-white p-2.5 rounded-full hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-xl"
                title="Swap Cities"
                disabled={isSearching}
                type="button"
                style={{ width: 38, height: 38 }}
              >
                <FaExchangeAlt className="text-base" />
              </button>
            </div>

            {/* To Section */}
            <div className="flex-1 px-4 py-2 border-r border-gray-200 relative flex flex-col" ref={toInputRef}>
              <label className="text-xs font-bold text-gray-700 mb-1 uppercase">To</label>
              <div className="relative flex items-center">
                <FaBus className="text-gray-500 mr-2 text-base flex-shrink-0" />
                <input
                  name="to"
                  autoComplete="off"
                  value={form.to}
                  onChange={handleChange}
                  onFocus={() => setShowTo(true)}
                  onClick={() => setShowTo(true)}
                  placeholder="Destination city"
                  className="w-full border-none outline-none text-base font-bold text-gray-800 bg-transparent placeholder-gray-400 h-9"
                />
              </div>
            </div>

            {/* Date Section */}
            <div className="flex-1 px-4 py-2 border-r border-gray-200 flex flex-col">
              <label className="text-xs font-bold text-gray-700 mb-1 uppercase flex items-center gap-1.5">
                <FaCalendarAlt className="text-blue-500" /> Date of Journey
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={handleChange}
                  className="border-none outline-none text-base font-bold text-gray-800 bg-transparent h-9 cursor-pointer"
                  style={{ lineHeight: '1.5rem', width: 135 }}
                />
                <button
                  onClick={() => setQuickDate(0)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${form.date === new Date().toISOString().split('T')[0]
                    ? 'bg-pink-500 text-white shadow-lg'
                    : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                    }`}
                  type="button"
                >Today</button>
                <button
                  onClick={() => setQuickDate(1)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${form.date === new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    ? 'bg-pink-500 text-white shadow-lg'
                    : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                    }`}
                  type="button"
                >Tomorrow</button>
              </div>
            </div>

            {/* Women Only Section */}
            <div className="flex-1 px-4 py-2 flex flex-col justify-center">
              <label className="text-xs font-bold text-gray-700 mb-1 uppercase">Booking for Women</label>
              <div className="flex items-center gap-2">
                <FaFemale className="text-pink-500 text-base flex-shrink-0" />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="womenOnly"
                    checked={form.womenOnly}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div
                    className={`w-11 h-6 rounded-full transition-colors duration-200 ${form.womenOnly ? 'bg-pink-500' : 'bg-gray-300'
                      }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${form.womenOnly ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`}
                    />
                  </div>
                </label>
                <a href="#" className="text-blue-500 text-xs underline hover:text-blue-700 whitespace-nowrap">
                  Know more
                </a>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="absolute left-1/2 -bottom-7 transform -translate-x-1/2 z-20">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className={`bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-base font-bold px-10 py-3 rounded-full flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 shadow-2xl ${isSearching ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              type="button"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Searching...
                </>
              ) : (
                <>
                  <FaSearch className="text-lg" /> Search Buses
                </>
              )}
            </button>
          </div>

          {/* Floating error/info message card */}
          {(error || (form.from && form.to && !error)) && (
            <div
              style={{
                position: 'absolute',
                bottom: '-90px',
                left: '90%',
                transform: 'translateX(-50%)',
                zIndex: 11000,
                maxWidth: 380,
                minWidth: 280,
                borderRadius: 16,
                boxShadow: '0 8px 32px rgba(40,40,80,0.20)',
                background: error ? '#fff4f4' : '#f2f7ff',
                border: error ? '2px solid #ff9e99' : '2px solid #8ac9ff',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 18,
                padding: '26px 32px 22px 24px',
                animation: 'fadeinright 0.4s cubic-bezier(.25,.86,.51,1.05)',
                fontSize: 17,
                lineHeight: '28px',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  fontSize: '2.2rem',
                  marginTop: 1,
                  color: error ? '#dd2525' : '#3b68e9',
                }}
                aria-hidden="true"
              >
                {error ? <FaExclamationTriangle /> : <FaBusAlt />}
              </div>
              <div style={{ fontWeight: 500, color: error ? '#bd2323' : '#1a30a9', fontSize: 15 }}>
                {error ? (
                  <span style={{ fontWeight: 600 }}>
                    ⚠️ Please enter valid source and destination cities.
                  </span>
                ) : (
                  <>
                     Ready to search buses from{' '}
                    <strong style={{ color: '#d23586', fontWeight: 700 }}>{form.from}</strong> to{' '}
                    <strong style={{ color: '#d23586', fontWeight: 700 }}>{form.to}</strong> on{' '}
                    <span
                      style={{
                        color: '#3b68e9',
                        background: '#e7f2ff',
                        borderRadius: 6,
                        padding: '2px 7px',
                        fontSize: 15,
                      }}
                    >
                      {getTodayTomorrowLabel()}
                    </span>
                  </>
                )}
              </div>

              <style>{`
                @keyframes fadeinright {
                  from { opacity: 0; transform: translateX(40px);}
                  to   { opacity: 1; transform: translateX(0);}
                }
              `}</style>
            </div>
          )}

          {/* Desktop Suggestion Portals */}
          <SuggestionPortal
            anchorRef={fromInputRef}
            show={showFrom && filteredFrom.length > 0}
            items={filteredFrom}
            onSelect={handleFromSelect}
            isMobile={false}
          />
          
          <SuggestionPortal
            anchorRef={toInputRef}
            show={showTo && filteredTo.length > 0}
            items={filteredTo}
            onSelect={handleToSelect}
            isMobile={false}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
      `}</style>
    </>
  );
};

export default SearchForm;
