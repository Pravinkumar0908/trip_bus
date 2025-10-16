import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import Navbar from '../components/Navbar';
import {
  FaBus,
  FaUsers,
  FaStar,
  FaMapMarkedAlt,
  FaClock,
  FaShieldAlt,
  FaHeadset,
  FaMobileAlt,
  FaCreditCard,
  FaGlobe,
  FaCode,
  FaLaptopCode,
  FaGraduationCap,
  FaHeart,
  FaLightbulb,
  FaRocket,
  FaTrophy,
  FaChevronDown,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaPlay,
  FaDownload,
  FaCheckCircle,
  FaQuoteLeft,
  FaArrowUp,
  FaSpinner,
  FaPaperPlane,
  FaEye,
  FaIndustry,
  FaBullseye,
  FaSearch,
  FaLock,
  FaWifi,
  FaSnowflake,
  FaCoffee,
  FaTv,
  FaPowerOff,
  FaBolt,
  FaLeaf} from 'react-icons/fa';

// Enhanced Counter Animation Component with proper responsive fixes
const CounterAnimation = ({ target, duration = 3, prefix = "", suffix = "" }) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { 
    threshold: 0.1,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView && !hasStarted && target > 0) {
      setHasStarted(true);
      let startTime = null;
      let animationFrame;

      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        
        const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentCount = Math.floor(easeOutExpo * target);
        
        setCount(currentCount);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          setCount(target);
        }
      };

      animationFrame = requestAnimationFrame(animate);
      
      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }
  }, [inView, target, duration, hasStarted]);

  return (
    <div ref={ref} className="w-full">
      <span className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-red-600 block leading-tight">
        {prefix}{count.toLocaleString('en-IN')}{suffix}
      </span>
    </div>
  );
};

// Enhanced Animated Section
const AnimatedSection = ({ children, className = "" }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { threshold: 0.1 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={{
        visible: { 
          opacity: 1, 
          y: 0, 
          transition: { 
            duration: 0.8,
            staggerChildren: 0.1
          } 
        },
        hidden: { opacity: 0, y: 60 }
      }}
      className={`${className} overflow-hidden`}
    >
      {children}
    </motion.div>
  );
};

