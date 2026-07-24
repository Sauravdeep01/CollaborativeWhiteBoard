import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Layout, ArrowRight, PenTool, MousePointer2, Shapes, RotateCcw,
    MessageSquare, ImagePlus, Link2, History, Moon
} from 'lucide-react';

const CURSORS = [
    { name: 'Maya', color: '#818cf8', top: '18%', left: '10%', anim: 'animate-cursor-1' },
    { name: 'Theo', color: '#34d399', top: '72%', left: '80%', anim: 'animate-cursor-2' },
    { name: 'Ren', color: '#fbbf24', top: '15%', left: '84%', anim: 'animate-cursor-3' }
];

const FEATURES = [
    { icon: PenTool, title: 'Real-time drawing', desc: 'Strokes sync instantly across everyone in the room, no lag.' },
    { icon: MousePointer2, title: 'Live cursors', desc: 'See exactly where teammates are pointing and drawing, in real time.' },
    { icon: Shapes, title: 'Shapes & tools', desc: 'Pencil, eraser, rectangles, circles, triangles, lines, adjustable brush size and opacity.' },
    { icon: RotateCcw, title: 'Undo/redo, synced', desc: 'Undo and redo apply for everyone in the room, not just you.' },
    { icon: MessageSquare, title: 'Built-in chat', desc: 'A chat panel alongside the board for discussing without leaving the canvas.' },
    { icon: ImagePlus, title: 'Image uploads', desc: 'Drop images straight onto the canvas and annotate over them.' },
    { icon: Link2, title: 'Shareable room codes', desc: 'Create a board and invite others with a simple room code, no setup.' },
    { icon: History, title: 'Session history', desc: 'Recent boards are saved so you can pick up where you left off.' },
    { icon: Moon, title: 'Dark mode', desc: 'Full dark theme support in the board itself.' }
];

const Home = () => {
    const [featuresVisible, setFeaturesVisible] = useState(false);
    const featuresRef = useRef(null);

    useEffect(() => {
        const el = featuresRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setFeaturesVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="bg-white font-sans text-slate-900">
            <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-4 bg-linear-to-br from-indigo-400 via-violet-400 to-fuchsia-400">
                <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{ backgroundImage: 'radial-gradient(#1e1b4b 1px, transparent 1px)', backgroundSize: '28px 28px' }}
                />
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/20 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '-8s' }} />

                <svg
                    className="absolute bottom-0 left-0 w-full h-20 md:h-28 text-white"
                    viewBox="0 0 1440 120"
                    fill="currentColor"
                    preserveAspectRatio="none"
                >
                    <path d="M0,40 C360,100 1080,0 1440,60 L1440,120 L0,120 Z" />
                </svg>

                {CURSORS.map((c) => (
                    <div key={c.name} className={`hidden md:block absolute z-10 ${c.anim}`} style={{ top: c.top, left: c.left }}>
                        <MousePointer2 className="w-5 h-5 drop-shadow-lg" style={{ color: c.color, fill: c.color }} />
                        <span
                            className="mt-1 inline-block px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-900 shadow-lg"
                            style={{ backgroundColor: c.color }}
                        >
                            {c.name}
                        </span>
                    </div>
                ))}

                <div className="z-10 max-w-2xl animate-card-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl border border-slate-100 mb-8 animate-bounce-slow">
                        <Layout className="w-10 h-10 text-black" />
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900">
                        Collaborate without{' '}
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-700 to-orange-600">limits</span>.
                    </h1>

                    <p className="text-xl text-slate-800 mb-12 leading-relaxed max-w-lg mx-auto font-medium">
                        The ultra-fast, real-time whiteboard dedicated to teams who want to build amazing things together.
                    </p>

                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-900/30 hover:shadow-2xl hover:-translate-y-1 transition-all group"
                    >
                        Get Started
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>

            <section ref={featuresRef} className="relative bg-white max-w-6xl mx-auto px-4 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Everything your team needs</h2>
                    <p className="text-slate-500 font-medium max-w-xl mx-auto">
                        One board, every tool — built for teams that think out loud together.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                        <div
                            key={title}
                            className={`group p-7 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 hover:-translate-y-1 transition-all duration-500 ${
                                featuresVisible ? 'animate-card-in' : 'opacity-0'
                            }`}
                            style={{ animationDelay: featuresVisible ? `${i * 80}ms` : '0ms' }}
                        >
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5 group-hover:bg-indigo-600 transition-colors duration-500">
                                <Icon className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-500" />
                            </div>
                            <h3 className="text-base font-bold tracking-tight mb-2">{title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="relative px-4 py-20 bg-linear-to-b from-white via-indigo-50 to-violet-100">
                <div className="max-w-4xl mx-auto rounded-[40px] bg-linear-to-br from-slate-950 via-indigo-950 to-violet-950 p-12 md:p-16 text-center text-white overflow-hidden relative">
                    <div
                        className="absolute inset-0 opacity-[0.07]"
                        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
                    />
                    <h2 className="relative text-3xl md:text-4xl font-black tracking-tight mb-4">Ready to build together?</h2>
                    <p className="relative text-slate-300 font-medium mb-8 max-w-md mx-auto">
                        Jump into a board in seconds. No downloads, no setup.
                    </p>
                    <Link
                        to="/login"
                        className="relative inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg shadow-xl hover:-translate-y-1 transition-all group"
                    >
                        Get Started
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>

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
