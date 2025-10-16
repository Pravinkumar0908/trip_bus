import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: 'Can I track the location of my booked bus online?',
    answer:
      'Yes, EasyTrip provides live bus tracking so you can monitor your bus location in real-time via the app or website.',
  },
  {
    question: 'What are the advantages of purchasing a bus ticket with EasyTrip?',
    answer:
      'EasyTrip offers secure payments, exclusive deals, wide operator coverage, flexible cancellation, and 24/7 customer support among others.',
  },
  {
    question: 'Why book bus tickets online on EasyTrip?',
    answer:
      'Booking online via EasyTrip saves time, offers convenience, multiple payment options, instant confirmation, and various discounts.',
  },
  {
    question: 'Do I need to create an account on EasyTrip to book my bus ticket?',
    answer:
      'You can book as a guest, but creating an account allows easier management of bookings, faster checkout, and reward points.',
  },
  {
    question: 'Does bus booking online cost me more?',
    answer:
      'No, EasyTrip offers competitive pricing and lets you compare multiple operators and deals to find the best fares.',
  },
  {
    question: 'How can I get discounts on the bus booking?',
    answer:
      'Apply promo codes, use EasyTrip wallet credits, refer friends, and check the latest redDeals for discounts.',
  },
  {
    question: 'What\'s New in Bus Booking on EasyTrip?',
    answer:
      'We regularly update with features such as live tracking, Flexi tickets, women\'s safety features, and more convenient payment options.',
  },
  {
    question: 'Can I book a Government bus ticket on EasyTrip?',
    answer:
      'Yes, EasyTrip supports booking tickets on many government operators like APSRTC, TGSRTC, KSRTC, RSRTC, and others.',
  },
];

const FaqItem = ({ faq, index, isOpen, toggleOpen }) => (
  <div className="border-b border-gray-300 py-4 cursor-pointer" onClick={() => toggleOpen(index)} aria-expanded={isOpen}>
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">{faq.question}</h3>
      <motion.span
        animate={{ rotate: isOpen ? 45 : 0 }}
        className="text-2xl font-bold select-none"
        aria-hidden="true"
      >
        +
      </motion.span>
    </div>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial="collapsed"
          animate="open"
          exit="collapsed"
          variants={{
            open: { opacity: 1, height: 'auto', marginTop: 8 },
            collapsed: { opacity: 0, height: 0, marginTop: 0 },
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden text-gray-700 prose max-w-none"
        >
          <p>{faq.answer}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const Faq = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleOpen = (index) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
<div className="bg-white text-black min-h-screen w-full p-12 font-sans">

      <h2 className="text-4xl font-extrabold mb-8 text-center text-indigo-700">
        Frequently Asked Questions
      </h2>

      <div>
        {faqs.map((faq, index) => (
          <FaqItem
            key={index}
            faq={faq}
            index={index}
            isOpen={openIndex === index}
            toggleOpen={toggleOpen}
          />
        ))}
      </div>
    </div>
  );
};

export default Faq;
