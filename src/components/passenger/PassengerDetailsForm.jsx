// components/passenger/PassengerDetailsForm.jsx
import React from 'react';
import { ChevronDown, ChevronUp, User } from 'lucide-react';

const PassengerDetailsForm = ({
  selectedSeats,
  passengerForms,
  setPassengerForms
}) => {
  const idTypes = [
    'Aadhar Card',
    'PAN Card',
    'Passport',
    'Driving License',
    'Voter ID',
    'Student ID',
    'Employee ID'
  ];

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

  return (
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
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  form.seatId.startsWith('lower') ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  <User className={`w-5 h-5 ${
                    form.seatId.startsWith('lower') ? 'text-blue-600' : 'text-green-600'
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
                {/* Name */}
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

                {/* Age */}
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

                {/* Gender */}
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

                {/* ID Type */}
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

                {/* ID Number */}
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
  );
};

export default PassengerDetailsForm;
