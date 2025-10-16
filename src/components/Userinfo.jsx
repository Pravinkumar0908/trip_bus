// components/PassengerInfoCard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setBookingData } from '../utils/data';
import {
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  User,
  ArrowRight,
  Edit2,
  Users,
  Layers,
  Calendar,
  Clock,
  Bus
} from 'lucide-react';

const PassengerInfoCard = ({
  selectedSeats = [],
  seatLayout = {},
  busData,
  selectedBoardingPoint,
  selectedDroppingPoint,
  totalAmount = 0,
  onContinue,
  currentRoute // 🔥 NEW - localhost route data with absolute priority
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [isContactEditMode, setIsContactEditMode] = useState(true);
  const [loading, setLoading] = useState(false);

  // Contact form state
  const [contactData, setContactData] = useState({
    countryCode: '+91',
    phone: '',
    email: '',
    state: ''
  });

  // Dynamic passenger forms based on selected seats
  const [passengerForms, setPassengerForms] = useState([]);

  // Initialize passenger forms when selected seats change
  useEffect(() => {
    const forms = selectedSeats.map((seatId, index) => ({
      seatId,
      seatName: formatSeatName(seatId),
      deck: seatId.startsWith('lower') ? 'Lower' : 'Upper',
      passengerName: '',
      passengerAge: '',
      gender: '',
      idType: 'Aadhar Card',
      idNumber: '',
      isExpanded: index === 0 // First form expanded by default
    }));
    setPassengerForms(forms);
  }, [selectedSeats]);

  // Country codes list
  const countryCodes = [
    { code: '+91', country: 'IND', name: 'India' },
    { code: '+1', country: 'USA', name: 'United States' },
    { code: '+44', country: 'UK', name: 'United Kingdom' },
    { code: '+971', country: 'UAE', name: 'United Arab Emirates' },
    { code: '+65', country: 'SGP', name: 'Singapore' },
    { code: '+60', country: 'MYS', name: 'Malaysia' },
    { code: '+66', country: 'THA', name: 'Thailand' },
    { code: '+86', country: 'CHN', name: 'China' },
    { code: '+81', country: 'JPN', name: 'Japan' },
    { code: '+82', country: 'KOR', name: 'South Korea' },
    { code: '+49', country: 'DEU', name: 'Germany' },
    { code: '+33', country: 'FRA', name: 'France' },
    { code: '+39', country: 'ITA', name: 'Italy' },
    { code: '+34', country: 'ESP', name: 'Spain' },
    { code: '+61', country: 'AUS', name: 'Australia' },
    { code: '+64', country: 'NZL', name: 'New Zealand' },
    { code: '+27', country: 'ZAF', name: 'South Africa' },
    { code: '+55', country: 'BRA', name: 'Brazil' },
    { code: '+52', country: 'MEX', name: 'Mexico' },
    { code: '+7', country: 'RUS', name: 'Russia' }
  ];

  // Indian states list
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
    'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli', 'Daman and Diu',
    'Lakshadweep'
  ];

  // ID Types
  const idTypes = [
    'Aadhar Card',
    'PAN Card',
    'Passport',
    'Driving License',
    'Voter ID',
    'Student ID',
    'Employee ID'
  ];

  // Helper functions
  const formatSeatName = (seatId) => {
    if (!seatId) return 'N/A';
    const [deck, rowStr, colStr] = seatId.split('-');
    const row = parseInt(rowStr);
    const col = parseInt(colStr);
    return `${String.fromCharCode(65 + row)}${col + 1}`;
  };

  // Get seats by deck for better organization
  const getSeatsByDeck = () => {
    const lowerSeats = selectedSeats.filter(seat => seat.startsWith('lower'));
    const upperSeats = selectedSeats.filter(seat => seat.startsWith('upper'));

    return {
      lower: lowerSeats,
      upper: upperSeats,
      total: selectedSeats.length
    };
  };

  const seatsByDeck = getSeatsByDeck();

  // 🔥 LOCALHOST PRIORITY: Date formatting using currentRoute first
  const formatDate = (dateString) => {
    try {
      // Priority: currentRoute.date > busData.date > current date
      const date = new Date(dateString || currentRoute?.date || busData?.date || Date.now());
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (err) {
      return new Date().toLocaleDateString('en-IN');
    }
  };

  // 🔥 LOCALHOST PRIORITY: Time formatting
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      if (timeString.includes(':')) return timeString;
      return new Date(`2000-01-01 ${timeString}`).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (err) {
      return timeString;
    }
  };

  // 🔥 LOCALHOST PRIORITY: Get route display info
  const getRouteDisplay = () => {
    return {
      from: currentRoute?.from || busData?.route?.from || 'Origin',
      to: currentRoute?.to || busData?.route?.to || 'Destination', 
      date: currentRoute?.date || busData?.date || new Date().toISOString().split('T')[0],
      departureTime: currentRoute?.departureTime || busData?.departureTime || 'N/A',
      arrivalTime: currentRoute?.arrivalTime || busData?.arrivalTime || 'N/A'
    };
  };

  const routeDisplay = getRouteDisplay();

  const handleContactChange = (field, value) => {
    setContactData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePassengerChange = (index, field, value) => {
    setPassengerForms(prev => prev.map((form, i) =>
      i === index ? { ...form, [field]: value } : form
    ));
  };

  const togglePassengerForm = (index) => {
    setPassengerForms(prev => prev.map((form, i) =>
      i === index ? { ...form, isExpanded: !form.isExpanded } : form
    ));
  };

  // Validation functions
  const isContactDetailsFilled = () => {
    return contactData.phone && contactData.email && contactData.state;
  };

  const areAllPassengerDetailsFilled = () => {
    return passengerForms.every(form =>
      form.passengerName &&
      form.passengerAge &&
      form.gender &&
      form.idNumber &&
      form.passengerAge >= 1 &&
      form.passengerAge <= 120
    );
  };

  const canProceedToPayment = () => {
    return isContactDetailsFilled() && areAllPassengerDetailsFilled() && selectedSeats.length > 0;
  };

  // Validation helpers
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const navigate = useNavigate();

  const handleContinue = () => {
    if (!isContactDetailsFilled()) {
      alert('Please fill all contact details');
      return;
    }

    if (!validateEmail(contactData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (!validatePhone(contactData.phone)) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    if (!areAllPassengerDetailsFilled()) {
      alert('Please fill all required details for all passengers');
      return;
    }

    const names = passengerForms.map(form => form.passengerName.toLowerCase().trim());
    const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      alert('Passenger names must be unique. Please check for duplicate entries.');
      return;
    }

    setLoading(true);

    // 🔥 LOCALHOST PRIORITY: Booking data with currentRoute
    const completeBookingData = {
      busData,
      selectedSeats,
      selectedBoardingPoint,
      selectedDroppingPoint,
      totalAmount,
      // Use localhost route data
      route: {
        from: routeDisplay.from,
        to: routeDisplay.to,
        date: routeDisplay.date,
        departureTime: routeDisplay.departureTime,
        arrivalTime: routeDisplay.arrivalTime
      },
      contactDetails: {
        phone: `${contactData.countryCode} ${contactData.phone}`,
        email: contactData.email.toLowerCase().trim(),
        state: contactData.state,
        whatsappEnabled: whatsappEnabled
      },
      passengers: passengerForms.map(form => ({
        seatId: form.seatId,
        seatName: form.seatName,
        deck: form.deck,
        name: form.passengerName.trim(),
        age: parseInt(form.passengerAge),
        gender: form.gender,
        idType: form.idType,
        idNumber: form.idNumber.trim().toUpperCase()
      })),
      bookingDate: new Date().toISOString(),
      totalPassengers: passengerForms.length
    };

    setBookingData(completeBookingData);

    setTimeout(() => {
      setLoading(false);
      navigate('/payment');
      if (onContinue) {
        onContinue(completeBookingData);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
          <div className="text-center text-gray-600 text-sm mb-4 font-bold">
            {busData?.operatorName || 'Premium Bus Service'}
          </div>
          
          {/* 🔥 LOCALHOST PRIORITY: Journey header with route display */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-center flex-1">
              <div className="font-bold text-lg text-black flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                {formatTime(selectedBoardingPoint?.time)} • {formatDate(routeDisplay.date)}
              </div>
              <div className="text-black font-bold text-lg mt-1">
                {selectedBoardingPoint?.name || routeDisplay.from}
              </div>
              <div className="text-xs text-gray-500 mt-1 max-w-32">
                {selectedBoardingPoint?.address || 'Boarding from ' + routeDisplay.from}
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="flex items-center justify-center mb-2">
                <Bus className="text-red-500 w-6 h-6" />
              </div>
              <div className="w-full h-px bg-gray-300 relative">
                <ArrowRight className="text-gray-400 w-4 h-4 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white" />
              </div>
              <div className="text-xs text-gray-500 mt-2 font-medium">
                {routeDisplay.from} → {routeDisplay.to}
              </div>
            </div>
            <div className="text-center flex-1">
              <div className="font-bold text-lg text-black flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                {formatTime(selectedDroppingPoint?.time)} • {formatDate(routeDisplay.date)}
              </div>
              <div className="text-black font-bold text-lg mt-1">
                {selectedDroppingPoint?.name || routeDisplay.to}
              </div>
              <div className="text-xs text-gray-500 mt-1 max-w-32">
                {selectedDroppingPoint?.address || 'Dropping at ' + routeDisplay.to}
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-700" />
                <span className="font-bold text-gray-800">
                  Selected Seats ({selectedSeats.length} passengers)
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-red-600">₹{totalAmount}</div>
                <div className="text-xs text-gray-500">Total Amount</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {seatsByDeck.lower.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-700">Lower Deck ({seatsByDeck.lower.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {seatsByDeck.lower.map(seatId => (
                      <span key={seatId} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                        {formatSeatName(seatId)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {seatsByDeck.upper.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-gray-700">Upper Deck ({seatsByDeck.upper.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {seatsByDeck.upper.map(seatId => (
                      <span key={seatId} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                        {formatSeatName(seatId)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
              <span className="text-sm text-green-600 font-bold">
                {routeDisplay.from} to {routeDisplay.to} • {selectedSeats.length} passengers
              </span>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 text-sm underline font-bold hover:text-blue-800 transition-colors"
            >
              {showDetails ? 'Hide details' : 'View details'}
            </button>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-black">Contact details</h2>
                {isContactDetailsFilled() && !isContactEditMode && (
                  <button
                    onClick={() => setIsContactEditMode(true)}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                    title="Edit contact details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {!isContactDetailsFilled() || isContactEditMode ? (
                <>
                  <p className="text-gray-600 text-sm mb-6">
                    Ticket details will be sent to these contact details
                  </p>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-40">
                        <label className="block text-sm text-black font-bold mb-1">Country Code</label>
                        <select
                          value={contactData.countryCode}
                          onChange={(e) => handleContactChange('countryCode', e.target.value)}
                          className="w-full p-3 border-2 border-black rounded-lg bg-white font-bold text-black focus:ring-2 focus:ring-red-500"
                        >
                          {countryCodes.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.code} ({country.country})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm text-black font-bold mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          value={contactData.phone}
                          onChange={(e) => handleContactChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="Enter 10-digit phone number"
                          className="w-full p-3 border-2 border-black rounded-lg font-bold text-black focus:ring-2 focus:ring-red-500"
                          maxLength="10"
                        />
                        {contactData.phone && !validatePhone(contactData.phone) && (
                          <p className="text-red-500 text-xs mt-1">Please enter a valid 10-digit phone number</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-black font-bold mb-1">Email ID *</label>
                      <input
                        type="email"
                        value={contactData.email}
                        onChange={(e) => handleContactChange('email', e.target.value)}
                        placeholder="Enter email address"
                        className="w-full p-3 border-2 border-black rounded-lg font-bold text-black focus:ring-2 focus:ring-red-500"
                      />
                      {contactData.email && !validateEmail(contactData.email) && (
                        <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-black font-bold mb-1">State of Residence *</label>
                      <select
                        value={contactData.state}
                        onChange={(e) => handleContactChange('state', e.target.value)}
                        className="w-full p-3 border-2 border-black rounded-lg bg-white font-bold text-black focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">Select State</option>
                        {indianStates.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Required for GST Tax Invoicing</p>
                    </div>
                    {isContactDetailsFilled() && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => setIsContactEditMode(false)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                        >
                          Save Contact Details
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-600 text-sm mb-4">Ticket details will be sent to</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-black text-lg">
                          {contactData.countryCode} {contactData.phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-black text-lg">
                          {contactData.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-black text-lg">
                          {contactData.state}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold text-black">Send booking details and trip updates on WhatsApp</span>
                </div>
                <button
                  onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${whatsappEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${whatsappEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6 text-black">
                Passenger details ({selectedSeats.length} passengers)
              </h2>
              <div className="space-y-4">
                {passengerForms.map((form, index) => (
                  <div key={form.seatId} className="border-2 border-gray-300 rounded-lg p-4">
                    <div
                      className="flex items-center justify-between mb-4 cursor-pointer"
                      onClick={() => togglePassengerForm(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${form.seatId.startsWith('lower') ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                          <User className={`w-5 h-5 ${form.seatId.startsWith('lower') ? 'text-blue-600' : 'text-green-600'
                            }`} />
                        </div>
                        <div>
                          <div className="font-bold text-black">
                            {form.passengerName || `Passenger ${index + 1}`}
                          </div>
                          <div className="text-sm text-gray-600">
                            {form.passengerAge && form.gender
                              ? `${form.passengerAge} years • ${form.gender === 'male' ? 'Male' : 'Female'} • Seat: ${form.seatName} (${form.deck} Deck)`
                              : `Seat: ${form.seatName} (${form.deck} Deck)`
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {form.passengerName && form.passengerAge && form.gender && form.idNumber && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                        {form.isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    {form.isExpanded && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-black font-bold mb-1">Full Name *</label>
                          <input
                            type="text"
                            value={form.passengerName}
                            onChange={(e) => handlePassengerChange(index, 'passengerName', e.target.value)}
                            placeholder="Enter passenger full name"
                            className="w-full p-3 border-2 border-black rounded-lg font-bold text-black focus:ring-2 focus:ring-red-500"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Enter name as per government ID</p>
                        </div>
                        <div>
                          <label className="block text-sm text-black font-bold mb-1">Age *</label>
                          <input
                            type="number"
                            value={form.passengerAge}
                            onChange={(e) => {
                              const age = parseInt(e.target.value);
                              if (age >= 1 && age <= 120) {
                                handlePassengerChange(index, 'passengerAge', e.target.value);
                              }
                            }}
                            placeholder="Enter age"
                            min="1"
                            max="120"
                            className="w-full p-3 border-2 border-black rounded-lg font-bold text-black focus:ring-2 focus:ring-red-500"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Age must be between 1 and 120 years</p>
                        </div>
                        <div>
                          <label className="block text-sm text-black font-bold mb-2">Gender *</label>
                          <div className="flex gap-4">
                            <label className="cursor-pointer">
                              <input
                                type="radio"
                                name={`gender-${index}`}
                                value="male"
                                checked={form.gender === 'male'}
                                onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                                className="sr-only"
                              />
                              <div className={`
                                flex items-center px-4 py-3 rounded-lg border-2 transition-all duration-200 min-w-[100px]
                                ${form.gender === 'male'
                                  ? 'border-red-500 bg-red-50 text-red-700'
                                  : 'border-gray-400 bg-white text-black hover:border-red-300'
                                }
                              `}>
                                <div className={`
                                  w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3
                                  ${form.gender === 'male'
                                    ? 'border-red-500 bg-white'
                                    : 'border-gray-400 bg-white'
                                  }
                                `}>
                                  {form.gender === 'male' && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                  )}
                                </div>
                                <span className="text-sm font-bold">Male</span>
                              </div>
                            </label>
                            <label className="cursor-pointer">
                              <input
                                type="radio"
                                name={`gender-${index}`}
                                value="female"
                                checked={form.gender === 'female'}
                                onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                                className="sr-only"
                              />
                              <div className={`
                                flex items-center px-4 py-3 rounded-lg border-2 transition-all duration-200 min-w-[100px]
                                ${form.gender === 'female'
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-400 bg-white text-black hover:border-blue-300'
                                }
                              `}>
                                <div className={`
                                  w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3
                                  ${form.gender === 'female'
                                    ? 'border-blue-500 bg-white'
                                    : 'border-gray-400 bg-white'
                                  }
                                `}>
                                  {form.gender === 'female' && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                  )}
                                </div>
                                <span className="text-sm font-bold">Female</span>
                              </div>
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-black font-bold mb-1">ID Type *</label>
                          <select
                            value={form.idType}
                            onChange={(e) => handlePassengerChange(index, 'idType', e.target.value)}
                            className="w-full p-3 border-2 border-black rounded-lg bg-white font-bold text-black focus:ring-2 focus:ring-red-500"
                            required
                          >
                            {idTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-black font-bold mb-1">{form.idType} Number *</label>
                          <input
                            type="text"
                            value={form.idNumber}
                            onChange={(e) => handlePassengerChange(index, 'idNumber', e.target.value)}
                            placeholder={`Enter ${form.idType} number`}
                            className="w-full p-3 border-2 border-black rounded-lg font-bold text-black focus:ring-2 focus:ring-red-500"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Required for ticket verification during travel</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <div className="bg-blue-600 text-white p-4 rounded-lg mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold">
                    {busData?.operatorName || 'Premium Bus Service'}
                  </span>
                  {busData?.isPrime && (
                    <span className="text-xs bg-blue-500 px-2 py-1 rounded font-bold">Prime</span>
                  )}
                </div>
                <div className="text-xs">Route: {routeDisplay.from} → {routeDisplay.to}</div>
                <div className="text-xs">Total: ₹{totalAmount}</div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <span className="text-sm font-bold">
                    {busData?.features?.[0] || 'AC'} • {busData?.busType || 'Sleeper'}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-black">
                    {busData?.operatorName || 'Bus Service'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {busData?.busNumber} • {busData?.features?.join(', ') || 'AC, Sleeper'}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="w-px h-8 bg-gray-300"></div>
                    </div>
                    <div>
                      <div className="font-bold text-black">
                        {formatTime(selectedBoardingPoint?.time)} • {selectedBoardingPoint?.name || routeDisplay.from}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDate(routeDisplay.date)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {selectedBoardingPoint?.address || 'Boarding point address'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <div>
                      <div className="font-bold text-black">
                        {formatTime(selectedDroppingPoint?.time)} • {selectedDroppingPoint?.name || routeDisplay.to}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDate(routeDisplay.date)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {selectedDroppingPoint?.address || 'Dropping point address'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="font-bold mb-2 text-black">Seat details</div>
                  <div className="text-sm text-gray-600 mb-2">{selectedSeats.length} passenger(s)</div>
                  {seatsByDeck.lower.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Layers className="w-3 h-3 text-blue-600" />
                        <span className="text-xs font-bold text-blue-600">Lower Deck:</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {seatsByDeck.lower.map(seatId => formatSeatName(seatId)).join(', ')}
                      </div>
                    </div>
                  )}
                  {seatsByDeck.upper.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Layers className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-bold text-green-600">Upper Deck:</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {seatsByDeck.upper.map(seatId => formatSeatName(seatId)).join(', ')}
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-black">Total Amount:</span>
                    <span className="text-xl font-bold text-red-600">
                      ₹{totalAmount}
                    </span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600 mb-2">Completion Status:</div>
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-sm ${isContactDetailsFilled() ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isContactDetailsFilled() ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {isContactDetailsFilled() && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span>Contact Details</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${areAllPassengerDetailsFilled() ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${areAllPassengerDetailsFilled() ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {areAllPassengerDetailsFilled() && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span>Passenger Details ({passengerForms.filter(p => p.passengerName && p.passengerAge && p.gender && p.idNumber).length}/{passengerForms.length})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 sticky bottom-4">
          <button
            onClick={handleContinue}
            disabled={loading || !canProceedToPayment()}
            className={`
              w-full py-3.5 rounded-xl font-bold text-lg text-white transition-all duration-300 relative
              ${!loading && canProceedToPayment()
                ? 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 cursor-not-allowed'
              }
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              `🎫 Continue to Payment (${selectedSeats.length} passengers)`
            )}
          </button>
        </div>
        {showDetails && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDetails(false)}></div>
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-black">Complete Trip Details</h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-6">
                  {/* 🔥 LOCALHOST PRIORITY: Journey Information */}
                  <div>
                    <h4 className="font-semibold text-black mb-3">Journey Information</h4>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <div className="w-px h-16 bg-gray-300"></div>
                        </div>
                        <div>
                          <div className="font-bold text-lg text-black">
                            {selectedBoardingPoint?.name || routeDisplay.from}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(routeDisplay.date)} • {formatTime(selectedBoardingPoint?.time)}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {selectedBoardingPoint?.address || 'Boarding from ' + routeDisplay.from}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center py-2">
                        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-bold">
                          {routeDisplay.from} → {routeDisplay.to} • {busData?.operatorName || 'Premium Service'}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                        <div>
                          <div className="font-bold text-lg text-black">
                            {selectedDroppingPoint?.name || routeDisplay.to}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(routeDisplay.date)} • {formatTime(selectedDroppingPoint?.time)}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {selectedDroppingPoint?.address || 'Dropping at ' + routeDisplay.to}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-black mb-3">Bus Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-bold text-black">Operator:</span>
                        <div className="text-gray-600">{busData?.operatorName || 'Premium Service'}</div>
                      </div>
                      <div>
                        <span className="font-bold text-black">Bus Number:</span>
                        <div className="text-gray-600">{busData?.busNumber || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="font-bold text-black">Bus Type:</span>
                        <div className="text-gray-600">{busData?.busType || 'AC Sleeper'}</div>
                      </div>
                      <div>
                        <span className="font-bold text-black">Features:</span>
                        <div className="text-gray-600">{busData?.features?.join(', ') || 'AC, Sleeper'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-black mb-3">Seat Assignment ({selectedSeats.length} seats)</h4>
                    {seatsByDeck.lower.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Layers className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-blue-600">Lower Deck ({seatsByDeck.lower.length} seats):</span>
                        </div>
                        <div className="text-sm text-gray-600 ml-6">
                          {seatsByDeck.lower.map(seatId => formatSeatName(seatId)).join(', ')}
                        </div>
                      </div>
                    )}
                    {seatsByDeck.upper.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Layers className="w-4 h-4 text-green-600" />
                          <span className="font-bold text-green-600">Upper Deck ({seatsByDeck.upper.length} seats):</span>
                        </div>
                        <div className="text-sm text-gray-600 ml-6">
                          {seatsByDeck.upper.map(seatId => formatSeatName(seatId)).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-black mb-3">Passenger Summary</h4>
                    <div className="space-y-2">
                      {passengerForms.map((passenger, index) => (
                        <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-bold text-black">
                              {passenger.passengerName || `Passenger ${index + 1}`}
                            </span>
                            {passenger.passengerAge && passenger.gender && (
                              <span className="text-gray-600 ml-2">
                                ({passenger.passengerAge}yrs, {passenger.gender})
                              </span>
                            )}
                          </div>
                          <div className="text-gray-600">
                            {passenger.seatName} ({passenger.deck})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {isContactDetailsFilled() && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-black mb-3">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-bold text-black">Phone:</span>
                          <span className="text-gray-600 ml-2">{contactData.countryCode} {contactData.phone}</span>
                        </div>
                        <div>
                          <span className="font-bold text-black">Email:</span>
                          <span className="text-gray-600 ml-2">{contactData.email}</span>
                        </div>
                        <div>
                          <span className="font-bold text-black">State:</span>
                          <span className="text-gray-600 ml-2">{contactData.state}</span>
                        </div>
                        <div>
                          <span className="font-bold text-black">WhatsApp:</span>
                          <span className="text-gray-600 ml-2">{whatsappEnabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-black text-lg">Total Amount:</span>
                      <span className="text-xl font-bold text-red-600">₹{totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerInfoCard;
