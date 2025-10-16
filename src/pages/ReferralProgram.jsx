import React, { useState, useEffect } from 'react';
import { 
  FiUsers, FiGift, FiShare2, FiCopy, FiCheck, 
  FiStar, FiArrowRight, FiTarget, FiAward,
  FiDollarSign, FiUserPlus, FiClock, 
  FiRefreshCw, FiChevronRight} from 'react-icons/fi';
import Navbar from '../components/Navbar';
import { 
  RiWhatsappFill, RiFacebookFill, RiTwitterFill, RiInstagramFill,
  RiTelegramFill, RiLinkedinFill
} from 'react-icons/ri';
import { HiSparkles, HiLightningBolt, HiTrendingUp } from 'react-icons/hi';
import { BiCrown, BiDiamond } from 'react-icons/bi';

const ReferralProgram = () => {
  const [copiedCode, setCopiedCode] = useState('');
  const [referralCode, setReferralCode] = useState('REF2025VIP');
  const [activeTab, setActiveTab] = useState('overview');
  const [animationClass, setAnimationClass] = useState('');
  const [earnings, setEarnings] = useState(2450);
  const [totalReferrals, setTotalReferrals] = useState(12);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Animation on mount
  useEffect(() => {
    setAnimationClass('animate-fadeInUp');
  }, []);

  // Stats with animated counters
  const stats = [
    {
      icon: <FiUsers className="w-8 h-8" />,
      title: "Total Referrals",
      value: totalReferrals,
      subtitle: "Active Friends",
      color: "from-blue-600 to-blue-700",
      bgColor: "bg-blue-50",
      change: "+3 this month"
    },
    {
      icon: <FiDollarSign className="w-8 h-8" />,
      title: "Total Earnings",
      value: `₹${earnings.toLocaleString()}`,
      subtitle: "Cash Rewards",
      color: "from-green-600 to-green-700",
      bgColor: "bg-green-50",
      change: "+₹500 this week"
    },
    {
      icon: <BiCrown className="w-8 h-8" />,
      title: "Current Tier",
      value: "Platinum",
      subtitle: "Elite Status",
      color: "from-purple-600 to-purple-700",
      bgColor: "bg-purple-50",
      change: "Upgraded!"
    },
    {
      icon: <FiGift className="w-8 h-8" />,
      title: "Bonus Rewards",
      value: "₹750",
      subtitle: "Available",
      color: "from-orange-600 to-orange-700",
      bgColor: "bg-orange-50",
      change: "Claim now"
    }
  ];

  // Enhanced reward tiers
  const rewardTiers = [
    {
      id: 1,
      name: "Starter",
      icon: <FiStar className="w-10 h-10" />,
      minReferrals: 1,
      maxReferrals: 3,
      reward: 150,
      bonus: 100,
      color: "from-green-500 to-emerald-600",
      bgGradient: "from-green-50 to-emerald-50",
      features: [
        "₹150 per successful referral",
        "Welcome bonus of ₹100",
        "Basic support access",
        "Monthly newsletters"
      ],
      popular: false
    },
    {
      id: 2,
      name: "Silver",
      icon: <FiAward className="w-10 h-10" />,
      minReferrals: 4,
      maxReferrals: 8,
      reward: 250,
      bonus: 300,
      color: "from-gray-500 to-slate-600",
      bgGradient: "from-gray-50 to-slate-50",
      features: [
        "₹250 per successful referral",
        "Silver tier bonus ₹300",
        "Priority customer support",
        "Exclusive offers & deals"
      ],
      popular: false
    },
    {
      id: 3,
      name: "Gold",
      icon: <BiCrown className="w-10 h-10" />,
      minReferrals: 9,
      maxReferrals: 15,
      reward: 350,
      bonus: 600,
      color: "from-yellow-500 to-amber-600",
      bgGradient: "from-yellow-50 to-amber-50",
      features: [
        "₹350 per successful referral",
        "Gold achievement bonus ₹600",
        "24/7 premium support",
        "VIP customer treatment",
        "Special discounts on bookings"
      ],
      popular: true
    },
    {
      id: 4,
      name: "Platinum",
      icon: <BiDiamond className="w-10 h-10" />,
      minReferrals: 16,
      maxReferrals: null,
      reward: 500,
      bonus: 1000,
      color: "from-purple-600 to-indigo-700",
      bgGradient: "from-purple-50 to-indigo-50",
      features: [
        "₹500 per successful referral",
        "Platinum elite bonus ₹1000",
        "Dedicated account manager",
        "Exclusive events & meetups",
        "Lifetime premium benefits",
        "Early access to new features"
      ],
      popular: false
    }
  ];

  // Social sharing platforms
  const socialPlatforms = [
    {
      name: "WhatsApp",
      icon: <RiWhatsappFill className="w-6 h-6" />,
      color: "bg-green-500 hover:bg-green-600",
      url: "https://wa.me/"
    },
    {
      name: "Facebook",
      icon: <RiFacebookFill className="w-6 h-6" />,
      color: "bg-blue-600 hover:bg-blue-700",
      url: "https://facebook.com/sharer/"
    },
    {
      name: "Twitter",
      icon: <RiTwitterFill className="w-6 h-6" />,
      color: "bg-sky-500 hover:bg-sky-600",
      url: "https://twitter.com/intent/tweet"
    },
    {
      name: "Instagram",
      icon: <RiInstagramFill className="w-6 h-6" />,
      color: "bg-pink-500 hover:bg-pink-600",
      url: "#"
    },
    {
      name: "Telegram",
      icon: <RiTelegramFill className="w-6 h-6" />,
      color: "bg-blue-500 hover:bg-blue-600",
      url: "https://t.me/share"
    },
    {
      name: "LinkedIn",
      icon: <RiLinkedinFill className="w-6 h-6" />,
      color: "bg-indigo-600 hover:bg-indigo-700",
      url: "https://linkedin.com/sharing"
    }
  ];

  // Recent referrals data
  const recentReferrals = [
    {
      id: 1,
      name: "Rajesh Kumar",
      avatar: "RK",
      joinDate: "2 hours ago",
      reward: 350,
      status: "completed",
      level: "Gold"
    },
    {
      id: 2,
      name: "Priya Sharma",
      avatar: "PS",
      joinDate: "1 day ago",
      reward: 350,
      status: "pending",
      level: "Gold"
    },
    {
      id: 3,
      name: "Amit Singh",
      avatar: "AS",
      joinDate: "3 days ago",
      reward: 350,
      status: "completed",
      level: "Gold"
    },
    {
      id: 4,
      name: "Neha Gupta",
      avatar: "NG",
      joinDate: "5 days ago",
      reward: 350,
      status: "completed",
      level: "Gold"
    }
  ];

  // Copy referral code function
  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(referralCode);
      setTimeout(() => setCopiedCode(''), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Generate new referral code
  const generateNewCode = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newCode = 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase();
      setReferralCode(newCode);
      setIsLoading(false);
    }, 1000);
  };

  // Share functionality
  const handleShare = (platform) => {
    const shareText = `Join me on BusBooking App and get ₹100 OFF on your first ride! Use my referral code: ${referralCode} and start saving today! 🚌✨`;
    
    if (platform.name === "WhatsApp") {
      window.open(`${platform.url}?text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform.name === "Facebook") {
      window.open(`${platform.url}sharer.php?u=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform.name === "Twitter") {
      window.open(`${platform.url}?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Animated Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white opacity-5 rounded-full translate-x-1/2 translate-y-1/2 animate-pulse"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center text-white">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white bg-opacity-20 rounded-full mb-8 animate-bounce">
              <FiUsers className="w-12 h-12" />
            </div>
            <h1 className="text-6xl font-bold mb-6 animate-fadeInUp">
              Referral Program
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto mb-8 animate-fadeInUp animation-delay-200">
              Invite friends, earn rewards, and unlock exclusive benefits. Get up to ₹500 for every successful referral!
            </p>
            <div className="flex items-center justify-center gap-4 animate-fadeInUp animation-delay-400">
              <HiSparkles className="w-6 h-6 animate-spin" />
              <span className="text-lg font-medium">Start earning today!</span>
              <HiSparkles className="w-6 h-6 animate-spin" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Animated Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`group relative ${stat.bgColor} rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fadeInUp`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                <div className="text-6xl">
                  {React.cloneElement(stat.icon, { className: 'w-16 h-16' })}
                </div>
              </div>
              
              <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${stat.color} rounded-2xl text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              
              <h3 className="text-3xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                {stat.value}
              </h3>
              <p className="text-gray-600 font-semibold mb-1">{stat.title}</p>
              <p className="text-sm text-gray-500 mb-3">{stat.subtitle}</p>
              <div className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                <HiTrendingUp className="w-3 h-3" />
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Referral Code Section */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Your Personal Referral Code</h2>
            <p className="opacity-90">Share this code and start earning incredible rewards</p>
          </div>
          
          <div className="p-8">
            <div className="max-w-2xl mx-auto">
              {/* Referral Code Display */}
              <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-center mb-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
                <div className="relative">
                  <div className="text-white text-4xl font-mono font-bold tracking-wider mb-6 animate-pulse">
                    {referralCode}
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={copyReferralCode}
                      className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                        copiedCode === referralCode
                          ? 'bg-green-500 text-white shadow-green-200'
                          : 'bg-white text-gray-800 hover:bg-gray-50 shadow-lg'
                      }`}
                    >
                      {copiedCode === referralCode ? (
                        <>
                          <FiCheck className="w-6 h-6" />
                          Copied Successfully!
                        </>
                      ) : (
                        <>
                          <FiCopy className="w-6 h-6" />
                          Copy Code
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={generateNewCode}
                      disabled={isLoading}
                      className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <FiRefreshCw className="w-6 h-6 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FiRefreshCw className="w-6 h-6" />
                          New Code
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Social Sharing */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Share with Friends</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {socialPlatforms.map((platform, index) => (
                    <button
                      key={index}
                      onClick={() => handleShare(platform)}
                      className={`group ${platform.color} text-white p-6 rounded-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-2xl animate-fadeInUp`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="group-hover:scale-125 transition-transform duration-300">
                          {platform.icon}
                        </div>
                        <span className="text-sm font-semibold">{platform.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Reward Tiers */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Reward Tiers</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Unlock higher rewards as you refer more friends. Each tier brings exclusive benefits and higher earnings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {rewardTiers.map((tier, index) => (
              <div
                key={tier.id}
                className={`group relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 animate-fadeInUp ${
                  tier.popular ? 'ring-4 ring-blue-400 ring-opacity-50' : ''
                }`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      🔥 Most Popular
                    </div>
                  </div>
                )}

                <div className={`bg-gradient-to-br ${tier.bgGradient} p-8 h-full`}>
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${tier.color} rounded-2xl text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      {tier.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{tier.name}</h3>
                    <p className="text-gray-600">
                      {tier.minReferrals} - {tier.maxReferrals || '∞'} Referrals
                    </p>
                  </div>

                  <div className="text-center mb-6 p-4 bg-white rounded-2xl shadow-sm">
                    <div className="text-3xl font-bold text-gray-800 mb-2">
                      ₹{tier.reward}
                    </div>
                    <div className="text-sm text-gray-600 mb-3">per referral</div>
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                      <FiGift className="w-4 h-4" />
                      Bonus: ₹{tier.bonus}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {tier.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3 text-sm text-gray-700">
                        <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <FiCheck className="w-3 h-3 text-white" />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTier(tier);
                      setShowRewardModal(true);
                    }}
                    className={`w-full py-4 bg-gradient-to-r ${tier.color} text-white rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-12 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to start earning amazing rewards</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Share Your Code",
                description: "Share your unique referral code with friends through social media, WhatsApp, or email",
                icon: <FiShare2 className="w-8 h-8" />,
                color: "from-blue-500 to-blue-600"
              },
              {
                step: "2", 
                title: "Friend Signs Up",
                description: "Your friend downloads the app and creates an account using your referral code",
                icon: <FiUserPlus className="w-8 h-8" />,
                color: "from-green-500 to-green-600"
              },
              {
                step: "3",
                title: "First Booking",
                description: "Your friend completes their first bus booking and enjoys the discount",
                icon: <FiTarget className="w-8 h-8" />,
                color: "from-purple-500 to-purple-600"
              },
              {
                step: "4",
                title: "Earn Rewards",
                description: "Both you and your friend receive cash rewards instantly in your wallet",
                icon: <FiDollarSign className="w-8 h-8" />,
                color: "from-orange-500 to-orange-600"
              }
            ].map((item, index) => (
              <div
                key={index}
                className={`text-center group animate-fadeInUp`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${item.color} rounded-2xl text-white text-2xl font-bold mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {item.step}
                </div>
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${item.color} rounded-xl text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Referrals */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Recent Referrals</h2>
              <p className="text-gray-600">Track your latest referral activity</p>
            </div>
            <button className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors duration-200">
              <span>View All</span>
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {recentReferrals.map((referral, index) => (
              <div
                key={referral.id}
                className={`flex items-center justify-between p-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 animate-fadeInUp`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {referral.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{referral.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FiStar className="w-4 h-4" />
                        {referral.level} Tier
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mr-5">
                  <div className="text-base font-bold text-green-600 mb-1">
                    +₹{referral.reward}
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    referral.status === 'completed' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      referral.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'
                    }`}></div>
                    {referral.status === 'completed' ? 'Completed' : 'Processing'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-white opacity-5 rounded-full translate-x-1/2 translate-y-1/2"></div>
            
            <div className="relative">
              <div className="flex items-center justify-center gap-4 mb-6">
                <HiLightningBolt className="w-12 h-12 animate-bounce" />
                <h2 className="text-5xl font-bold">Start Earning Now!</h2>
                <HiLightningBolt className="w-12 h-12 animate-bounce" />
              </div>
              <p className="text-xl opacity-90 max-w-3xl mx-auto mb-8">
                Don't wait! Share your referral code today and start earning incredible rewards for every friend who joins our platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={copyReferralCode}
                  className="flex items-center gap-3 bg-white text-gray-800 py-5 px-10 rounded-2xl font-bold text-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  <FiCopy className="w-6 h-6" />
                  Copy My Code
                </button>
                <button className="flex items-center gap-3 bg-yellow-500 text-gray-900 py-5 px-10 rounded-2xl font-bold text-xl hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-2xl">
                  <FiShare2 className="w-6 h-6" />
                  Share & Earn
                  <FiArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reward Tier Modal */}
      {showRewardModal && selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl animate-slideInUp">
            <div className={`bg-gradient-to-r ${selectedTier.color} p-8 text-white text-center rounded-t-3xl`}>
              <div className="flex items-center justify-center w-24 h-24 bg-white bg-opacity-20 rounded-2xl mx-auto mb-4">
                {React.cloneElement(selectedTier.icon, { className: 'w-12 h-12' })}
              </div>
              <h2 className="text-3xl font-bold mb-2">{selectedTier.name} Tier</h2>
              <p className="opacity-90">
                {selectedTier.minReferrals} - {selectedTier.maxReferrals || '∞'} Referrals
              </p>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="text-4xl font-bold text-gray-800 mb-2">
                  ₹{selectedTier.reward}
                </div>
                <div className="text-gray-600 mb-4">per successful referral</div>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-6 py-3 rounded-full font-semibold">
                  <FiGift className="w-5 h-5" />
                  Welcome Bonus: ₹{selectedTier.bonus}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-bold text-gray-800">Tier Benefits:</h3>
                {selectedTier.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-gray-700">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <FiCheck className="w-4 h-4 text-white" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowRewardModal(false)}
                className={`w-full py-4 bg-gradient-to-r ${selectedTier.color} text-white rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300`}
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-slideInUp {
          animation: slideInUp 0.5s ease-out;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
    </>
  );
};

export default ReferralProgram;
