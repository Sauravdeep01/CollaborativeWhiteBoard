import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, User, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import AuthHero from '../components/AuthHero';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
};

const STRENGTH_META = [
    { label: '', color: 'bg-slate-200' },
    { label: 'Weak', color: 'bg-red-400' },
    { label: 'Fair', color: 'bg-amber-400' },
    { label: 'Good', color: 'bg-amber-400' },
    { label: 'Strong', color: 'bg-emerald-500' }
];

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [shake, setShake] = useState(false);

    const navigate = useNavigate();

    const emailTouched = email.length > 0;
    const emailValid = EMAIL_REGEX.test(email);

    const passwordsMatch = password === confirmPassword;
    const showPasswordMismatch = confirmPassword.length > 0 && !passwordsMatch;
    const showPasswordMatch = confirmPassword.length > 0 && passwordsMatch;

    const strength = getPasswordStrength(password);
    const strengthMeta = STRENGTH_META[strength];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!passwordsMatch) return;
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
            console.error('Signup error:', message);
            setShake(true);
            setTimeout(() => setShake(false), 500);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans text-slate-900">
            <AuthHero />

            <div className="relative flex-1 flex items-center justify-center p-6 md:p-10 overflow-hidden">
                <div className="absolute top-[-15%] right-[-15%] w-[50%] h-[50%] bg-indigo-50 rounded-full blur-3xl" />

                <div className="relative z-10 w-full max-w-sm animate-card-in">
                    <div className="mb-8">
                        <h1 className="text-3xl font-black tracking-tight mb-2">
                            Create your account
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Start collaborating in seconds.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className={`space-y-5 ${shake ? 'animate-shake' : ''}`}>
                        {errorMessage ? (
                            <div className="animate-banner-in flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {errorMessage}
                            </div>
                        ) : null}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                                Full Name
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                                Email address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className={`w-full pl-11 pr-11 py-3.5 bg-slate-50 border rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all shadow-sm ${
                                        emailTouched && !emailValid
                                            ? 'border-red-300 focus:ring-red-400'
                                            : 'border-slate-200 focus:ring-indigo-500'
                                    }`}
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                {emailTouched && (
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                        {emailValid ? (
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-pop" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-red-400" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {password.length > 0 && (
                                <div className="mt-2 ml-1 flex items-center gap-2">
                                    <div className="flex-1 flex gap-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= strength ? strengthMeta.color : 'bg-slate-200'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-400 w-10 text-right">{strengthMeta.label}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                                Confirm Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    aria-invalid={showPasswordMismatch}
                                    className={`w-full pl-11 pr-20 py-3.5 bg-slate-50 border rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm ${
                                        showPasswordMismatch ? 'border-red-400 focus:ring-red-500' : 'border-slate-200'
                                    }`}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                                    {showPasswordMatch && <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-pop" />}
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                            {showPasswordMismatch && (
                                <p className="mt-2 ml-1 text-xs font-semibold text-red-600 animate-banner-in">
                                    Passwords do not match
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={!passwordsMatch || isSubmitting}
                            className={`w-full py-4 rounded-2xl font-semibold shadow-lg shadow-indigo-200 transition-all duration-300 flex items-center justify-center gap-2 group ${
                                !passwordsMatch || isSubmitting
                                    ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                                    : 'bg-linear-to-r from-indigo-600 to-violet-600 text-white hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5 active:scale-[0.98]'
                            }`}
                        >
                            {isSubmitting ? (
                                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign up
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-500 font-medium">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-600 font-bold hover:underline">
                            Log in
                        </Link>
                    </p>

                    <div className="mt-6 text-center">
                        <Link to="/" className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
