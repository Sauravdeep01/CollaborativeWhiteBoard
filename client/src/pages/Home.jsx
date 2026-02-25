import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, ArrowRight } from 'lucide-react';

const Home = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-4 text-center font-sans overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-50 rounded-full blur-3xl opacity-60"></div>

            <div className="z-10 max-w-2xl px-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl border border-slate-100 mb-8 animate-bounce-slow">
                    <Layout className="w-10 h-10 text-black" />
                </div>

                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6">
                    Collaborate without <span className="text-blue-600">limits</span>.
                </h1>

                <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-lg mx-auto">
                    The ultra-fast, real-time whiteboard dedicated to teams who want to build amazing things together.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/login"
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 hover:bg-black hover:-translate-y-1 transition-all flex items-center gap-2 group w-full sm:w-auto"
                    >
                        Get Started
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <button className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all w-full sm:w-auto">
                        View Demo
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default Home;
