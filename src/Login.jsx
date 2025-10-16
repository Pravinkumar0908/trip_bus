// Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs
} from 'firebase/firestore';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail
} from 'firebase/auth';
import { db, auth } from './config/firebase';

const googleProvider = new GoogleAuthProvider();

// Google Icon
const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const Login = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [inputOtp, setInputOtp] = useState('');
    const [status, setStatus] = useState('');
    const [expiryTime, setExpiryTime] = useState(null);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');

    // Validations
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        return password.length >= 6;
    };

    const validatePhone = (phone) => {
        const phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(phone);
    };

    // Check if email exists
    const checkEmailExists = async (email) => {
        try {
            const q = query(collection(db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error('Error checking email:', error);
            return false;
        }
    };

    // Generate OTP
    const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    // Send OTP
    const sendOTP = async (e) => {
        e.preventDefault();

        if (!email) {
            setStatus('❌ Please enter an email address');
            return;
        }

        if (!validateEmail(email)) {
            setStatus('❌ Please enter a valid email address');
            return;
        }

        setLoading(true);

        // Check if email already exists
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
            setStatus('❌ Email already registered. Please use a different email or login.');
            setLoading(false);
            return;
        }

        const otp = generateOTP();
        setGeneratedOtp(otp);

        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 15);
        setExpiryTime(expiry);

        const templateParams = {
            email: email,
            passcode: otp,
            time: expiry.toLocaleTimeString(),
        };

        try {
            await emailjs.send(
                'service_etzh8ig',
                'template_zdsmvy9',
                templateParams,
                'ki6O5ht90I1GZG1oZ'
            );
            setStatus(`✅ OTP sent to ${email}. Please check your inbox.`);
            setShowOtpInput(true);
        } catch (error) {
            console.error('FAILED...', error);
            setStatus('❌ Failed to send OTP. Please check your EmailJS configuration.');
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP
    const verifyOTP = (e) => {
        e.preventDefault();

        if (!inputOtp) {
            setStatus('❌ Please enter the OTP.');
            return;
        }

        if (!generatedOtp) {
            setStatus('❌ Please generate and send OTP first.');
            return;
        }

        const now = new Date();
        if (expiryTime && now > expiryTime) {
            setStatus('❌ OTP has expired. Please request a new one.');
            setGeneratedOtp('');
            setInputOtp('');
            setShowOtpInput(false);
            return;
        }

        if (inputOtp === generatedOtp) {
            setStatus('✅ OTP verified successfully! You can now create your account.');
            setIsOtpVerified(true);
            setShowOtpInput(false);
        } else {
            setStatus('❌ Incorrect OTP. Please try again.');
        }
    };

    // Handle Login
    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!email || !password) {
            setStatus('❌ Please fill in all fields');
            return;
        }

        if (!validateEmail(email)) {
            setStatus('❌ Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            setStatus('✅ Login successful! Redirecting...');
            
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Login failed. Please try again.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = '❌ No account found with this email. Please sign up first.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = '❌ Incorrect password. Please try again.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = '❌ Invalid email format.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = '❌ Too many failed attempts. Please try again later.';
                    break;
                default:
                    errorMessage = `❌ ${error.message}`;
            }
            
            setStatus(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle Signup
    const handleSignup = async (e) => {
        e.preventDefault();
        
        if (!email || !password || !name || !phone) {
            setStatus('❌ Please fill in all fields');
            return;
        }

        if (!validateEmail(email)) {
            setStatus('❌ Please enter a valid email address');
            return;
        }

        if (!validatePassword(password)) {
            setStatus('❌ Password must be at least 6 characters long');
            return;
        }

        if (!validatePhone(phone)) {
            setStatus('❌ Please enter a valid 10-digit phone number');
            return;
        }

        if (!isOtpVerified) {
            setStatus('❌ Please verify your email with OTP first');
            return;
        }

        setLoading(true);

        try {
            const emailExists = await checkEmailExists(email);
            if (emailExists) {
                setStatus('❌ Email already registered. Please use a different email.');
                setLoading(false);
                return;
            }

            // Create user with Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save user data to Firestore
            await addDoc(collection(db, 'users'), {
                uid: user.uid,
                email: email,
                name: name,
                phone: phone,
                createdAt: new Date(),
                emailVerified: true
            });

            setStatus('✅ Account created successfully! Redirecting...');
            
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

        } catch (error) {
            console.error('Signup error:', error);
            let errorMessage = 'Signup failed. Please try again.';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = '❌ Email already registered. Please login or use a different email.';
                    break;
                case 'auth/weak-password':
                    errorMessage = '❌ Password is too weak. Please choose a stronger password.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = '❌ Invalid email format.';
                    break;
                default:
                    errorMessage = `❌ ${error.message}`;
            }
            
            setStatus(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Google Sign In
    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if user data exists in Firestore
            const q = query(collection(db, 'users'), where('uid', '==', user.uid));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // Save new Google user to Firestore
                await addDoc(collection(db, 'users'), {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    phone: user.phoneNumber || '',
                    createdAt: new Date(),
                    emailVerified: true,
                    provider: 'google'
                });
            }

            setStatus('✅ Google sign-in successful! Redirecting...');
            
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

        } catch (error) {
            console.error('Google sign-in error:', error);
            setStatus('❌ Google sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle Forgot Password
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        
        if (!forgotEmail) {
            setStatus('❌ Please enter your email address');
            return;
        }

        if (!validateEmail(forgotEmail)) {
            setStatus('❌ Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, forgotEmail);
            setStatus('✅ Password reset email sent! Please check your inbox and follow the instructions.');
            setShowForgotPassword(false);
            setForgotEmail('');
        } catch (error) {
            console.error('Password reset error:', error);
            let errorMessage = 'Failed to send password reset email.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = '❌ No account found with this email address.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = '❌ Invalid email address format.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = '❌ Too many requests. Please try again later.';
                    break;
                default:
                    errorMessage = `❌ ${error.message}`;
            }
            
            setStatus(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Reset Form
    const resetForm = () => {
        setEmail('');
        setPassword('');
        setName('');
        setPhone('');
        setGeneratedOtp('');
        setInputOtp('');
        setStatus('');
        setExpiryTime(null);
        setShowOtpInput(false);
        setIsOtpVerified(false);
        setShowForgotPassword(false);
        setForgotEmail('');
    };

    const handleTabSwitch = (loginTab) => {
        setIsLogin(loginTab);
        resetForm();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex w-full max-w-4xl shadow-2xl rounded-lg overflow-hidden">
                {/* Left Side - Bus Image */}
                <div className="w-1/2 hidden md:block bg-gray-100 p-8 flex flex-col justify-center">
                    <div className="mt-8 text-center">
                        <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
                            Welcome Aboard!
                        </h1>
                        <p className="text-lg p-2 mt-20 text-gray-600">
                            Experience luxury and comfort with our world-class buses.<br />
                            <span className="text-sm text-blue-600 font-medium">
                                🔐 Secure signup with email verification
                            </span>
                        </p>
                    </div>

                    <img
                        src="https://res.cloudinary.com/dp12aiewd/image/upload/v1753931156/ChatGPT_Image_Jul_30_2025_at_08_30_28_PM_y2ard6.png"
                        alt="Amazing Luxury Bus"
                        className="object-cover rounded-lg shadow-xl mx-auto"
                        style={{ maxHeight: "460px" }}
                    />
                </div>

                {/* Right Side - Login/Signup Form */}
                <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
                    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
                        {!showForgotPassword ? (
                            <>
                                <div className="flex justify-center mb-8">
                                    <button
                                        onClick={() => handleTabSwitch(true)}
                                        className={`px-4 py-2 font-medium border-b-2 focus:outline-none ${isLogin
                                                ? 'border-black text-black'
                                                : 'border-transparent text-gray-400'
                                            } transition-all duration-300`}
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => handleTabSwitch(false)}
                                        className={`px-4 py-2 font-medium border-b-2 focus:outline-none ${!isLogin
                                                ? 'border-black text-black'
                                                : 'border-transparent text-gray-400'
                                            } transition-all duration-300`}
                                    >
                                        Signup
                                    </button>
                                </div>

                                {/* Status message */}
                                {status && (
                                    <div className={`mb-4 p-3 rounded text-sm font-medium ${
                                        status.includes('✅') 
                                            ? 'bg-green-100 text-green-700 border border-green-300' 
                                            : 'bg-red-100 text-red-700 border border-red-300'
                                    }`}>
                                        {status}
                                    </div>
                                )}

                                <form className="space-y-6">
                                    {/* Name field - only for signup */}
                                    {!isLogin && (
                                        <div>
                                            <label className="block text-black mb-1">Full Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                placeholder="Enter your full name"
                                                required
                                            />
                                        </div>
                                    )}

                                    {/* Phone field - only for signup */}
                                    {!isLogin && (
                                        <div>
                                            <label className="block text-black mb-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                placeholder="Enter 10-digit phone number"
                                                maxLength={10}
                                                required
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-black mb-1">Email</label>
                                        {!isLogin ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="email"
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    placeholder="your@email.com"
                                                    required
                                                    disabled={isOtpVerified || loading}
                                                />
                                                {!isOtpVerified && (
                                                    <button
                                                        type="button"
                                                        onClick={sendOTP}
                                                        className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all whitespace-nowrap disabled:bg-gray-400"
                                                        disabled={!email || loading}
                                                    >
                                                        {loading ? 'Sending...' : 'Send'}
                                                    </button>
                                                )}
                                                {isOtpVerified && (
                                                    <span className="px-4 py-2 bg-green-500 text-white rounded flex items-center">
                                                        ✓ Verified
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <input
                                                type="email"
                                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                placeholder="your@email.com"
                                                required
                                            />
                                        )}
                                    </div>

                                    {/* OTP Input Field - Only show for Signup */}
                                    {!isLogin && showOtpInput && (
                                        <div>
                                            <label className="block text-black mb-1">Enter OTP</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                                                    value={inputOtp}
                                                    onChange={e => setInputOtp(e.target.value)}
                                                    placeholder="Enter 6-digit OTP"
                                                    maxLength={6}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={verifyOTP}
                                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-all whitespace-nowrap"
                                                >
                                                    Verify
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-black mb-1">Password</label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>

                                    {isLogin && (
                                        <div className="text-right">
                                            <button
                                                type="button"
                                                onClick={() => setShowForgotPassword(true)}
                                                className="text-blue-500 hover:underline text-sm"
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        onClick={isLogin ? handleLogin : handleSignup}
                                        className={`w-full py-2 mt-3 bg-black text-white rounded hover:bg-gray-800 transition-all ${
                                            (!isLogin && !isOtpVerified) || loading
                                                ? 'disabled:bg-gray-400 disabled:cursor-not-allowed' 
                                                : ''
                                        }`}
                                        disabled={(!isLogin && !isOtpVerified) || loading}
                                    >
                                        {loading ? (isLogin ? 'Logging in...' : 'Creating Account...') : (isLogin ? 'Login' : 'Sign Up')}
                                    </button>

                                    <div className="flex items-center mt-4">
                                        <div className="w-full border-t border-gray-300"></div>
                                        <span className="mx-2 text-gray-400">or</span>
                                        <div className="w-full border-t border-gray-300"></div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleGoogleSignIn}
                                        className="w-full flex items-center justify-center gap-3 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-all disabled:bg-gray-100"
                                        disabled={loading}
                                    >
                                        <GoogleIcon />
                                        <span className="text-black">
                                            {loading ? 'Signing in...' : 'Sign in with Google'}
                                        </span>
                                    </button>
                                </form>
                            </>
                        ) : (
                            /* Forgot Password Section */
                            <div>
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-black">Reset Password</h2>
                                    <p className="text-gray-600 mt-2">Enter your email to receive a password reset link</p>
                                </div>

                                {/* Status message */}
                                {status && (
                                    <div className={`mb-4 p-3 rounded text-sm font-medium ${
                                        status.includes('✅') 
                                            ? 'bg-green-100 text-green-700 border border-green-300' 
                                            : 'bg-red-100 text-red-700 border border-red-300'
                                    }`}>
                                        {status}
                                    </div>
                                )}

                                <form className="space-y-6" onSubmit={handleForgotPassword}>
                                    <div>
                                        <label className="block text-black mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                                            value={forgotEmail}
                                            onChange={e => setForgotEmail(e.target.value)}
                                            placeholder="Enter your email address"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all disabled:bg-gray-400"
                                        disabled={loading}
                                    >
                                        {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                                    </button>

                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowForgotPassword(false);
                                                setStatus('');
                                                setForgotEmail('');
                                            }}
                                            className="text-blue-500 hover:underline text-sm"
                                        >
                                            Back to Login
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
