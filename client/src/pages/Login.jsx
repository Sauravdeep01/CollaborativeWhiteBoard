import React, { useState } from 'react';
import { Layout, Mail, Lock, LogIn, ArrowRight, Github } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden font-sans">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

            <div className="w-full max-w-md z-10">
                {/* Logo & Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl mb-6 border border-slate-100 group transition-all duration-300 hover:scale-110">
                        <Layout className="w-8 h-8 text-black group-hover:rotate-12 transition-transform" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                        Collaborative Whiteboard
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Real-time collaboration made simple
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40">
                    <div className="mb-8 text-left">
                        <h2 className="text-xl font-semibold text-slate-800">Welcome Back</h2>
                        <p className="text-slate-500 text-sm mt-1">Please enter your details to sign in</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errorMessage ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                {errorMessage}
                            </div>
                        ) : null}
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
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-sm"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <div className="flex justify-between items-center mb-2 px-1">
                                <label className="text-sm font-semibold text-slate-700">
                                    Password
                                </label>
                                <a href="#" className="text-xs font-bold text-slate-900 hover:underline">
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-black transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-4 rounded-2xl font-semibold shadow-lg shadow-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group ${
                                isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-black'
                            }`}
                        >
                            {isSubmitting ? 'Logging in…' : 'Log in'}
                            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-8 border-t border-slate-100"></div>

                    {/* Sign Up Link */}
                    <p className="text-center text-sm text-slate-500 font-medium">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-slate-900 font-bold hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>

                {/* Footer Links */}
                <div className="mt-8 text-center space-y-4">
                    <p className="text-xs text-slate-400 px-6">
                        By continuing, you agree to our{' '}
                        <a href="#" className="underline decoration-slate-200 hover:text-slate-600 transition-colors">Terms of Service</a> and{' '}
                        <a href="#" className="underline decoration-slate-200 hover:text-slate-600 transition-colors">Privacy Policy</a>
                    </p>
                    <div>
                        <Link to="/" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors flex items-center justify-center gap-1 group">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
