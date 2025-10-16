import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Building,
  CreditCard,
  FileText,
  Shield,
  Truck,
  Phone,
  Mail,
  Check,
  Eye,
  EyeOff,
  Bus,
  MapPin,
  Star,
  AlertCircle
} from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const OperatorRegistrationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [otpSent, setOtpSent] = useState({ mobile: false, email: false });
  const [otpVerified, setOtpVerified] = useState({ mobile: false, email: false });
  const [showOtp, setShowOtp] = useState({ mobile: false, email: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1 - Personal Details
    fullName: '',
    mobileNumber: '',
    mobileOtp: '',
    emailAddress: '',
    emailOtp: '',
    dateOfBirth: '',
    gender: '',
    aadharNumber: '',
    panNumber: '',
    alternateContact: '',

    // Step 2 - Business Details
    businessName: '',
    businessType: '',
    businessAddress: '',
    operatingStates: '',
    yearsExperience: '',
    numberOfBuses: '',

    // Step 3 - Bank Details
    accountHolderName: '',
    bankName: '',
    branch: '',
    accountNumber: '',
    ifscCode: '',

    // Step 4 - GST Details
    gstNumber: '',
    registeredBusinessName: '',

    // Step 5 - Legal Documents
    drivingLicenseNumber: '',

    // Step 6 - Bus Documents
    rcNumber: '',
    insurancePolicyNumber: '',
    permitNumber: '',
    fitnessCertificateNumber: '',
    pucNumber: ''
  });

  const steps = [
    { id: 1, title: 'Personal Details', icon: User, color: 'from-orange-400 to-red-500' },
    { id: 2, title: 'Business Details', icon: Building, color: 'from-blue-400 to-blue-600' },
    { id: 3, title: 'Bank Details', icon: CreditCard, color: 'from-green-400 to-green-600' },
    { id: 4, title: 'GST Details', icon: FileText, color: 'from-purple-400 to-purple-600' },
    { id: 5, title: 'Legal Documents', icon: Shield, color: 'from-yellow-400 to-orange-500' },
    { id: 6, title: 'Bus Documents', icon: Truck, color: 'from-red-400 to-red-600' }
  ];

  // Required fields for each step
  const requiredFields = {
    1: ['fullName', 'mobileNumber', 'emailAddress', 'dateOfBirth', 'gender', 'aadharNumber', 'panNumber'],
    2: ['businessName', 'businessType', 'businessAddress', 'operatingStates', 'yearsExperience', 'numberOfBuses'],
    3: ['accountHolderName', 'bankName', 'branch', 'accountNumber', 'ifscCode'],
    4: ['gstNumber', 'registeredBusinessName'],
    5: [], // No required fields for step 5
    6: ['rcNumber', 'insurancePolicyNumber', 'permitNumber', 'fitnessCertificateNumber', 'pucNumber']
  };

  // Generate unique operatorId
  const generateOperatorId = () => {
    const prefix = 'OP';
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  // Check if operatorId exists
  const checkOperatorIdExists = async (operatorId) => {
    try {
      const q = query(collection(db, 'operators'), where('operatorId', '==', operatorId));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking operatorId:', error);
      return false;
    }
  };

  // Generate unique operatorId that doesn't exist
  const generateUniqueOperatorId = async () => {
    let operatorId = generateOperatorId();
    let attempts = 0;
    const maxAttempts = 10;

    while (await checkOperatorIdExists(operatorId) && attempts < maxAttempts) {
      operatorId = generateOperatorId();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Could not generate unique operator ID after multiple attempts');
    }

    return operatorId;
  };

  // Generate unique username
  const generateUsername = (fullName, mobileNumber) => {
    const namePart = fullName.toLowerCase().replace(/\s+/g, '').slice(0, 6);
    const numberPart = mobileNumber.slice(-4);
    const timestamp = Date.now().toString().slice(-3);
    return `${namePart}${numberPart}${timestamp}`;
  };

  // Check if username exists
  const checkUsernameExists = async (username) => {
    try {
      const q = query(collection(db, 'operators'), where('username', '==', username));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  // Generate unique username that doesn't exist
  const generateUniqueUsername = async (fullName, mobileNumber) => {
    let username = generateUsername(fullName, mobileNumber);
    let counter = 1;

    while (await checkUsernameExists(username)) {
      const namePart = fullName.toLowerCase().replace(/\s+/g, '').slice(0, 6);
      const numberPart = mobileNumber.slice(-4);
      username = `${namePart}${numberPart}${counter}`;
      counter++;
    }

    return username;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (stepNumber) => {
    const stepRequiredFields = requiredFields[stepNumber];
    const stepErrors = {};
    let hasErrors = false;

    stepRequiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        stepErrors[field] = 'This field is required';
        hasErrors = true;
      }
    });

    // Additional validations for step 1
    if (stepNumber === 1) {
      if (!otpVerified.mobile) {
        stepErrors.mobileOtp = 'Please verify your mobile number';
        hasErrors = true;
      }
      if (!otpVerified.email) {
        stepErrors.emailOtp = 'Please verify your email address';
        hasErrors = true;
      }

      // Validate mobile number format
      if (formData.mobileNumber && !/^[6-9]\d{9}$/.test(formData.mobileNumber)) {
        stepErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
        hasErrors = true;
      }

      // Validate email format
      if (formData.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
        stepErrors.emailAddress = 'Please enter a valid email address';
        hasErrors = true;
      }

      // Validate Aadhar number
      if (formData.aadharNumber && !/^\d{12}$/.test(formData.aadharNumber)) {
        stepErrors.aadharNumber = 'Please enter a valid 12-digit Aadhar number';
        hasErrors = true;
      }

      // Validate PAN number
      if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
        stepErrors.panNumber = 'Please enter a valid PAN number (ABCDE1234F)';
        hasErrors = true;
      }
    }

    // Additional validations for step 3
    if (stepNumber === 3) {
      // Validate IFSC code
      if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
        stepErrors.ifscCode = 'Please enter a valid IFSC code';
        hasErrors = true;
      }
    }

    // Additional validations for step 4
    if (stepNumber === 4) {
      // Validate GST number
      if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
        stepErrors.gstNumber = 'Please enter a valid GST number';
        hasErrors = true;
      }
    }

    setErrors(stepErrors);
    return !hasErrors;
  };

  const sendOtp = (type) => {
    const value = type === 'mobile' ? formData.mobileNumber : formData.emailAddress;

    if (!value) {
      setErrors(prev => ({
        ...prev,
        [type === 'mobile' ? 'mobileNumber' : 'emailAddress']: 'Please enter your ' + type + ' first'
      }));
      return;
    }

    // Validate format before sending OTP
    if (type === 'mobile' && !/^[6-9]\d{9}$/.test(value)) {
      setErrors(prev => ({ ...prev, mobileNumber: 'Please enter a valid 10-digit mobile number' }));
      return;
    }

    if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors(prev => ({ ...prev, emailAddress: 'Please enter a valid email address' }));
      return;
    }

    setOtpSent(prev => ({ ...prev, [type]: true }));
    setShowOtp(prev => ({ ...prev, [type]: true }));
    alert(`OTP sent to your ${type === 'mobile' ? 'mobile number' : 'email address'}`);
  };

  const verifyOtp = (type) => {
    const otpValue = formData[`${type}Otp`];
    if (otpValue === '1234') {
      setOtpVerified(prev => ({ ...prev, [type]: true }));
      setErrors(prev => ({ ...prev, [`${type}Otp`]: '' }));
      alert(`${type === 'mobile' ? 'Mobile' : 'Email'} verified successfully!`);
    } else {
      setErrors(prev => ({ ...prev, [`${type}Otp`]: 'Invalid OTP! Please enter 1234' }));
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 6) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      alert('Please fill all required fields correctly before proceeding.');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      alert('Please fill all required fields correctly.');
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Starting registration process...');

      // Generate unique operatorId
      const operatorId = await generateUniqueOperatorId();
      console.log('✅ Generated unique operatorId:', operatorId);

      // Generate unique username
      const username = await generateUniqueUsername(formData.fullName, formData.mobileNumber);
      console.log('✅ Generated unique username:', username);

      // Prepare data for Firestore
      const operatorData = {
        // 🔑 MAIN ADDITION - Unique Operator ID
        operatorId: operatorId,

        // All form data
        ...formData,

        // Generated fields
        username: username,

        // System fields
        registrationDate: new Date(),
        status: 'pending', // pending, approved, rejected
        createdAt: new Date(),
        updatedAt: new Date(),

        // Additional metadata
        registrationSource: 'web',
        accountType: 'operator',
        isActive: false, // Will be true after approval
        verificationLevel: 'basic'
      };

      console.log('📋 Operator data prepared:', {
        operatorId,
        username,
        businessName: formData.businessName,
        status: 'pending'
      });

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'operators'), operatorData);

      console.log('✅ Document saved with Firestore ID:', docRef.id);

      // Success message
      alert(`🎉 Registration completed successfully! 
             
🆔 Your Operator ID: ${operatorId}
👤 Username: ${username}
📄 Registration ID: ${docRef.id}
📧 Email: ${formData.emailAddress}
📱 Mobile: ${formData.mobileNumber}

⏳ Status: Pending Approval
📝 Please save your Operator ID and Username for future reference.

You will receive a confirmation email once your account is approved.`);

      console.log('🎯 Registration completed successfully:', {
        operatorId,
        username,
        firestoreId: docRef.id,
        businessName: formData.businessName
      });

      // Reset form after successful registration
      setFormData({
        fullName: '', mobileNumber: '', mobileOtp: '', emailAddress: '', emailOtp: '',
        dateOfBirth: '', gender: '', aadharNumber: '', panNumber: '', alternateContact: '',
        businessName: '', businessType: '', businessAddress: '', operatingStates: '',
        yearsExperience: '', numberOfBuses: '', accountHolderName: '', bankName: '',
        branch: '', accountNumber: '', ifscCode: '', gstNumber: '', registeredBusinessName: '',
        drivingLicenseNumber: '', rcNumber: '', insurancePolicyNumber: '', permitNumber: '',
        fitnessCertificateNumber: '', pucNumber: ''
      });

      setCurrentStep(1);
      setOtpVerified({ mobile: false, email: false });
      setOtpSent({ mobile: false, email: false });
      setShowOtp({ mobile: false, email: false });

    } catch (error) {
      console.error('❌ Registration failed:', error);
      alert(`Registration failed! 
             Error: ${error.message}
             Please try again or contact support.`);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="relative mb-4">
      {/* Connection Lines */}
      <div className="absolute top-6 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full"></div>
      <div
        className="absolute top-6 left-0 h-1 bg-gradient-to-r from-orange-400 via-red-500 to-blue-500 rounded-full transition-all duration-1000 ease-in-out"
        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
      ></div>

      <div className="relative flex justify-between items-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep >= step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex flex-col items-center group">
              <div className={`relative w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-500 transform ${isCurrent ? 'scale-110 shadow-2xl' : isActive ? 'scale-105 shadow-lg' : 'scale-100 shadow-md'
                } ${isActive
                  ? `bg-gradient-to-br ${step.color} text-white border-4 border-white animate-pulse`
                  : 'bg-white text-gray-400 border-4 border-gray-200'
                }`}>
                <Icon size={24} className={`${isCurrent ? 'animate-bounce' : ''}`} />
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                    <Check size={14} />
                  </div>
                )}
              </div>
              <span className={`text-sm font-semibold transition-all duration-300 text-center max-w-20 ${isActive ? 'text-orange-600' : 'text-gray-500'
                } ${isCurrent ? 'text-lg transform scale-110' : ''}`}>
                {step.title}
              </span>
              {isCurrent && (
                <div className="absolute -bottom-8 w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Error message component
  const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return (
      <div className="flex items-center mt-1 text-red-600 text-sm">
        <AlertCircle size={16} className="mr-1" />
        {error}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-4 shadow-lg">
          <User className="text-white" size={32} />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Personal Details</h2>
        <p className="text-gray-600">Let's start with your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            required
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-300 hover:border-orange-300 ${errors.fullName ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="Enter your full name"
          />
          <ErrorMessage error={errors.fullName} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Mobile Number *
          </label>
          <div className="flex space-x-3">
            <input
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
              className={`flex-1 px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-300 ${errors.mobileNumber ? 'border-red-500' : 'border-gray-200'
                }`}
              placeholder="Enter 10-digit mobile number"
              maxLength="10"
            />
            <button
              type="button"
              onClick={() => sendOtp('mobile')}
              disabled={otpVerified.mobile}
              className={`px-5 py-4 rounded-xl transition-all duration-300 flex items-center transform hover:scale-105 ${otpVerified.mobile
                ? 'bg-green-500 text-white cursor-not-allowed shadow-lg'
                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl'
                }`}
            >
              {otpVerified.mobile ? <Check size={20} /> : <Phone size={20} />}
            </button>
          </div>
          <ErrorMessage error={errors.mobileNumber} />

          {showOtp.mobile && !otpVerified.mobile && (
            <div className="mt-3 flex space-x-3 animate-slideDown">
              <input
                type="text"
                value={formData.mobileOtp}
                onChange={(e) => handleInputChange('mobileOtp', e.target.value)}
                className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-300 ${errors.mobileOtp ? 'border-red-500' : 'border-gray-200'
                  }`}
                placeholder="Enter OTP (1234)"
                maxLength="4"
              />
              <button
                type="button"
                onClick={() => verifyOtp('mobile')}
                className="px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Verify
              </button>
            </div>
          )}
          <ErrorMessage error={errors.mobileOtp} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email Address *
          </label>
          <div className="flex space-x-3">
            <input
              type="email"
              value={formData.emailAddress}
              onChange={(e) => handleInputChange('emailAddress', e.target.value)}
              className={`flex-1 px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-300 ${errors.emailAddress ? 'border-red-500' : 'border-gray-200'
                }`}
              placeholder="your.email@example.com"
            />
            <button
              type="button"
              onClick={() => sendOtp('email')}
              disabled={otpVerified.email}
              className={`px-5 py-4 rounded-xl transition-all duration-300 flex items-center transform hover:scale-105 ${otpVerified.email
                ? 'bg-green-500 text-white cursor-not-allowed shadow-lg'
                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl'
                }`}
            >
              {otpVerified.email ? <Check size={20} /> : <Mail size={20} />}
            </button>
          </div>
          <ErrorMessage error={errors.emailAddress} />

          {showOtp.email && !otpVerified.email && (
            <div className="mt-3 flex space-x-3 animate-slideDown">
              <input
                type="text"
                value={formData.emailOtp}
                onChange={(e) => handleInputChange('emailOtp', e.target.value)}
                className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-300 ${errors.emailOtp ? 'border-red-500' : 'border-gray-200'
                  }`}
                placeholder="Enter OTP (1234)"
                maxLength="4"
              />
              <button
                type="button"
                onClick={() => verifyOtp('email')}
                className="px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Verify
              </button>
            </div>
          )}
          <ErrorMessage error={errors.emailOtp} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-300 hover:border-orange-300 ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-200'
              }`}
          />
          <ErrorMessage error={errors.dateOfBirth} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Gender *
          </label>
          <select
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-300 hover:border-orange-300 ${errors.gender ? 'border-red-500' : 'border-gray-200'
              }`}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <ErrorMessage error={errors.gender} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Aadhar Number *
          </label>
          <input
            type="text"
            value={formData.aadharNumber}
            onChange={(e) => handleInputChange('aadharNumber', e.target.value.replace(/\D/g, ''))}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-300 hover:border-orange-300 ${errors.aadharNumber ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="Enter 12-digit Aadhar number"
            maxLength="12"
          />
          <ErrorMessage error={errors.aadharNumber} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            PAN Number *
          </label>
          <input
            type="text"
            value={formData.panNumber}
            onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-300 hover:border-orange-300 ${errors.panNumber ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="ABCDE1234F"
            maxLength="10"
          />
          <ErrorMessage error={errors.panNumber} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Alternate Contact Number
          </label>
          <input
            type="tel"
            value={formData.alternateContact}
            onChange={(e) => handleInputChange('alternateContact', e.target.value)}
            className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-300 hover:border-orange-300"
            placeholder="Enter 10-digit alternate number"
            maxLength="10"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mb-4 shadow-lg">
          <Building className="text-white" size={32} />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Business Details</h2>
        <p className="text-gray-600">Tell us about your bus operation business</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Business Name *
          </label>
          <input
            type="text"
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 hover:border-blue-300 ${errors.businessName ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="Enter business name"
          />
          <ErrorMessage error={errors.businessName} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Type of Business *
          </label>
          <select
            value={formData.businessType}
            onChange={(e) => handleInputChange('businessType', e.target.value)}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 hover:border-blue-300 ${errors.businessType ? 'border-red-500' : 'border-gray-200'
              }`}
          >
            <option value="">Select Business Type</option>
            <option value="individual">Individual</option>
            <option value="partnership">Partnership</option>
            <option value="private_limited">Private Limited</option>
            <option value="public_limited">Public Limited</option>
            <option value="llp">LLP</option>
          </select>
          <ErrorMessage error={errors.businessType} />
        </div>

        <div className="lg:col-span-2 space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Business Address *
          </label>
          <textarea
            value={formData.businessAddress}
            onChange={(e) => handleInputChange('businessAddress', e.target.value)}
            rows="4"
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 hover:border-blue-300 ${errors.businessAddress ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="Enter complete business address"
          />
          <ErrorMessage error={errors.businessAddress} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Operating States/Cities *
          </label>
          <input
            type="text"
            value={formData.operatingStates}
            onChange={(e) => handleInputChange('operatingStates', e.target.value)}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 hover:border-blue-300 ${errors.operatingStates ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="e.g., Rajasthan, Gujarat, Maharashtra"
          />
          <ErrorMessage error={errors.operatingStates} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Years of Experience *
          </label>
          <input
            type="number"
            value={formData.yearsExperience}
            onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 hover:border-blue-300 ${errors.yearsExperience ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="Enter years of experience"
            min="0"
          />
          <ErrorMessage error={errors.yearsExperience} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Number of Buses Operated *
          </label>
          <input
            type="number"
            value={formData.numberOfBuses}
            onChange={(e) => handleInputChange('numberOfBuses', e.target.value)}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 hover:border-blue-300 ${errors.numberOfBuses ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="Enter number of buses"
            min="1"
          />
          <ErrorMessage error={errors.numberOfBuses} />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-4 shadow-lg">
          <CreditCard className="text-white" size={32} />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Bank Details</h2>
        <p className="text-gray-600">Enter your bank account information for payments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Account Holder Name *
          </label>
          <input
            type="text"
            value={formData.accountHolderName}
            onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-300 hover:border-green-300 ${errors.accountHolderName ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="As per bank records"
          />
          <ErrorMessage error={errors.accountHolderName} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bank Name *
          </label>
          <input
            type="text"
            value={formData.bankName}
            onChange={(e) => handleInputChange('bankName', e.target.value)}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-300 hover:border-green-300 ${errors.bankName ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="Enter bank name"
          />
          <ErrorMessage error={errors.bankName} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Branch Name *
          </label>
          <input
            type="text"
            value={formData.branch}
            onChange={(e) => handleInputChange('branch', e.target.value)}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-300 hover:border-green-300 ${errors.branch ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="Enter branch name"
          />
          <ErrorMessage error={errors.branch} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Account Number *
          </label>
          <input
            type="text"
            value={formData.accountNumber}
            onChange={(e) => handleInputChange('accountNumber', e.target.value)}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-300 hover:border-green-300 ${errors.accountNumber ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="Enter account number"
          />
          <ErrorMessage error={errors.accountNumber} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            IFSC Code *
          </label>
          <input
            type="text"
            value={formData.ifscCode}
            onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-300 hover:border-green-300 ${errors.ifscCode ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="ABCD0123456"
            maxLength="11"
          />
          <ErrorMessage error={errors.ifscCode} />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mb-4 shadow-lg">
          <FileText className="text-white" size={32} />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">GST Details</h2>
        <p className="text-gray-600">Provide your GST registration information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            GST Number *
          </label>
          <input
            type="text"
            value={formData.gstNumber}
            onChange={(e) => handleInputChange('gstNumber', e.target.value.toUpperCase())}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300 hover:border-purple-300 ${errors.gstNumber ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="22AAAAA0000A1Z5"
            maxLength="15"
          />
          <ErrorMessage error={errors.gstNumber} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Registered Business Name *
          </label>
          <input
            type="text"
            value={formData.registeredBusinessName}
            onChange={(e) => handleInputChange('registeredBusinessName', e.target.value)}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300 hover:border-purple-300 ${errors.registeredBusinessName ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="Business name as per GST certificate"
          />
          <ErrorMessage error={errors.registeredBusinessName} />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4 shadow-lg">
          <Shield className="text-white" size={32} />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Legal Documents</h2>
        <p className="text-gray-600">Upload your legal documents for verification</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Driving License Number
          </label>
          <input
            type="text"
            value={formData.drivingLicenseNumber}
            onChange={(e) => handleInputChange('drivingLicenseNumber', e.target.value)}
            className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-200 focus:border-yellow-500 transition-all duration-300 hover:border-yellow-300"
            placeholder="Enter driving license number (optional)"
          />
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full mb-4 shadow-lg">
          <Truck className="text-white" size={32} />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Bus Documents</h2>
        <p className="text-gray-600">Provide your bus-related documentation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            RC Number *
          </label>
          <input
            type="text"
            value={formData.rcNumber}
            onChange={(e) => handleInputChange('rcNumber', e.target.value.toUpperCase())}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-red-200 focus:border-red-500 transition-all duration-300 hover:border-red-300 ${errors.rcNumber ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="RJ14AB1234"
          />
          <ErrorMessage error={errors.rcNumber} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Insurance Policy Number *
          </label>
          <input
            type="text"
            value={formData.insurancePolicyNumber}
            onChange={(e) => handleInputChange('insurancePolicyNumber', e.target.value)}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-red-200 focus:border-red-500 transition-all duration-300 hover:border-red-300 ${errors.insurancePolicyNumber ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="Enter insurance policy number"
          />
          <ErrorMessage error={errors.insurancePolicyNumber} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Permit Number *
          </label>
          <input
            type="text"
            value={formData.permitNumber}
            onChange={(e) => handleInputChange('permitNumber', e.target.value)}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-red-200 focus:border-red-500 transition-all duration-300 hover:border-red-300 ${errors.permitNumber ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="Enter permit number"
          />
          <ErrorMessage error={errors.permitNumber} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fitness Certificate Number *
          </label>
          <input
            type="text"
            value={formData.fitnessCertificateNumber}
            onChange={(e) => handleInputChange('fitnessCertificateNumber', e.target.value)}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-red-200 focus:border-red-500 transition-all duration-300 hover:border-red-300 ${errors.fitnessCertificateNumber ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="Enter fitness certificate number"
          />
          <ErrorMessage error={errors.fitnessCertificateNumber} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            PUC Number *
          </label>
          <input
            type="text"
            value={formData.pucNumber}
            onChange={(e) => handleInputChange('pucNumber', e.target.value)}
            className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-4 focus:ring-red-200 focus:border-red-500 transition-all duration-300 hover:border-red-300 ${errors.pucNumber ? 'border-red-500' : 'border-gray-200'
              }`}
            placeholder="Enter PUC number"
          />
          <ErrorMessage error={errors.pucNumber} />
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return renderStep1();
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.2)), url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80')`
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-orange-400 opacity-20 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-blue-400 opacity-20 rounded-full animate-bounce delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-green-400 opacity-20 rounded-full animate-bounce delay-3000"></div>
        <div className="absolute bottom-40 right-10 w-18 h-18 bg-red-400 opacity-20 rounded-full animate-bounce delay-500"></div>
      </div>

      <div className="relative py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-2xl">
              Become Partner EasyTrip
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto drop-shadow-lg">
              Join our network of trusted bus operators and expand your business reach across India
            </p>
            <div className="flex items-center justify-center space-x-6 mt-6">
              <div className="flex items-center text-white/80">
                <Star className="text-yellow-400 mr-2" size={20} />
                <span>Trusted Platform</span>
              </div>
              <div className="flex items-center text-white/80">
                <MapPin className="text-green-400 mr-2" size={20} />
                <span>Pan India Network</span>
              </div>
              <div className="flex items-center text-white/80">
                <Shield className="text-blue-400 mr-2" size={20} />
                <span>Secure & Verified</span>
              </div>
            </div>
          </div>

          {/* Main Form Container */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-white/20">
            {renderStepIndicator()}

            <div className="mb-10">
              {renderCurrentStep()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8 border-t-2 border-gray-100">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center px-8 py-4 rounded-2xl transition-all duration-300 transform font-semibold ${currentStep === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                  }`}
              >
                <ChevronLeft className="mr-2" size={20} />
                Previous
              </button>

              <div className="text-center">
                <div className="flex space-x-2 mb-2">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${index + 1 <= currentStep ? 'bg-orange-500' : 'bg-gray-300'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  Step {currentStep} of {steps.length}
                </span>
              </div>

              {currentStep < 6 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-2xl hover:from-orange-600 hover:via-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 font-semibold"
                >
                  Next
                  <ChevronRight className="ml-2" size={20} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`flex items-center px-10 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 font-bold text-lg ${loading
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                    }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Registering...
                    </>
                  ) : (
                    <>
                      <Check className="mr-3" size={24} />
                      Complete Registration
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Footer Section */}
          <div className="text-center mt-12">
            <p className="text-white/70 text-sm">
              By registering, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OperatorRegistrationForm;
