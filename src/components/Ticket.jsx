import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, User, Phone, Mail, 
  CreditCard, Bus, Shield, Star, FileText, 
  CheckCircle, Package, Gavel
} from 'lucide-react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react'; // Updated import

const BusTicket = () => {
  const location = useLocation();
  const [ticketData, setTicketData] = useState(null);
  const [passengerData, setPassengerData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        const paymentData = location.state?.paymentData;
        if (!paymentData) {
          console.error('No payment data found');
          setLoading(false);
          return;
        }

        setTicketData(paymentData);

        const passengerQuery = query(
          collection(db, 'passengerinfo'),
          where('bookingId', '==', paymentData.bookingId)
        );
        const passengerDocs = await getDocs(passengerQuery);
        const passengers = passengerDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPassengerData(passengers);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching ticket data:', error);
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [location.state]);

  if (loading) {
    return <div className="text-center text-gray-600 p-4">Loading ticket...</div>;
  }

  if (!ticketData) {
    return <div className="text-center text-red-600 p-4">No ticket data available</div>;
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    } catch {
      return dateString || 'N/A';
    }
  };

  const formatTime = (timeString) => {
    try {
      return timeString.includes(':') ? timeString : new Date(`2000-01-01 ${timeString}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return timeString || 'N/A';
    }
  };

  const calculateDuration = (departure, arrival) => {
    try {
      const dep = new Date(`2023-01-01 ${departure}`);
      const arr = new Date(`2023-01-01 ${arrival}`);
      const diffMs = arr - dep;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch {
      return ticketData?.busData?.duration || 'N/A';
    }
  };

  const getBerthType = (seatId) => {
    if (!seatId) return 'N/A';
    return seatId.includes('lower') ? 'Lower Sleeper' : 'Upper Sleeper';
  };

  const { busData, totalAmount, selectedSeats, bookingId, transactionId, paymentDetails, contactDetails } = ticketData;

  return (
    <div
      className="max-w-4xl mx-auto p-4 bg-white shadow-lg border border-gray-300 rounded-lg"
      style={{ width: '210mm', minHeight: '297mm' }}
    >
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">TRAVEL EXPRESS</h1>
            <p className="text-gray-300 text-sm">Your Journey, Our Priority</p>
          </div>
          <div className="text-right">
            <div className="bg-white/20 px-3 py-2 rounded">
              <p className="text-xs">Booking ID</p>
              <p className="text-lg font-bold">{bookingId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Status */}
      <div className="border-l-4 border-gray-800 p-3 mb-4 bg-white rounded-lg flex items-center">
        <Shield className="text-gray-800 mr-2" size={16} />
        <span className="text-gray-800 font-semibold text-sm">CONFIRMED TICKET</span>
      </div>

      {/* Main Ticket Information */}
      <div className="border-2 border-gray-800 mb-6 rounded-lg" style={{ minHeight: '55%' }}>
        <div className="grid grid-cols-2 h-full">
          {/* Left Side */}
          <div className="border-r border-gray-200 p-4">
            {/* Booking Details */}
            <div className="mb-4">
              <h3 className="flex items-center text-sm font-semibold text-gray-800 mb-2 border-b pb-1">
                <FileText size={16} className="mr-1" /> Booking Details
              </h3>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-600">PNR Number</td>
                    <td className="py-1 font-semibold">{bookingId}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-600">Issue Date</td>
                    <td className="py-1 font-semibold">{formatDate(paymentDetails?.timestamp)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-600">Platform</td>
                    <td className="py-1 font-semibold">Online</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">Channel</td>
                    <td className="py-1 font-semibold">Web App</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Passenger Information */}
            <div className="mb-4">
              <h3 className="flex items-center text-sm font-semibold text-gray-800 mb-2 border-b pb-1">
                <User size={16} className="mr-1" /> Passenger Information
              </h3>
              {passengerData.map((passenger, idx) => (
                <table key={idx} className="w-full text-xs mb-3">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 text-gray-600">Name</td>
                      <td className="py-1 font-semibold">{passenger.name}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 text-gray-600">Gender</td>
                      <td className="py-1 font-semibold">{capitalize(passenger.gender)}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 text-gray-600">Age</td>
                      <td className="py-1 font-semibold">{passenger.age} Years</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 text-gray-600">Contact</td>
                      <td className="py-1 font-semibold">{contactDetails?.phone || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 text-gray-600">Email</td>
                      <td className="py-1 font-semibold">{contactDetails?.email || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-600">ID Proof</td>
                      <td className="py-1 font-semibold">{passenger.idType} - ****{passenger.idNumber.slice(-4)}</td>
                    </tr>
                  </tbody>
                </table>
              ))}
            </div>

            {/* Seat Details */}
            <div>
              <h3 className="flex items-center text-sm font-semibold text-gray-800 mb-2 border-b pb-1">
                <Package size={16} className="mr-1" /> Seat & Berth Details
              </h3>
              {passengerData.map((passenger, idx) => (
                <table key={idx} className="w-full text-xs mb-2">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 text-gray-600">Seat Number</td>
                      <td className="py-1 font-bold">{passenger.seatName}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 text-gray-600">Berth Type</td>
                      <td className="py-1 font-semibold">{getBerthType(passenger.seatId)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-600">Category</td>
                      <td className="py-1 font-semibold">Window Seat</td>
                    </tr>
                  </tbody>
                </table>
              ))}
            </div>
          </div>

          {/* Right Side */}
          <div className="p-4">
            {/* Route Details */}
            <div className="mb-4">
              <h3 className="flex items-center text-sm font-semibold text-gray-800 mb-2 border-b pb-1">
                <MapPin size={16} className="mr-1" /> Route & Journey Details
              </h3>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-600">FROM</td>
                    <td className="py-1 font-semibold">
                      {busData?.from || ticketData.selectedBoardingPoint?.name}
                      <br />
                      <span className="text-xs text-gray-500">{ticketData.selectedBoardingPoint?.address || 'N/A'}</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-600">TO</td>
                    <td className="py-1 font-semibold">
                      {busData?.to || ticketData.selectedDroppingPoint?.name}
                      <br />
                      <span className="text-xs text-gray-500">{ticketData.selectedDroppingPoint?.address || 'N/A'}</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-600">Departure</td>
                    <td className="py-1 font-semibold">{formatDate(busData?.date)} {formatTime(ticketData.selectedBoardingPoint?.time)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-600">Arrival</td>
                    <td className="py-1 font-semibold">{formatDate(busData?.arrivalDate || busData?.date)} {formatTime(ticketData.selectedDroppingPoint?.time)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-600">Duration</td>
                    <td className="py-1 font-semibold">{calculateDuration(ticketData.selectedBoardingPoint?.time, ticketData.selectedDroppingPoint?.time)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">Reporting Time</td>
                    <td className="py-1 font-semibold text-red-600">{formatTime(new Date(`2000-01-01 ${ticketData.selectedBoardingPoint?.time}`).getTime() - 30 * 60000)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bus Information */}
            <div className="mb-4">
              <h3 className="flex items-center text-sm font-semibold text-gray-800 mb-2 border-b pb-1">
                <Bus size={16} className="mr-1" /> Bus Information
              </h3>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-600">Operator</td>
                    <td className="py-1 font-semibold">{busData?.operatorName || 'Premium Bus Travel'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-600">Bus Number</td>
                    <td className="py-1 font-semibold">{busData?.busNumber || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-600">Bus Type</td>
                    <td className="py-1 font-semibold">{busData?.busType || 'AC Sleeper (2+1)'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">Layout</td>
                    <td className="py-1 font-semibold">{busData?.busType?.includes('Sleeper') ? '2x1 Sleeper' : '2x2'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pricing */}
            <div className="mb-4">
              <h3 className="flex items-center text-sm font-semibold text-gray-800 mb-2 border-b pb-1">
                <CreditCard size={16} className="mr-1" /> Pricing & Payment
              </h3>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-600">Base Fare</td>
                    <td className="py-1 font-semibold">₹{ticketData.fareBreakdown?.baseFare.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-600">GST (5%)</td>
                    <td className="py-1 font-semibold">₹{ticketData.fareBreakdown?.taxes.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-1 text-gray-600">Fees</td>
                    <td className="py-1 font-semibold">₹{ticketData.fareBreakdown?.fees.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b-2 border-gray-800">
                    <td className="py-1 font-bold">Total Amount</td>
                    <td className="py-1 text-lg font-semibold">₹{totalAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">Payment Mode</td>
                    <td className="py-1 font-semibold">{paymentDetails?.method?.toUpperCase() || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* QR Code */}
            <div className="text-center">
              <div className="bg-white p-2 rounded border-2 border-dashed border-gray-400 inline-block">
                <QRCodeCanvas
                  value={JSON.stringify({ bookingId, transactionId })}
                  size={128}
                  level="H"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">Scan or show this QR code to the conductor</p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg" style={{ minHeight: '40%' }}>
        <h3 className="flex items-center text-sm font-semibold text-gray-800 mb-2">
          <Gavel size={16} className="mr-1" /> Terms & Conditions
        </h3>
        <div className="text-xs font-sm text-gray-600 space-y-2">
          <p>1. This ticket is non-transferable and valid only for the specified passenger(s).</p>
          <p>2. Passengers must report at the boarding point at least 30 minutes prior to departure.</p>
          <p>3. Carry a valid government-issued photo ID for verification.</p>
          <p>4. Cancellation policies apply as per the operator’s terms. Check the website for details.</p>
          <p>5. The operator reserves the right to change the bus type or schedule due to unforeseen circumstances.</p>
          <p>6. Personal belongings are the responsibility of the passenger. The company is not liable for loss or damage.</p>
          <p>7. No smoking or alcohol consumption allowed on board.</p>
          <p>8. For assistance, contact our support team at +91-123-456-7890 or email support@travelexpress.com.</p>
        </div>
      </div>
    </div>
  );
};

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : 'N/A';

export default BusTicket;