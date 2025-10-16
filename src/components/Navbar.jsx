import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import {
  FaBus,
  FaTicketAlt,
  FaRoute,
  FaGift,
  FaHeadset,
  FaUser,
  FaSignInAlt,
  FaUserPlus,
  FaBell,
  FaSearch,
  FaMapMarkerAlt,
  FaCreditCard,
  FaHistory,
  FaCog,
  FaWallet,
  FaHeart,
  FaQuestionCircle,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const Navbar = () => {
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Firebase Auth State Detection
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Scroll effect for background change
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside (केवल desktop के लिए)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Mobile menu खुली हो तो इस logic को skip करें
      if (mobileMenuOpen) return;
      
      if (
        !event.target.closest(".dropdown-container") &&
        !event.target.closest(".user-dropdown")
      ) {
        setActiveDropdown(null);
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [mobileMenuOpen]);

  // Toggle dropdown menu
  const toggleDropdown = (index) => {
    setActiveDropdown(activeDropdown === index ? null : index);
    // User dropdown को बंद करें जब कोई और dropdown खोलें
    if (userDropdownOpen && activeDropdown !== index) {
      setUserDropdownOpen(false);
    }
  };

  // Toggle user dropdown
  const toggleUserDropdown = () => {
    setUserDropdownOpen((prev) => !prev);
    // Other dropdowns को बंद करें
    if (activeDropdown !== null) {
      setActiveDropdown(null);
    }
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
    // Mobile menu बंद करते समय सभी dropdowns बंद करें
    if (mobileMenuOpen) {
      setActiveDropdown(null);
      setUserDropdownOpen(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveDropdown(null);
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const menuItems = [
    {
      title: "Bus Tickets",
      icon: <FaBus />,
      dropdown: [
        { name: "My Bookings", icon: <FaHistory />, path: "/mybookings" },
      ],
    },
    {
      title: "Routes",
      icon: <FaRoute />,
      dropdown: [
        { name: "Route Map", icon: <FaMapMarkerAlt />, path: "/routemap" },
        { name: "Time Table", icon: <FaSearch />, path: "/bus-time-table" },
      ],
    },
    {
      title: "Offers",
      icon: <FaGift />,
      dropdown: [
        { name: "Current Offers", icon: <FaGift />, path: "/coupencode" },
        { name: "Referral Program", icon: <FaUser />, path: "/referral" },
      ],
    },
    {
      title: "Help",
      icon: <FaHeadset />,
      dropdown: [
        { name: "Customer Support", icon: <FaHeadset />, path: "/support" },
      ],
    },
  ];

  const userDropdownItems = [
    { name: "My Profile", icon: <FaUser />, path: "/profile" },
    { name: "My Bookings", icon: <FaHistory />, path: "/mybookings" },
    { name: "My Wallet", icon: <FaWallet />, path: "/mywallet" },
    { name: "My Travel Pass", icon: <FaWallet />, path: "/mytravelpass" },
    { name: "Saved Routes", icon: <FaHeart />, path: "/saved-routes" },
    { name: "Help & Support", icon: <FaHeadset />, path: "/support" },
  ];

  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-lg px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="animate-pulse flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-xl"></div>
            <div className="w-24 h-6 bg-gray-300 rounded"></div>
          </div>
          <div className="animate-pulse flex items-center space-x-4">
            <div className="w-20 h-8 bg-gray-300 rounded-xl"></div>
            <div className="w-20 h-8 bg-gray-300 rounded-xl"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          isScrolled
            ? "bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-200"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-3 group font-bold text-red-600"
            >
              <div className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-xl">
                <FaBus className="text-white text-xl" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent transition-all duration-300 group-hover:from-red-700 group-hover:to-red-800">
                  EasyTrip
                </h1>
                <span className="text-xs text-gray-500 -mt-1">
                  India's #1 Bus Booking
                </span>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-1">
              {menuItems.map((item, index) => (
                <div key={index} className="dropdown-container relative">
                  <button
                    onClick={() => toggleDropdown(index)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 font-medium text-sm transform hover:scale-105 ${
                      activeDropdown === index
                        ? "bg-red-50 text-red-600 shadow-md"
                        : ""
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.title}</span>
                    <span
                      className={`text-xs transition-transform duration-200 ${
                        activeDropdown === index ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {/* Desktop Dropdown Menu */}
                  {activeDropdown === index && (
                    <div
                      className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 animate-fade-in-down"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-l border-t border-gray-100 transform rotate-45"></div>
                      {item.dropdown.map((dropdownItem, dropIndex) => (
                        <Link
                          key={dropIndex}
                          to={dropdownItem.path}
                          className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm font-medium"
                          onClick={() => setActiveDropdown(null)}
                        >
                          <span className="text-gray-400 text-sm">
                            {dropdownItem.icon}
                          </span>
                          <span>{dropdownItem.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Auth Section Desktop */}
            <div className="hidden lg:flex items-center space-x-3">
              {user ? (
                <>
                  {/* Notification Bell */}
                  <button
                    onClick={() => navigate("/notifications")}
                    className="relative p-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                    aria-label="Go to Notifications"
                  >
                    <FaBell className="text-lg" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  </button>

                  {/* User Profile Dropdown */}
                  <div className="dropdown-container relative user-dropdown">
                    <button
                      onClick={toggleUserDropdown}
                      className="flex items-center space-x-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium transform hover:scale-105 shadow-lg"
                      type="button"
                    >
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="Profile"
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <FaUser className="text-sm" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold">
                          {user.displayName || "User"}
                        </div>
                        <div className="text-xs opacity-80">My Account</div>
                      </div>
                      <span
                        className={`text-xs transition-transform duration-200 ${
                          userDropdownOpen ? "rotate-180" : ""
                        }`}
                      >
                        ▼
                      </span>
                    </button>

                    {/* User Dropdown Menu */}
                    {userDropdownOpen && (
                      <div
                        className="absolute top-full right-0 mt-2 w-84 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 animate-fade-in-down"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-l border-t border-gray-100 transform rotate-45"></div>

                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                              {user.photoURL ? (
                                <img
                                  src={user.photoURL}
                                  alt="Profile"
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <FaUser className="text-white text-lg" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {user.displayName || "User"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          {userDropdownItems.map((item, index) => (
                            <Link
                              key={index}
                              to={item.path}
                              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-sm font-medium"
                              onClick={() => setUserDropdownOpen(false)}
                            >
                              <span className="text-gray-400 text-sm w-4">
                                {item.icon}
                              </span>
                              <span>{item.name}</span>
                            </Link>
                          ))}

                          {/* Divider */}
                          <div className="border-t border-gray-100 my-2"></div>

                          {/* Logout Button */}
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 text-sm font-medium"
                          >
                            <FaSignInAlt className="text-red-500 text-sm w-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="flex items-center space-x-2 text-gray-700 hover:text-red-600 px-4 py-2 rounded-xl hover:bg-red-50 transition-all duration-200 font-medium"
                  >
                    <FaSignInAlt className="text-sm" />
                    <span>Login</span>
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium transform hover:scale-105 shadow-lg"
                  >
                    <FaUserPlus className="text-sm" />
                    <span>Sign Up</span>
                  </button>

                  <button
                    className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                    aria-label="Notifications disabled while logged out"
                    disabled
                  >
                    <FaBell className="text-lg" />
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-red-50 transition duration-200 z-10 relative"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - पूरी तरह से redesigned */}
        <div
          className={`lg:hidden fixed inset-x-0 top-16 bg-white border-t border-gray-200 shadow-xl transform transition-all duration-300 ease-in-out ${
            mobileMenuOpen
              ? "translate-y-0 opacity-100 visible"
              : "-translate-y-full opacity-0 invisible"
          }`}
          style={{ maxHeight: "calc(100vh - 4rem)" }}
        >
          <div className="overflow-y-auto max-h-full">
            <div className="px-4 py-4 space-y-2">
              {/* Menu Items */}
              {menuItems.map((item, idx) => (
                <div key={idx} className="border-b border-gray-100 last:border-b-0">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleDropdown(idx);
                    }}
                    className="flex items-center justify-between w-full px-4 py-3 text-left font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <span className="flex items-center space-x-3">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.title}</span>
                    </span>
                    <span
                      className={`text-xs transform transition-transform duration-200 ${
                        activeDropdown === idx ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {/* Mobile Dropdown Content */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      activeDropdown === idx
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="pl-8 pr-4 pb-2 space-y-1">
                      {item.dropdown.map((subItem, i) => (
                        <Link
                          key={i}
                          to={subItem.path}
                          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 text-sm font-medium transition-all duration-200"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setActiveDropdown(null);
                          }}
                        >
                          <span className="text-gray-400">{subItem.icon}</span>
                          <span>{subItem.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* User Section */}
              {user ? (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="Profile"
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <FaUser className="text-white text-lg" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {user.displayName || "User"}
                      </div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </div>

                  {/* Notifications */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/notifications");
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all duration-200"
                  >
                    <FaBell />
                    <span>Notifications</span>
                    <div className="ml-auto w-2 h-2 bg-red-500 rounded-full"></div>
                  </button>

                  {/* User Menu Items */}
                  <div className="space-y-1 mt-2">
                    {userDropdownItems.map((item, i) => (
                      <Link
                        key={i}
                        to={item.path}
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-all duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    ))}

                    {/* Logout Button */}
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium transition-all duration-200"
                    >
                      <FaSignInAlt />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
                  <button
                    onClick={() => {
                      navigate("/login");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium"
                  >
                    <FaSignInAlt />
                    <span>Login</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate("/login");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 font-medium"
                  >
                    <FaUserPlus />
                    <span>Sign Up</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Animations Styles */}
      <style jsx>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out;
        }

        /* Scrollbar styling for mobile menu */
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #ef4444;
          border-radius: 2px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #dc2626;
        }
      `}</style>
    </>
  );
};

export default Navbar;
