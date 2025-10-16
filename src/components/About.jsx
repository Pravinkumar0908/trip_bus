import React from 'react';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15 },
  }),
};

const About = () => {
  return (
<div className="bg-white text-black  w-full p-12 font-sans">

      <motion.h1
        className="text-4xl md:text-5xl font-extrabold mb-2 text-center"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        custom={0}
      >
        Online Bus Ticket Booking on EasyTrip
      </motion.h1>

      {/* Introductory paragraph */}
      <motion.p
        className="mb-8 text-lg leading-relaxed"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        custom={1}
      >
        EasyTrip is India’s most trusted bus ticket booking platform. The platform offers an easy-to-use online bus booking service with over 56+ million satisfied customers.
        Partnering with over 5200+ bus operators, EasyTrip offers affordable prices and various bus types to choose from. Also, provides secure payment options and exclusive offers for a smooth and convenient booking experience.
      </motion.p>

      {/* Section: Operators */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} custom={2} className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Planning a trip with government or private operators?</h2>
        <p className="leading-relaxed mb-2">
          Whether it is RTC or Government bus operators like APSRTC, TGSRTC, KSRTC (Kerala), RSRTC, or private operators like VRL and Orange Travels, EasyTrip offers easy access to lakhs of routes and a wide range of bus types such as AC, Non-AC, Sleeper, Seater, Volvo, and more.
        </p>
        <p className="leading-relaxed">
          With a wide range of bus options and services, EasyTrip ensures a reliable and comfortable journey for every passenger.
        </p>
      </motion.div>

      {/* Section: How to Book */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} custom={3} className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">How to Book Bus Tickets on EasyTrip?</h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-800">
          <li><strong>Enter Travel Details:</strong> Enter your source, destination & travel date to check the top-rated bus services available.</li>
          <li><strong>Search Buses:</strong> Filter bus type, duration, timings, boarding and dropping points, seat availability, user ratings & amenities.</li>
          <li><strong>Choose Buses:</strong> Select your preferred seat, boarding, and dropping points; then check ticket price and proceed to pay.</li>
          <li><strong>Enter Passenger Details:</strong> Fill passenger information and contact details.</li>
          <li><strong>Payment:</strong> Complete secure payment through trusted gateways.</li>
          <li><strong>Ticket Confirmation:</strong> Get your ticket confirmation via email or SMS instantly.</li>
        </ol>
      </motion.div>

      {/* Section: Reasons to Book */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} custom={4} className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Reasons to Book Bus Tickets on EasyTrip</h2>
        <ul className="list-disc list-inside space-y-3 text-gray-800">
          <li><strong>Free Cancellation:</strong> Cancel tickets without charges up to 6 hours before departure, with full refund.</li>
          <li><strong>Change Travel Date:</strong> Select Flexi tickets for date changes; get 50% refund on cancellations 12 hours before journey.</li>
          <li><strong>Booking for Women:</strong> Exclusive deals, priority helplines, and bus preferences for women travellers.</li>
          <li><strong>Assurance Program:</strong> Protection against ticket cancellations by operators, with wallet compensation.</li>
          <li><strong>Earn Rewards:</strong> Refer friends & earn ₹100 after their trip completion.</li>
          <li><strong>Primo Services:</strong> Top-rated operators offering timely and premium services.</li>
          <li><strong>24/7 Customer Support:</strong> Assistance anytime for your booking needs.</li>
          <li><strong>Instant Refund:</strong> Quicker refunds for cancellations or booking issues.</li>
          <li><strong>Live Bus Tracking:</strong> Track your bus live for better journey planning.</li>
        </ul>
      </motion.div>

      {/* Section: Deals */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} custom={5} className="mb-20">
        <h2 className="text-2xl font-semibold mb-4">Bus Booking Deals on EasyTrip</h2>
        <p className="mb-4">
          Don't miss out on these incredible offers. Book your bus tickets now and travel with convenience and affordability.
          Hurry, grab the best bus booking deals before they're gone!
        </p>
        <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-3xl font-extrabold">20% OFF</h3>
            <p className="opacity-90">6447 Deals · 2529 Bus Operators · 966002 Routes</p>
          </div>
          <button className="bg-white text-indigo-700 font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-indigo-100 transition">
            Book Now
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default About;
