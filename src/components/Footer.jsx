import React from "react";
import { motion } from "framer-motion";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube, FaWhatsapp, FaTelegramPlane, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaRegClock, FaCcVisa, FaCcMastercard, FaApple, FaGooglePlay } from "react-icons/fa";

const footerSections = [
  {
    title: "About EasyTrip",
    content: (
      <p className="mb-2">
        EasyTrip is India's most innovative bus ticket booking platform. Experience reliable, affordable bus travel—anywhere, any time.
      </p>
    ),
  },
  {
    title: "Quick Links",
    links: [
      { name: "About Us", href: "aboutus" },
      { name: "FAQs", href: "#faqs" },
      { name: "Blog", href: "blog" },
      { name: "Offers & Deals", href: "coupencode" },
      { name: "Careers", href: "#" },
      { name: "Contact Us", href: "support" },
    ],
  },
  {
    title: "Bus Categories",
    links: [
      { name: "AC Sleeper", href: "#" },
      { name: "Non-AC Seater", href: "#" },
      { name: "Volvo Buses", href: "#" },
      { name: "RTC Operators", href: "#" },
      { name: "Private Operators", href: "#" },
      { name: "Ladies Special", href: "#" },
    ],
  },
  {
    title: "Customer Support",
    details: [
      { icon: <FaPhoneAlt className="inline-block mr-2"/>, text: "24x7 Helpline: +91-XXXXXXXXXX" },
      { icon: <FaEnvelope className="inline-block mr-2"/>, text: "Email: support@easytrip.com" },
      { icon: <FaRegClock className="inline-block mr-2"/>, text: "Support Hours: 9am - 10pm IST" },
      { icon: <FaMapMarkerAlt className="inline-block mr-2"/>, text: "Sawai Madhopur, Rajasthan, India" },
    ],
  },
  {
    title: "Policies",
    links: [
      { name: "Terms & Conditions", href: "#terms" },
      { name: "Privacy Policy", href: "#privacy" },
      { name: "Cancellation & Refund Policy", href: "#refund" },
      { name: "User Agreement", href: "#agreement" },
    ],
  },
  {
    title: "Download Our App",
    content: (
      <div className="flex gap-3 items-center py-1">
        <a href="#" className="inline-flex items-center border rounded-md p-2 hover:underline"><FaApple className="mr-1"/>App Store</a>
        <a href="#" className="inline-flex items-center border rounded-md p-2 hover:underline"><FaGooglePlay className="mr-1"/>Google Play</a>
      </div>
    ),
  },
];

const footerSocials = [
  { icon: <FaFacebook />, label: "Facebook", href: "#" },
  { icon: <FaTwitter />, label: "Twitter", href: "#" },
  { icon: <FaInstagram />, label: "Instagram", href: "#" },
  { icon: <FaYoutube />, label: "YouTube", href: "#" },
  { icon: <FaLinkedin />, label: "LinkedIn", href: "#" },
  { icon: <FaWhatsapp />, label: "WhatsApp", href: "#" },
  { icon: <FaTelegramPlane />, label: "Telegram", href: "#" }
];

const paymentIcons = [
  <FaCcVisa key="visa"/>,
  <FaCcMastercard key="mc"/>,
  <FaApple key="apple"/>,
  <FaGooglePlay key="gp"/>
];

const footerMotion = {
  initial: { opacity: 0, y: 40 },
  animate: (i = 1) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.13 }
  }),
};

const Footer = () => {
  return (
    <footer className="w-full text-black p-12 font-sans mt-10">
      <div className="flex flex-wrap gap-8 md:gap-6 xl:gap-10 justify-between items-start w-full pb-6 border-b border-gray-200">
        {footerSections.map((sec, i) => (
          <motion.div
            key={sec.title}
            custom={i}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.6 }}
            variants={footerMotion}
            className="flex-1 min-w-[218px] max-w-xs pb-4 select-text"
          >
            <h2 className="font-bold text-lg mb-2">{sec.title}</h2>
            {sec.content && <div className="text-sm">{sec.content}</div>}

            {Array.isArray(sec.links) && (
              <ul className="text-sm flex flex-col gap-1">
                {sec.links.map(link => (
                  <li key={link.name}>
                    <a className="hover:underline transition" href={link.href}>{link.name}</a>
                  </li>
                ))}
              </ul>
            )}

            {Array.isArray(sec.details) && (
              <ul className="text-sm flex flex-col gap-2">
                {sec.details.map((info, idx) => (
                  <li key={idx}>{info.icon} {info.text}</li>
                ))}
              </ul>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
        viewport={{ once: true, amount: 0.6 }}
        className="flex flex-col md:flex-row justify-between items-center py-4 gap-8">
        {/* Socials */}
        <div className="flex items-center gap-6 md:gap-5 text-2xl">
          {footerSocials.map(s => (
            <a href={s.href} aria-label={s.label} className="hover:-translate-y-1 transition-transform duration-150" key={s.label}>
              {s.icon}
            </a>
          ))}
        </div>
        {/* Payment icons */}
        <div className="flex items-center gap-5 text-xl mt-4 md:mt-0">
          {paymentIcons}
        </div>
      </motion.div>

      <div className="w-full text-center mt-8">
        <div className="text-sm mb-1">© {new Date().getFullYear()} <span className="font-bold">EasyTrip</span>. All rights reserved.</div>
        <div className="text-xs text-gray-700 flex flex-wrap gap-6 justify-center">
          <span>Bus Booking | RTC Booking | Bus Operators | Schedule | Offers | Support | Accessibility</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
