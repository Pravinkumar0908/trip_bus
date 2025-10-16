// components/passenger/ContactDetailsForm.jsx
import React from 'react';
import { Phone, Mail, MapPin, Edit2 } from 'lucide-react';

const ContactDetailsForm = ({
  contactData,
  setContactData,
  whatsappEnabled,
  setWhatsappEnabled,
  isContactEditMode,
  setIsContactEditMode,
  isContactDetailsFilled,
  validateEmail,
  validatePhone
}) => {
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

  const handleContactChange = (field, value) => {
    setContactData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
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
            {/* Phone Number */}
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

            {/* Email */}
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

            {/* State */}
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
        // Contact Details Display Mode
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

      {/* WhatsApp Toggle */}
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
  );
};

export default ContactDetailsForm;
