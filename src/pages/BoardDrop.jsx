import React, { useState } from 'react';
import { ChevronLeft, Clock, MapPin, Users } from 'lucide-react';

const BusBookingInterface = () => {
  const [selectedTab, setSelectedTab] = useState(2); // Default to "Board/Drop point"
  const [selectedBoardingPoint, setSelectedBoardingPoint] = useState(0);
  const [selectedDroppingPoint, setSelectedDroppingPoint] = useState(0);

  const boardingPoints = [
    {
      time: "23:05",
      location: "Chikkaballapur Bypass",
      description: "Second Bypass Flyover Ending"
    },
    {
      time: "23:30",
      location: "Begihalli",
      description: "Begihalli Toll Gate"
    }
  ];

  const droppingPoints = [
    {
      time: "06:10",
      location: "Shamshabad",
      date: "20 Jul"
    },
    {
      time: "06:40",
      location: "Gachibowli",
      date: "20 Jul"
    },
    {
      time: "06:45",
      location: "Kondapur",
      date: "20 Jul"
    },
    {
      time: "06:50",
      location: "Miyapur",
      date: "20 Jul",
      description: "Near Bharath Petrol Pump, Beside Pullareddy Sweets Shop"
    },
    {
      time: "06:52",
      location: "Miyapur",
      date: "20 Jul"
    },
    {
      time: "06:55",
      location: "Miyapur",
      date: "20 Jul",
      description: "Miyapur Metro"
    },
    {
      time: "06:57",
      location: "Hydernagar",
      date: "20 Jul",
      description: "Opp: Rainbow Children Hospital"
    },
    {
      time: "07:00",
      location: "Nizampet",
      date: "20 Jul"
    },
    {
      time: "07:05",
      location: "Jntu",
      date: "20 Jul",
      description: "Near Jntu Metro Station, Metro Pillar No. 698, Towards Miyapur"
    },
    {
      time: "07:10",
      location: "Kukatpally",
      date: "20 Jul",
      description: "K.P. HB"
    },
    {
      time: "07:15",
      location: "Vivekanandanagar, Hyderabad",
      date: "20 Jul",
      description: "Near Ramdev Hospital"
    },
    {
      time: "07:20",
      location: "Kukatpally",
      date: "20 Jul"
    }
  ];

  const TabButton = ({ number, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 ${
        isActive
          ? 'text-red-600 border-red-600 bg-white'
          : 'text-gray-600 border-transparent hover:text-gray-800'
      }`}
    >
      <span className={`mr-2 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
        isActive ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
      }`}>
        {number}
      </span>
      {label}
    </button>
  );

  const PointCard = ({ point, isSelected, onSelect, type }) => (
    <div 
      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
        isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <div className="text-lg font-semibold text-gray-900">
            {point.time}
          </div>
          <div>
            <div className="font-medium text-gray-900">{point.location}</div>
            {point.description && (
              <div className="text-sm text-gray-500">{point.description}</div>
            )}
            {point.date && (
              <div className="text-xs text-red-500">{point.date}</div>
            )}
          </div>
        </div>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 ${
        isSelected 
          ? 'border-red-500 bg-red-500' 
          : 'border-gray-300'
      }`}>
        {isSelected && (
          <div className="w-full h-full rounded-full bg-red-500 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <button className="mr-4">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-2 text-gray-600">
          <span>Bangalore</span>
          <span>→</span>
          <span>Hyderabad</span>
        </div>
        <div className="ml-auto bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
          Try new 10% OFF
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b bg-gray-50">
        <TabButton 
          number="1" 
          label="Select seats" 
          isActive={selectedTab === 1}
          onClick={() => setSelectedTab(1)}
        />
        <TabButton 
          number="2" 
          label="Board/Drop point" 
          isActive={selectedTab === 2}
          onClick={() => setSelectedTab(2)}
        />
        <TabButton 
          number="3" 
          label="Passenger Info" 
          isActive={selectedTab === 3}
          onClick={() => setSelectedTab(3)}
        />
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Boarding Points */}
        <div className="w-1/2 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Boarding points</h3>
            <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded">
              Chikkaballapur Bypass
            </div>
          </div>
          
          <div className="space-y-3">
            {boardingPoints.map((point, index) => (
              <PointCard
                key={index}
                point={point}
                isSelected={selectedBoardingPoint === index}
                onSelect={() => setSelectedBoardingPoint(index)}
                type="boarding"
              />
            ))}
          </div>
        </div>

        {/* Dropping Points */}
        <div className="w-1/2 p-6 border-l">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Dropping points</h3>
            <div className="text-sm text-gray-600">Shamshabad</div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {droppingPoints.map((point, index) => (
              <PointCard
                key={index}
                point={point}
                isSelected={selectedDroppingPoint === index}
                onSelect={() => setSelectedDroppingPoint(index)}
                type="dropping"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between p-4 border-t bg-gray-50">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-600" />
          <span className="text-gray-600">1 seat</span>
          <span className="text-2xl font-bold text-gray-900">₹1,089</span>
        </div>
        <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
          Fill passenger details
        </button>
      </div>
    </div>
  );
};

export default BusBookingInterface;
