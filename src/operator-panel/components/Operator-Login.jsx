import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TruckIcon, 
  EyeIcon, 
  EyeSlashIcon,
  PhoneIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const OperatorLogin = () => {
  const [step, setStep] = useState(1);
  const [credentials, setCredentials] = useState({
    identifier: '',
    password: '',
    mobileOtp: ''
  });
  const [operatorData, setOperatorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  // Find operator in database
  const findOperator = async (identifier) => {
    try {
      const operatorsRef = collection(db, 'operators');
      
      const queries = [
        query(operatorsRef, where('emailAddress', '==', identifier)),
        query(operatorsRef, where('username', '==', identifier)),
        query(operatorsRef, where('mobileNumber', '==', identifier))
      ];

      for (const q of queries) {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          return { id: doc.id, ...doc.data() };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding operator:', error);
      return null;
    }
  };

  // Send OTP (simulated)
  const sendOTP = async (operatorInfo = null) => {
    setLoading(true);
    try {
      const operator = operatorInfo || operatorData;
      
      if (!operator || !operator.mobileNumber) {
        setError('Operator information not found');
        setLoading(false);
        return;
      }

      setTimeout(() => {
        setOtpSent(true);
        setLoading(false);
        alert(`OTP sent to ${operator.mobileNumber}`);
      }, 1000);
    } catch (error) {
      setError('Failed to send OTP');
      setLoading(false);
    }
  };

  // Verify credentials
  const verifyCredentials = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const operator = await findOperator(credentials.identifier);
      
      if (!operator) {
        setError('Operator not found. Please check your email, username, or mobile number.');
        setLoading(false);
        return;
      }

      if (operator.status === 'pending') {
        setError('Your account is pending approval. Please wait for admin verification.');
        setLoading(false);
        return;
      }

      if (operator.status === 'rejected') {
        setError('Your account has been rejected. Please contact support.');
        setLoading(false);
        return;
      }

      if (operator.status !== 'approved') {
        setError('Your account is not active. Please contact support.');
        setLoading(false);
        return;
      }

      if (credentials.password) {
        setOperatorData(operator);
        setStep(2);
        await sendOTP(operator);
      } else {
        setError('Please enter your password');
        setLoading(false);
      }
      
    } catch (error) {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  // Verify OTP and complete login
  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (credentials.mobileOtp === '1234') {
        if (!operatorData) {
          setError('Session expired. Please login again.');
          setStep(1);
          setLoading(false);
          return;
        }

        // 🔥 FIXED: Store the correct operator ID for bookings
        const operatorId = operatorData.operatorId || operatorData.id;
        
        // Store operator info with proper ID structure
        localStorage.setItem('operatorToken', `token_${operatorId}`);
        localStorage.setItem('operatorId', operatorId); // 🔥 Store operatorId separately
        localStorage.setItem('operatorInfo', JSON.stringify({
          id: operatorData.id,
          operatorId: operatorId, // 🔥 Add operatorId field
          name: operatorData.fullName || operatorData.name,
          email: operatorData.emailAddress,
          mobile: operatorData.mobileNumber,
          username: operatorData.username,
          businessName: operatorData.businessName,
          companyName: operatorData.companyName,
          status: operatorData.status
        }));

        console.log('✅ Login successful for operator:', operatorId);
        navigate('/operator-panel');
      } else {
        setError('Invalid OTP. Please enter 1234 for demo.');
      }
    } catch (error) {
      setError('OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setOtpSent(false);
      setOperatorData(null);
      setCredentials(prev => ({ ...prev, mobileOtp: '' }));
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <img 
          src="https://images.unsplash.com/photo-1570125909517-53cb21c89ff2?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8YnVzJTIwdHJhdmVsfGVufDB8fDB8fHww"
          alt="Bus Transport"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-10 left-10 text-white z-10">
          <h1 className="text-4xl font-bold mb-4">EasyTrip Partner Portal</h1>
          <p className="text-xl opacity-90">Manage your bus operations with ease</p>
          <div className="mt-6 space-y-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Real-time booking management</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Route optimization tools</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Revenue analytics dashboard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <TruckIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {step === 1 ? 'Operator Login' : 'Verify OTP'}
            </h2>
            <p className="text-gray-600 text-sm">
              {step === 1 ? 'Access your operator dashboard' : 'Enter the OTP sent to your mobile'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Credentials */}
          {step === 1 && (
            <form onSubmit={verifyCredentials} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email / Username / Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={credentials.identifier}
                    onChange={(e) => handleInputChange('identifier', e.target.value)}
                    placeholder="Enter email, username, or mobile"
                  />
                  <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={credentials.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Continue to OTP'
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && operatorData && (
            <div className="space-y-4">
              {/* Operator Info */}
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center mb-1">
                  <CheckCircleIcon className="w-4 h-4 text-green-600 mr-2" />
                  <span className="font-medium text-green-800 text-sm">Operator Found</span>
                </div>
                <p className="text-sm text-green-700">
                  <strong>{operatorData.fullName || operatorData.name || 'N/A'}</strong><br />
                  {operatorData.businessName || operatorData.companyName || 'N/A'}<br />
                  {operatorData.mobileNumber || 'N/A'}<br />
                  <span className="text-xs bg-green-100 px-2 py-1 rounded mt-1 inline-block">
                    ID: {operatorData.operatorId || operatorData.id}
                  </span>
                </p>
              </div>

              <form onSubmit={verifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter OTP
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength="4"
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-xl font-bold tracking-widest"
                      value={credentials.mobileOtp}
                      onChange={(e) => handleInputChange('mobileOtp', e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                    />
                    <PhoneIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Demo OTP: 1234
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => sendOTP()}
                    disabled={loading}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-300 disabled:opacity-50 text-sm transition-colors"
                  >
                    {loading ? 'Sending...' : 'Resend OTP'}
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading || !credentials.mobileOtp}
                    className="flex-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium text-sm transition-colors"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </div>
                    ) : (
                      'Login to Dashboard'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <button 
              onClick={goBack}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← {step === 1 ? 'Back to Home' : 'Back to Login'}
            </button>
            
            <div className="text-xs text-gray-500 mt-4 space-y-1">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  <span>Approved</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                  <span>Rejected</span>
                </div>
              </div>
              <p>Demo: Use any password • OTP: 1234</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorLogin;
