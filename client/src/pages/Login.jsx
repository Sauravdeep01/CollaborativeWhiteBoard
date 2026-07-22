import React, { useState } from 'react';
import { Mail, Lock, LogIn, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import AuthHero from '../components/AuthHero';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [shake, setShake] = useState(false);

    const navigate = useNavigate();

    const emailTouched = email.length > 0;
    const emailValid = EMAIL_REGEX.test(email);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsSubmitting(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, {
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
            const message = error?.response?.data?.message || error.message || 'Login failed';
            setErrorMessage(message);
            console.error('Login error:', message);
            setShake(true);
            setTimeout(() => setShake(false), 500);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans">
            <AuthHero />

            <div className="relative flex-1 flex items-center justify-center p-6 sm:p-10 overflow-hidden">
                <div className="absolute top-[-15%] right-[-15%] w-[50%] h-[50%] bg-indigo-50 rounded-full blur-3xl" />

                <div className="relative z-10 w-full max-w-sm animate-card-in">
                    <div className="mb-10">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                            Welcome back
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Log in to jump back into your boards.
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
                                Email address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className={`w-full pl-11 pr-11 py-3.5 bg-slate-50 border rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all shadow-sm ${
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
                            <div className="flex justify-between items-center mb-2 px-1">
                                <label className="text-sm font-semibold text-slate-700">
                                    Password
                                </label>
                                <a href="#" className="text-xs font-bold text-indigo-600 hover:underline">
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
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
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-4 rounded-2xl font-semibold shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group ${
                                isSubmitting
                                    ? 'bg-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5'
                            }`}
                        >
                            {isSubmitting ? (
                                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Log in
                                    <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-500 font-medium">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-indigo-600 font-bold hover:underline">
                            Sign up
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

export default Login;