// Floating Animation Component
const FloatingElement = ({ children, duration = 3, delay = 0 }) => {
  return (
    <motion.div
      animate={{ y: [-10, 10, -10] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
};

const AboutUs = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-change testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert('Message sent successfully! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Data for various sections with proper validation
  const stats = [
    { label: "Happy Customers", value: 250000, prefix: "25000", suffix: "+" },
    { label: "Cities Connected", value: 500, prefix: "50", suffix: "+" },
    { label: "Daily Bookings", value: 2500, prefix: "250", suffix: "+" },
    { label: "Years of Excellence", value: 8, prefix: "1", suffix: "+" }
  ];

  const features = [
    {
      icon: <FaSearch className="text-2xl md:text-3xl text-red-500" />,
      title: "Smart Search",
      description: "Advanced AI-powered search algorithm to find the best routes and timings for your journey."
    },
    {
      icon: <FaShieldAlt className="text-2xl md:text-3xl text-red-500" />,
      title: "Secure Booking",
      description: "256-bit SSL encryption ensures your personal and payment information is completely secure."
    },
    {
      icon: <FaMobileAlt className="text-2xl md:text-3xl text-red-500" />,
      title: "Mobile First",
      description: "Responsive design optimized for all devices with native mobile app experience."
    },
    {
      icon: <FaHeadset className="text-2xl md:text-3xl text-red-500" />,
      title: "24/7 Support",
      description: "Round-the-clock customer support with multilingual assistance and instant chat."
    },
    {
      icon: <FaCreditCard className="text-2xl md:text-3xl text-red-500" />,
      title: "Multiple Payment Options",
      description: "Support for UPI, Cards, Net Banking, Wallets with instant refund facility."
    },
    {
      icon: <FaClock className="text-2xl md:text-3xl text-red-500" />,
      title: "Real-time Tracking",
      description: "Live bus tracking with accurate arrival times and instant notifications."
    }
  ];

  const testimonials = [
    {
      name: "Rahul Sharma",
      location: "Mumbai, Maharashtra",
      rating: 5,
      text: "EasyTrip has revolutionized my travel experience. The booking process is incredibly smooth and the bus quality is always top-notch. Highly recommended!",
      avatar: "👨‍💼",
      date: "2 weeks ago",
      verified: true
    },
    {
      name: "Priya Singh",
      location: "Delhi, NCR",
      rating: 5,
      text: "Amazing customer service! When my bus got cancelled due to weather, they immediately arranged an alternative and even upgraded my seat. Excellent service!",
      avatar: "👩‍🎓",
      date: "1 month ago",
      verified: true
    },
    {
      name: "Amit Patel",
      location: "Ahmedabad, Gujarat",
      rating: 5,
      text: "The mobile app is fantastic! Real-time tracking helped me plan my pickup perfectly. Clean buses, punctual service - couldn't ask for more.",
      avatar: "👨‍⚕️",
      date: "3 weeks ago",
      verified: true
    },
    {
      name: "Sneha Reddy",
      location: "Bangalore, Karnataka",
      rating: 5,
      text: "As a frequent traveler, I've tried many platforms. EasyTrip stands out with its reliability, transparency in pricing, and excellent bus partners.",
      avatar: "👩‍💻",
      date: "1 week ago",
      verified: true
    }
  ];

  const busAmenities = [
    { icon: <FaWifi />, name: "Free WiFi", description: "High-speed internet connectivity throughout your journey" },
    { icon: <FaSnowflake />, name: "AC Climate", description: "Comfortable temperature-controlled environment" },
    { icon: <FaCoffee />, name: "Refreshments", description: "Complimentary snacks and beverages on long routes" },
    { icon: <FaTv />, name: "Entertainment", description: "Individual screens with movies, music, and games" },
    { icon: <FaPowerOff />, name: "Charging Points", description: "USB and power outlets at every seat" },
    { icon: <FaBolt />, name: "Emergency Features", description: "GPS tracking, panic buttons, and first aid kit" },
    { icon: <FaLeaf />, name: "Eco-Friendly", description: "CNG and electric buses for sustainable travel" },
    { icon: <FaLock />, name: "Safety First", description: "CCTV surveillance and verified drivers" }
  ];

  const timeline = [
    {
      year: "2017",
      title: "The Beginning",
      description: "Parade Kumar founded EasyTrip with a vision to revolutionize bus travel in India",
      icon: <FaRocket />
    },
    {
      year: "2018",
      title: "First 10 Cities",
      description: "Expanded to connect 10 major cities with premium bus services",
      icon: <FaMapMarkedAlt />
    },
    {
      year: "2019",
      title: "Mobile App Launch",
      description: "Launched user-friendly mobile application with real-time tracking",
      icon: <FaMobileAlt />
    },
    {
      year: "2020",
      title: "Safety First Initiative",
      description: "Introduced comprehensive safety measures during pandemic",
      icon: <FaShieldAlt />
    },
    {
      year: "2021",
      title: "AI Integration",
      description: "Implemented AI-powered route optimization and smart recommendations",
      icon: <FaBolt />
    },
    {
      year: "2022",
      title: "100K+ Users",
      description: "Reached milestone of 100,000+ satisfied customers",
      icon: <FaUsers />
    },
    {
      year: "2023",
      title: "Pan-India Expansion",
      description: "Extended services to 500+ cities across India",
      icon: <FaIndustry />
    },
    {
      year: "2024",
      title: "Awards & Recognition",
      description: "Won multiple industry awards for innovation and customer service",
      icon: <FaTrophy />
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center px-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <motion.h2
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-lg sm:text-2xl font-bold text-red-800"
          >
            Loading EasyTrip Story...
          </motion.h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Fixed Navbar with proper z-index */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg">
        <Navbar />
      </div>
      
      {/* Hero Section with proper padding from navbar */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-red-800 pt-16 md:pt-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-full animate-pulse" />
          <div className="absolute top-32 right-20 w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 left-32 w-20 h-20 md:w-24 md:h-24 bg-white/10 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-32 right-10 w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="container mx-auto px-4 text-center text-white relative z-10 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
          >
            <FloatingElement>
              <div className="mb-6 md:mb-8">
                <FaBus className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl mx-auto mb-4 md:mb-6 text-white/90" />
              </div>
            </FloatingElement>
            
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 md:mb-6 leading-tight px-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              About <span className="text-yellow-300">EasyTrip</span>
            </motion.h1>
            
            <motion.p 
              className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-red-100 max-w-4xl mx-auto leading-relaxed px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
            >
              Revolutionizing bus travel across India with technology, comfort, and reliability.
              Your journey begins with us.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4 max-w-md sm:max-w-none mx-auto"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <button className="w-full sm:w-auto bg-white text-red-600 px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-sm md:text-lg hover:bg-red-50 transition-all duration-300 transform hover:scale-105 shadow-xl">
                <FaPlay className="inline mr-2 md:mr-3" />
                Watch Our Story
              </button>
              <button className="w-full sm:w-auto border-2 border-white text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-sm md:text-lg hover:bg-white hover:text-red-600 transition-all duration-300 transform hover:scale-105">
                <FaDownload className="inline mr-2 md:mr-3" />
                Download App
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <FaChevronDown className="text-white text-xl md:text-2xl" />
        </motion.div>
      </section>

      {/* Stats Section - FULLY RESPONSIVE */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-gray-50 to-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 md:mb-6 px-2">Our Achievements</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Numbers that showcase our commitment to excellence and customer satisfaction.
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center p-4 sm:p-6 md:p-8 bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                whileHover={{ scale: 1.02 }}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: { duration: 0.6, delay: index * 0.1 }
                  }
                }}
              >
                <div className="mb-3 md:mb-4">
                  <CounterAnimation 
                    target={stat.value} 
                    prefix={stat.prefix} 
                    suffix={stat.suffix}
                    duration={3}
                  />
                </div>
                <p className="text-gray-600 font-semibold text-sm sm:text-base md:text-lg leading-tight px-1">
                  {stat.label}
                </p>
                
                <div className="mt-3 md:mt-4 w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  {index === 0 && <span className="text-red-500 text-lg md:text-xl">👥</span>}
                  {index === 1 && <span className="text-red-500 text-lg md:text-xl">🌆</span>}
                  {index === 2 && <span className="text-red-500 text-lg md:text-xl">🎫</span>}
                  {index === 3 && <span className="text-red-500 text-lg md:text-xl">⭐</span>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Our Story Section - FULLY RESPONSIVE */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 md:mb-6 px-2">Our Story</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              From a small startup to India's leading bus booking platform - this is our journey of innovation, dedication, and customer-first approach.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div 
              className="space-y-4 sm:space-y-6 md:space-y-8 order-2 lg:order-1"
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.8 }}
            >
              <div className="prose prose-sm sm:prose-base lg:prose-lg text-gray-700 leading-relaxed max-w-none">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 mb-3 md:mb-4">The Vision Behind EasyTrip</h3>
                <p className="mb-4 md:mb-6 text-sm sm:text-base">
                  In 2017, I, <strong>Parade Kumar</strong>, a passionate software engineer from Jainagar, Rajasthan, 
                  witnessed the challenges people faced while booking bus tickets. Long queues, unreliable services, 
                  and lack of transparency were common issues that needed a modern solution.
                </p>
                
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 mb-3 md:mb-4">The Innovation Journey</h3>
                <p className="mb-4 md:mb-6 text-sm sm:text-base">
                  With my background in software engineering and a deep understanding of user experience, 
                  I envisioned a platform that would make bus travel as seamless as booking a cab. 
                  The idea was simple yet revolutionary - bring transparency, reliability, and technology 
                  together to create the ultimate bus booking experience.
                </p>

                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 mb-3 md:mb-4">Building the Dream</h3>
                <p className="text-sm sm:text-base">
                  What started as a simple web platform has now evolved into a comprehensive ecosystem 
                  connecting millions of travelers with thousands of bus operators across India. 
                  Our commitment to innovation, customer satisfaction, and technological excellence 
                  has made us the preferred choice for modern travelers.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="space-y-4 md:space-y-6 order-1 lg:order-2"
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative">
                <div className="bg-gradient-to-br from-red-500 to-red-700 p-4 sm:p-6 md:p-8 rounded-xl md:rounded-2xl text-white shadow-2xl">
                  <div className="flex items-center mb-4 md:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                      <FaLightbulb className="text-base sm:text-lg md:text-2xl" />
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg md:text-xl font-bold">Innovation First</h4>
                      <p className="text-red-100 text-xs sm:text-sm md:text-base">Technology-driven solutions</p>
                    </div>
                  </div>
                  <p className="text-red-100 leading-relaxed text-xs sm:text-sm md:text-base">
                    "Every feature we build, every decision we make, is centered around making travel 
                    better for our customers. Innovation isn't just about technology - it's about 
                    understanding and solving real problems."
                  </p>
                </div>
                
                <FloatingElement delay={1}>
                  <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-yellow-400 rounded-full"></div>
                </FloatingElement>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-gray-50 p-3 sm:p-4 md:p-6 rounded-lg md:rounded-xl text-center border hover:shadow-lg transition-all duration-300">
                  <FaCode className="text-xl sm:text-2xl md:text-3xl text-red-500 mx-auto mb-2 md:mb-3" />
                  <h5 className="font-bold text-gray-800 text-xs sm:text-sm md:text-base">Clean Code</h5>
                  <p className="text-xs md:text-sm text-gray-600">Scalable architecture</p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 md:p-6 rounded-lg md:rounded-xl text-center border hover:shadow-lg transition-all duration-300">
                  <FaUsers className="text-xl sm:text-2xl md:text-3xl text-red-500 mx-auto mb-2 md:mb-3" />
                  <h5 className="font-bold text-gray-800 text-xs sm:text-sm md:text-base">User-Centric</h5>
                  <p className="text-xs md:text-sm text-gray-600">Customer first approach</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* Meet the Founder Section - FULLY RESPONSIVE */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-red-50 to-red-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 md:mb-6 px-2">Meet the Founder</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Driven by passion, powered by technology, and committed to excellence.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 md:gap-12 items-center">
            <motion.div 
              className="lg:col-span-1 text-center"
              whileInView={{ opacity: 1, scale: 1 }}
              initial={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative inline-block mb-6 md:mb-8">
                <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 xl:w-64 xl:h-64 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold shadow-2xl mx-auto">
                  PK
                </div>
                <FloatingElement>
                  <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                    <FaCode className="text-sm sm:text-base md:text-lg lg:text-2xl text-gray-800" />
                  </div>
                </FloatingElement>
              </div>

              <div className="space-y-3 md:space-y-4">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Parade Kumar</h3>
                <p className="text-sm sm:text-base md:text-lg text-red-600 font-semibold">Founder & CEO</p>
                <p className="text-gray-600 text-xs sm:text-sm md:text-base">Software Engineer</p>
                <p className="text-gray-600 text-xs sm:text-sm md:text-base">📍 Jainagar, Rajasthan, India</p>
                
                <div className="flex justify-center space-x-3 md:space-x-4 mt-4 md:mt-6">
                  <button className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                    <FaLinkedin className="text-xs sm:text-sm md:text-base" />
                  </button>
                  <button className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors">
                    <FaGithub className="text-xs sm:text-sm md:text-base" />
                  </button>
                  <button className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-400 text-white rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors">
                    <FaTwitter className="text-xs sm:text-sm md:text-base" />
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="lg:col-span-2 space-y-4 sm:space-y-6 md:space-y-8"
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl md:rounded-2xl shadow-xl">
                <blockquote className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed mb-4 md:mb-6 italic">
                  <FaQuoteLeft className="text-red-500 text-xl sm:text-2xl md:text-3xl mb-4" />
                  "My journey as a software engineer has taught me that the best technology is invisible - 
                  it just works seamlessly to make people's lives better. With EasyTrip, we're not just 
                  building a booking platform; we're creating an experience that makes travel joyful, 
                  reliable, and accessible for everyone."
                </blockquote>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg md:rounded-xl shadow-lg">
                  <FaGraduationCap className="text-xl sm:text-2xl md:text-3xl text-red-500 mb-3 md:mb-4" />
                  <h4 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-2">Education</h4>
                  <p className="text-gray-600 text-xs sm:text-sm md:text-base">Computer Science Engineering with specialization in Full-Stack Development and AI/ML</p>
                </div>
                
                <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg md:rounded-xl shadow-lg">
                  <FaLaptopCode className="text-xl sm:text-2xl md:text-3xl text-red-500 mb-3 md:mb-4" />
                  <h4 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-2">Expertise</h4>
                  <p className="text-gray-600 text-xs sm:text-sm md:text-base">React.js, Node.js, Python, Cloud Architecture, Mobile Development, UI/UX Design</p>
                </div>

                <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg md:rounded-xl shadow-lg">
                  <FaHeart className="text-xl sm:text-2xl md:text-3xl text-red-500 mb-3 md:mb-4" />
                  <h4 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-2">Passion</h4>
                  <p className="text-gray-600 text-xs sm:text-sm md:text-base">Building user-centric products that solve real-world problems and create positive impact</p>
                </div>

                <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg md:rounded-xl shadow-lg">
                  <FaTrophy className="text-xl sm:text-2xl md:text-3xl text-red-500 mb-3 md:mb-4" />
                  <h4 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-2">Achievements</h4>
                  <p className="text-gray-600 text-xs sm:text-sm md:text-base">Multiple tech awards, featured in startup magazines, speaker at tech conferences</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* Mission & Vision Section - FULLY RESPONSIVE */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 md:mb-6 px-2">Our Mission & Vision</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Driving the future of travel with purpose, innovation, and unwavering commitment to excellence.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
            <motion.div 
              className="bg-gradient-to-br from-red-500 to-red-700 p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl md:rounded-3xl text-white relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8 sm:-translate-y-10 sm:translate-x-10 md:-translate-y-12 md:translate-x-12 lg:-translate-y-16 lg:translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-white/10 rounded-full translate-y-7 -translate-x-7 sm:translate-y-8 sm:-translate-x-8 md:translate-y-10 md:-translate-x-10 lg:translate-y-12 lg:-translate-x-12"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-4 sm:mb-6 md:mb-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 sm:mr-4 md:mr-6 flex-shrink-0">
                    <FaBullseye className="text-lg sm:text-xl md:text-2xl lg:text-3xl" />
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Our Mission</h3>
                </div>
                
                <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-red-100 mb-4 sm:mb-6 md:mb-8">
                  To revolutionize bus travel in India by providing a seamless, reliable, and technology-driven 
                  platform that connects travelers with the best transportation options, ensuring safe, comfortable, 
                  and affordable journeys for everyone.
                </p>

                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <div className="flex items-center">
                    <FaCheckCircle className="text-yellow-300 mr-2 sm:mr-3 flex-shrink-0 text-sm sm:text-base" />
                    <span className="text-red-100 text-xs sm:text-sm md:text-base">Customer-first approach in everything we do</span>
                  </div>
                  <div className="flex items-center">
                    <FaCheckCircle className="text-yellow-300 mr-2 sm:mr-3 flex-shrink-0 text-sm sm:text-base" />
                    <span className="text-red-100 text-xs sm:text-sm md:text-base">Technology innovation for better travel experience</span>
                  </div>
                  <div className="flex items-center">
                    <FaCheckCircle className="text-yellow-300 mr-2 sm:mr-3 flex-shrink-0 text-sm sm:text-base" />
                    <span className="text-red-100 text-xs sm:text-sm md:text-base">Building trust through transparency and reliability</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl md:rounded-3xl text-white relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute top-0 left-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-40 xl:h-40 bg-red-500/10 rounded-full -translate-y-10 -translate-x-10 sm:-translate-y-12 sm:-translate-x-12 md:-translate-y-14 md:-translate-x-14 lg:-translate-y-16 lg:-translate-x-16 xl:-translate-y-20 xl:-translate-x-20"></div>
              <div className="absolute bottom-0 right-0 w-18 h-18 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-red-500/10 rounded-full translate-y-9 translate-x-9 sm:translate-y-10 sm:translate-x-10 md:translate-y-12 md:translate-x-12 lg:translate-y-14 lg:translate-x-14"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-4 sm:mb-6 md:mb-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-red-500/20 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 sm:mr-4 md:mr-6 flex-shrink-0">
                    <FaEye className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-red-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Our Vision</h3>
                </div>
                
                <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-gray-300 mb-4 sm:mb-6 md:mb-8">
                  To become India's most trusted and innovative travel platform, setting new standards in the 
                  transportation industry while contributing to sustainable tourism and economic growth across 
                  the country.
                </p>

                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <div className="flex items-center">
                    <FaRocket className="text-red-400 mr-2 sm:mr-3 flex-shrink-0 text-sm sm:text-base" />
                    <span className="text-gray-300 text-xs sm:text-sm md:text-base">Leading digital transformation in travel industry</span>
                  </div>
                  <div className="flex items-center">
                    <FaGlobe className="text-red-400 mr-2 sm:mr-3 flex-shrink-0 text-sm sm:text-base" />
                    <span className="text-gray-300 text-xs sm:text-sm md:text-base">Expanding to international markets by 2026</span>
                  </div>
                  <div className="flex items-center">
                    <FaLeaf className="text-red-400 mr-2 sm:mr-3 flex-shrink-0 text-sm sm:text-base" />
                    <span className="text-gray-300 text-xs sm:text-sm md:text-base">Promoting eco-friendly and sustainable travel</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* Features Section - FULLY RESPONSIVE */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 md:mb-6 px-2">Why Choose EasyTrip?</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Experience the difference with our cutting-edge features designed to make your journey perfect.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-4 sm:p-6 md:p-8 rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                whileHover={{ scale: 1.02 }}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="mb-3 sm:mb-4 md:mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-xs sm:text-sm md:text-base">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Timeline Section - FULLY RESPONSIVE */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 md:mb-6 px-2">Our Journey</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              From inception to becoming India's favorite bus booking platform - here's our remarkable journey.
            </p>
          </div>

          {/* Mobile & Tablet Timeline */}
          <div className="lg:hidden space-y-6 md:space-y-8">
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                className="flex items-start space-x-4"
                whileInView={{ opacity: 1, x: 0 }}
                initial={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0">
                  <div className="text-sm sm:text-base">{item.icon}</div>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100 flex-1">
                  <span className="text-red-600 font-bold text-sm sm:text-base md:text-lg">{item.year}</span>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm md:text-base">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop Timeline */}
          <div className="hidden lg:block relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-red-500 to-red-700"></div>
            
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                className={`relative flex items-center mb-12 ${
                  index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                }`}
                whileInView={{ opacity: 1, x: 0 }}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <span className="text-red-600 font-bold text-lg">{item.year}</span>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
                
                <div className="absolute left-1/2 transform -translate-x-1/2 w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg z-10">
                  {item.icon}
                </div>
                
                <div className="w-5/12"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Bus Amenities Section - FULLY RESPONSIVE */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-red-50 to-red-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 md:mb-6 px-2">Premium Bus Amenities</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Travel in comfort with our premium buses equipped with world-class amenities.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {busAmenities.map((amenity, index) => (
              <motion.div
                key={index}
                className="bg-white p-3 sm:p-4 md:p-6 rounded-xl md:rounded-2xl text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                whileHover={{ scale: 1.02 }}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-2xl sm:text-3xl md:text-4xl text-red-500 mb-2 sm:mb-3 md:mb-4">
                  {amenity.icon}
                </div>
                <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-800 mb-1 sm:mb-2 md:mb-3">{amenity.name}</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-tight">{amenity.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Testimonials Section - FULLY RESPONSIVE */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 md:mb-6 px-2">What Our Customers Say</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Don't just take our word for it - hear from thousands of happy travelers who chose EasyTrip.
            </p>
          </div>

          <motion.div 
            className="bg-gradient-to-br from-red-500 to-red-700 p-4 sm:p-6 md:p-8 lg:p-12 rounded-2xl md:rounded-3xl text-white relative overflow-hidden"
            whileInView={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8 }}
          >
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-64 lg:h-64 bg-white/5 rounded-full -translate-y-16 translate-x-16 sm:-translate-y-20 sm:translate-x-20 md:-translate-y-24 md:translate-x-24 lg:-translate-y-32 lg:translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-48 lg:h-48 bg-white/5 rounded-full translate-y-12 -translate-x-12 sm:translate-y-14 sm:-translate-x-14 md:translate-y-18 md:-translate-x-18 lg:translate-y-24 lg:-translate-x-24"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-6 sm:mb-8 md:mb-12">
                <FaQuoteLeft className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white/30 mx-auto mb-4 sm:mb-6 md:mb-8" />
                
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-light leading-relaxed mb-4 sm:mb-6 md:mb-8 text-red-100 px-2">
                    "{testimonials[activeTestimonial].text}"
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
                    <div className="text-2xl sm:text-3xl md:text-4xl">{testimonials[activeTestimonial].avatar}</div>
                    <div className="text-center sm:text-left">
                      <h4 className="text-base sm:text-lg md:text-xl font-bold">{testimonials[activeTestimonial].name}</h4>
                      <p className="text-red-200 text-xs sm:text-sm md:text-base">{testimonials[activeTestimonial].location}</p>
                      <div className="flex items-center justify-center sm:justify-start mt-1 sm:mt-2">
                        {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                          <FaStar key={i} className="text-yellow-300 mr-1 text-xs sm:text-sm" />
                        ))}
                        {testimonials[activeTestimonial].verified && (
                          <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <FaCheckCircle className="mr-1 text-xs" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="flex justify-center space-x-2 sm:space-x-3 md:space-x-4">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                      activeTestimonial === index ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Testimonial Cards - FULLY RESPONSIVE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8 md:mt-12">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white p-3 sm:p-4 md:p-6 rounded-lg md:rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center mb-2 sm:mb-3 md:mb-4">
                  <div className="text-lg sm:text-xl md:text-2xl mr-2 sm:mr-3">{testimonial.avatar}</div>
                  <div>
                    <h5 className="font-bold text-gray-800 text-xs sm:text-sm md:text-base">{testimonial.name}</h5>
                    <div className="flex items-center">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <FaStar key={i} className="text-yellow-400 text-xs" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-xs md:text-sm mb-2 md:mb-3 leading-tight">"{testimonial.text.substring(0, 80)}..."</p>
                <div className="text-xs text-gray-500">{testimonial.date}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Contact Section - FULLY RESPONSIVE */}
      <AnimatedSection className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 px-2">Get In Touch</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Have questions, suggestions, or want to partner with us? We'd love to hear from you!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
            <motion.div
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 md:mb-8 text-red-400">Contact Information</h3>
              
              <div className="space-y-3 sm:space-y-4 md:space-y-6 mb-6 sm:mb-8 md:mb-12">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-500 rounded-full flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                    <FaPhone className="text-xs sm:text-sm md:text-base" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm md:text-base">Phone</h4>
                    <p className="text-gray-300 text-xs sm:text-sm md:text-base">+91 98765 43210</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-500 rounded-full flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                    <FaEnvelope className="text-xs sm:text-sm md:text-base" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm md:text-base">Email</h4>
                    <p className="text-gray-300 text-xs sm:text-sm md:text-base break-all">hello@easytrip.com</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-500 rounded-full flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                    <FaMapMarkerAlt className="text-xs sm:text-sm md:text-base" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm md:text-base">Address</h4>
                    <p className="text-gray-300 text-xs sm:text-sm md:text-base">Jainagar, Rajasthan, India - 302017</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 md:mb-6 text-red-400">Follow Us</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                  {[
                    { icon: FaFacebook, color: 'bg-blue-600' },
                    { icon: FaTwitter, color: 'bg-blue-400' },
                    { icon: FaInstagram, color: 'bg-pink-600' },
                    { icon: FaLinkedin, color: 'bg-blue-700' },
                    { icon: FaYoutube, color: 'bg-red-600' }
                  ].map((social, index) => (
                    <motion.button
                      key={index}
                      className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${social.color} rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <social.icon className="text-xs sm:text-sm md:text-base" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.8 }}
            >
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <div>
                    <label className="block text-gray-300 mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-red-500 focus:outline-none transition-colors text-white text-xs sm:text-sm md:text-base"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-red-500 focus:outline-none transition-colors text-white text-xs sm:text-sm md:text-base"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-red-500 focus:outline-none transition-colors text-white text-xs sm:text-sm md:text-base"
                    placeholder="What is this regarding?"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-red-500 focus:outline-none transition-colors text-white resize-none text-xs sm:text-sm md:text-base"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>
                
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 sm:py-3 md:py-4 rounded-lg font-bold text-sm md:text-base lg:text-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <FaSpinner className="animate-spin mr-2 sm:mr-3" />
                      Sending Message...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <FaPaperPlane className="mr-2 sm:mr-3" />
                      Send Message
                    </span>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* Footer - FULLY RESPONSIVE */}
      <footer className="bg-gray-900 text-white py-6 sm:py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3 sm:mb-4 md:mb-6">
              <FaBus className="text-2xl sm:text-3xl md:text-4xl text-red-500 mr-2 sm:mr-3 md:mr-4" />
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">EasyTrip</h3>
            </div>
            <p className="text-gray-400 mb-3 sm:mb-4 md:mb-6 max-w-2xl mx-auto text-xs sm:text-sm md:text-base px-4">
              Making bus travel in India seamless, reliable, and enjoyable through innovative technology 
              and customer-first approach. Your journey matters to us.
            </p>
            <div className="border-t border-gray-700 pt-3 sm:pt-4 md:pt-6">
              <p className="text-gray-500 text-xs md:text-sm">
                © 2024 EasyTrip. Built with ❤️ by Parade Kumar. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button - FULLY RESPONSIVE */}
      {showScrollTop && (
        <motion.button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg z-50"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaArrowUp className="text-xs sm:text-sm md:text-base" />
        </motion.button>
      )}

      {/* Custom Styles for better responsiveness */}
      <style jsx>{`
        @media (max-width: 640px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }

        @media (max-width: 475px) {
          .container {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }

        /* Prevent horizontal overflow */
        * {
          box-sizing: border-box;
        }

        body, html {
          overflow-x: hidden;
          width: 100%;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 4px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #ef4444, #dc2626);
          border-radius: 2px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #dc2626, #b91c1c);
        }

        /* Smooth animations for all screen sizes */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AboutUs;
