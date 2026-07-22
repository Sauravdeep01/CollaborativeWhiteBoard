import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, Layout, User, Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getPasswordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0-4
};

const STRENGTH_META = [
    { label: 'Too weak', color: 'bg-red-500', text: 'text-red-600' },
    { label: 'Weak', color: 'bg-red-500', text: 'text-red-600' },
    { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600' },
    { label: 'Good', color: 'bg-lime-500', text: 'text-lime-600' },
    { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' },
];

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);
    const [shake, setShake] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const passwordsMatch = password === confirmPassword;
    const showPasswordMismatch = confirmPassword.length > 0 && !passwordsMatch;
    const showPasswordMatch = confirmPassword.length > 0 && passwordsMatch;

    const emailValid = EMAIL_REGEX.test(email);
    const showEmailError = emailTouched && email.length > 0 && !emailValid;

    const strength = getPasswordStrength(password);
    const strengthMeta = STRENGTH_META[strength];

    useEffect(() => {
        const handleMove = (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            setTilt({ x, y });
        };
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, []);

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!passwordsMatch) {
            triggerShake();
            return;
        }
        setErrorMessage('');
        setIsSubmitting(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/register`, {
                name,
                email,
                password
            });

            const { token, user } = res.data || {};
            if (!token) {
                throw new Error('No token returned from server');
            }

            localStorage.setItem('token', token);
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
            }

            navigate('/dashboard');
        } catch (error) {
            const message = error?.response?.data?.message || error.message || 'Signup failed';
            setErrorMessage(message);
            triggerShake();
            console.error('Signup error:', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden font-sans text-slate-900">
            {/* Background decorative elements — drift + cursor reactive */}
            <div
                className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-200 rounded-full blur-3xl opacity-50 animate-blob will-change-transform"
                style={{ transform: `translate(${tilt.x * 20}px, ${tilt.y * 20}px)` }}
            />
            <div
                className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-200 rounded-full blur-3xl opacity-50 animate-blob will-change-transform"
                style={{ transform: `translate(${tilt.x * -25}px, ${tilt.y * -25}px)`, animationDelay: '-6s' }}
            />
            <div
                className="absolute top-[35%] left-[12%] w-[25%] h-[25%] bg-sky-200 rounded-full blur-3xl opacity-40 animate-blob will-change-transform"
                style={{ transform: `translate(${tilt.x * 15}px, ${tilt.y * -15}px)`, animationDelay: '-12s' }}
            />

            <div className="w-full max-w-md z-10 animate-card-in">
                {/* Logo & Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl mb-6 border border-slate-100 group transition-all duration-300 hover:scale-110 hover:shadow-2xl">
                        <Layout className="w-8 h-8 text-black group-hover:rotate-12 transition-transform" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        Create an account
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Start collaborating in seconds
                    </p>
                </div>

                {/* Signup Card */}
                <div className={`bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40 ${shake ? 'animate-shake' : ''}`}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errorMessage ? (
                            <div
                                role="alert"
                                className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 animate-banner-in"
                            >
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        ) : null}
                        {/* Name Field */}
                        <div>
                            <label htmlFor="signup-name" className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                                Full Name
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-black transition-colors" />
                                </div>
                                <input
                                    id="signup-name"
                                    type="text"
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all duration-200 shadow-sm hover:border-slate-300"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="signup-email" className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                                Email address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className={`h-5 w-5 transition-colors ${showEmailError ? 'text-red-400' : 'text-slate-400 group-focus-within:text-black'}`} />
                                </div>
                                <input
                                    id="signup-email"
                                    type="email"
                                    required
                                    aria-invalid={showEmailError}
                                    className={`w-full pl-11 pr-11 py-3.5 bg-slate-50 border rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 shadow-sm hover:border-slate-300 ${
                                        showEmailError
                                            ? 'border-red-300 focus:ring-red-400'
                                            : 'border-slate-200 focus:ring-slate-900'
                                    }`}
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onBlur={() => setEmailTouched(true)}
                                />
                                {emailValid && (
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 animate-pop">
                                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                                        </span>
                                    </div>
                                )}
                            </div>
                            {showEmailError && (
                                <p className="mt-2 ml-1 text-xs font-semibold text-red-600 animate-banner-in">
                                    Please enter a valid email address
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="signup-password" className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-black transition-colors" />
                                </div>
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all duration-200 shadow-sm hover:border-slate-300"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-900 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {/* Password strength indicator */}
                            {password.length > 0 && (
                                <div className="mt-3 ml-1 animate-banner-in">
                                    <div className="flex gap-1.5">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                                    i < strength ? strengthMeta.color : 'bg-slate-200'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`mt-1.5 text-xs font-semibold ${strengthMeta.text}`}>
                                        Password strength: {strengthMeta.label}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="signup-confirm" className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                                Confirm Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-black transition-colors" />
                                </div>
                                <input
                                    id="signup-confirm"
                                    type={showConfirm ? 'text' : 'password'}
                                    required
                                    aria-invalid={showPasswordMismatch}
                                    className={`w-full pl-11 pr-20 py-3.5 bg-slate-50 border rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 shadow-sm ${
                                        showPasswordMismatch
                                            ? 'border-red-400 focus:ring-red-500'
                                            : showPasswordMatch
                                                ? 'border-emerald-400 focus:ring-emerald-500'
                                                : 'border-slate-200 focus:ring-slate-900 hover:border-slate-300'
                                    }`}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                                    {confirmPassword.length > 0 && (
                                        showPasswordMatch ? (
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 animate-pop">
                                                <Check className="h-3 w-3 text-white" strokeWidth={3} />
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 animate-pop">
                                                <X className="h-3 w-3 text-white" strokeWidth={3} />
                                            </span>
                                        )
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm((v) => !v)}
                                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                        className="flex items-center text-slate-400 hover:text-slate-900 transition-colors"
                                    >
                                        {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                            {showPasswordMismatch && (
                                <p className="mt-2 ml-1 text-xs font-semibold text-red-600 animate-banner-in">
                                    Passwords do not match
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!passwordsMatch || isSubmitting}
                            className={`w-full py-4 rounded-2xl font-semibold shadow-lg shadow-slate-200 transition-all duration-200 flex items-center justify-center gap-2 group ${
                                !passwordsMatch || isSubmitting
                                    ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                                    : 'bg-slate-900 text-white hover:bg-black hover:shadow-xl active:scale-[0.98]'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                    Signing up…
                                </>
                            ) : (
                                <>
                                    Sign up
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-8 border-t border-slate-100"></div>

                    {/* Login Link */}
                    <p className="text-center text-sm text-slate-500 font-medium">
                        Already have an account?{' '}
                        <Link to="/login" className="text-slate-900 font-bold hover:underline">
                            Log in
                        </Link>
                    </p>
                </div>

                <div className="mt-8 text-center">
                    <Link to="/" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
