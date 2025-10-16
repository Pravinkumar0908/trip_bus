// ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../config/firebase';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [isValidCode, setIsValidCode] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    const actionCode = searchParams.get('oobCode');
    const mode = searchParams.get('mode');

    useEffect(() => {
        const validateResetCode = async () => {
            if (!actionCode || mode !== 'resetPassword') {
                setStatus('❌ Invalid or expired password reset link.');
                setValidating(false);
                return;
            }

            try {
                // Verify the password reset code and get user email
                const email = await verifyPasswordResetCode(auth, actionCode);
                setUserEmail(email);
                setIsValidCode(true);
                setStatus('✅ Valid reset link. Please enter your new password.');
            } catch (error) {
                console.error('Error verifying reset code:', error);
                let errorMessage = 'Invalid or expired password reset link.';
                
                switch (error.code) {
                    case 'auth/expired-action-code':
                        errorMessage = '❌ This password reset link has expired. Please request a new one.';
                        break;
                    case 'auth/invalid-action-code':
                        errorMessage = '❌ This password reset link is invalid. Please request a new one.';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = '❌ This user account has been disabled.';
                        break;
                    case 'auth/user-not-found':
                        errorMessage = '❌ No user found for this reset link.';
                        break;
                    default:
                        errorMessage = `❌ ${error.message}`;
                }
                
                setStatus(errorMessage);
                setIsValidCode(false);
            } finally {
                setValidating(false);
            }
        };

        validateResetCode();
    }, [actionCode, mode]);

    const validatePassword = (password) => {
        if (password.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        if (!/(?=.*[a-z])/.test(password)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/(?=.*\d)/.test(password)) {
            return 'Password must contain at least one number';
        }
        return null;
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            setStatus('❌ Please fill in all fields');
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            setStatus(`❌ ${passwordError}`);
            return;
        }

        if (password !== confirmPassword) {
            setStatus('❌ Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Confirm the password reset
            await confirmPasswordReset(auth, actionCode, password);
            setStatus('✅ Password reset successful! Redirecting to login...');
            
            setTimeout(() => {
                navigate('/login', { 
                    state: { 
                        message: 'Password reset successful! Please login with your new password.',
                        email: userEmail 
                    } 
                });
            }, 2000);

        } catch (error) {
            console.error('Error resetting password:', error);
            let errorMessage = 'Failed to reset password. Please try again.';
            
            switch (error.code) {
                case 'auth/expired-action-code':
                    errorMessage = '❌ This password reset link has expired. Please request a new one.';
                    break;
                case 'auth/invalid-action-code':
                    errorMessage = '❌ This password reset link is invalid. Please request a new one.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = '❌ This user account has been disabled.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = '❌ No user found. The account may have been deleted.';
                    break;
                case 'auth/weak-password':
                    errorMessage = '❌ Password is too weak. Please choose a stronger password.';
                    break;
                default:
                    errorMessage = `❌ ${error.message}`;
            }
            
            setStatus(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 6) strength++;
        if (/(?=.*[a-z])/.test(password)) strength++;
        if (/(?=.*[A-Z])/.test(password)) strength++;
        if (/(?=.*\d)/.test(password)) strength++;
        if (/(?=.*[@$!%*?&])/.test(password)) strength++;
        
        if (strength <= 2) return { text: 'Weak', color: 'text-red-500', bg: 'bg-red-200' };
        if (strength <= 3) return { text: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-200' };
        return { text: 'Strong', color: 'text-green-500', bg: 'bg-green-200' };
    };

    if (validating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-700">Validating Reset Link...</h2>
                        <p className="text-gray-500 mt-2">Please wait while we verify your password reset link.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Reset Your Password</h2>
                    {userEmail && (
                        <p className="text-gray-600 mt-2">For account: <span className="font-medium">{userEmail}</span></p>
                    )}
                </div>

                {/* Status message */}
                {status && (
                    <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
                        status.includes('✅') 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : 'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                        {status}
                    </div>
                )}

                {isValidCode ? (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your new password"
                                required
                            />
                            {password && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Password strength:</span>
                                        <span className={`font-medium ${getPasswordStrength(password).color}`}>
                                            {getPasswordStrength(password).text}
                                        </span>
                                    </div>
                                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                                        <div 
                                            className={`h-1 rounded-full transition-all duration-300 ${getPasswordStrength(password).bg}`}
                                            style={{ 
                                                width: `${(getPasswordStrength(password).text === 'Weak' ? 33 : 
                                                          getPasswordStrength(password).text === 'Medium' ? 66 : 100)}%` 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your new password"
                                required
                            />
                            {confirmPassword && password !== confirmPassword && (
                                <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                            )}
                            {confirmPassword && password === confirmPassword && (
                                <p className="mt-1 text-xs text-green-600">✓ Passwords match</p>
                            )}
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h4>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li className={password.length >= 6 ? 'text-green-600' : ''}>
                                    {password.length >= 6 ? '✓' : '•'} At least 6 characters
                                </li>
                                <li className={/(?=.*[a-z])/.test(password) ? 'text-green-600' : ''}>
                                    {/(?=.*[a-z])/.test(password) ? '✓' : '•'} One lowercase letter
                                </li>
                                <li className={/(?=.*[A-Z])/.test(password) ? 'text-green-600' : ''}>
                                    {/(?=.*[A-Z])/.test(password) ? '✓' : '•'} One uppercase letter
                                </li>
                                <li className={/(?=.*\d)/.test(password) ? 'text-green-600' : ''}>
                                    {/(?=.*\d)/.test(password) ? '✓' : '•'} One number
                                </li>
                            </ul>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Resetting Password...
                                </div>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="bg-red-50 p-4 rounded-lg">
                            <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <p className="text-gray-600 mb-4">
                                The password reset link is invalid or has expired.
                            </p>
                        </div>
                        
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-all duration-200"
                        >
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
