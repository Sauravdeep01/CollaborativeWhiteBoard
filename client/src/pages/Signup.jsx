import React, { useState } from 'react';
import { Mail, Lock, UserPlus, ArrowRight, Layout, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const passwordsMatch = password === confirmPassword;
    const showPasswordMismatch = confirmPassword.length > 0 && !passwordsMatch;

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
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden font-sans text-slate-900">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

            <div className="w-full max-w-md z-10">
                {/* Logo & Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl mb-6 border border-slate-100">
                        <Layout className="w-8 h-8 text-black" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        Create an account
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Start collaborating in seconds
                    </p>
                </div>

                {/* Signup Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errorMessage ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                {errorMessage}
                            </div>
                        ) : null}
                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                                Full Name
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-black transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-sm"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                                Email address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-black transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-sm"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-black transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                                Confirm Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-black transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    aria-invalid={showPasswordMismatch}
                                    className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-sm ${
                                        showPasswordMismatch ? 'border-red-400 focus:ring-red-500' : 'border-slate-200'
                                    }`}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            {showPasswordMismatch && (
                                <p className="mt-2 ml-1 text-xs font-semibold text-red-600">
                                    Passwords do not match
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!passwordsMatch}
                            className={`w-full py-4 rounded-2xl font-semibold shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 group ${
                                !passwordsMatch || isSubmitting
                                    ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                                    : 'bg-slate-900 text-white hover:bg-black active:scale-[0.98]'
                            }`}
                        >
                            {isSubmitting ? 'Signing up…' : 'Sign up'}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
