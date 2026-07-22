import React from 'react';
import { Layout, Users, Zap, MonitorPlay, MousePointer2 } from 'lucide-react';

const CURSORS = [
    { name: 'Maya', color: '#818cf8', top: '22%', left: '18%', anim: 'animate-cursor-1' },
    { name: 'Theo', color: '#34d399', top: '58%', left: '68%', anim: 'animate-cursor-2' },
    { name: 'Ren', color: '#fbbf24', top: '72%', left: '28%', anim: 'animate-cursor-3' }
];

const FEATURES = [
    { icon: Zap, text: 'Draw and sync in real-time, zero lag' },
    { icon: Users, text: 'Unlimited collaborators per board' },
    { icon: MonitorPlay, text: 'Screen sharing built right in' }
];

const AuthHero = () => (
    <div className="relative hidden md:flex flex-col justify-between w-1/2 min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-8 md:p-12 text-white">
        <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '-8s' }} />

        {CURSORS.map((c) => (
            <div
                key={c.name}
                className={`absolute z-10 ${c.anim}`}
                style={{ top: c.top, left: c.left }}
            >
                <MousePointer2 className="w-5 h-5 drop-shadow-lg" style={{ color: c.color, fill: c.color }} />
                <span
                    className="mt-1 inline-block px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-900 shadow-lg"
                    style={{ backgroundColor: c.color }}
                >
                    {c.name}
                </span>
            </div>
        ))}

        <svg viewBox="0 0 320 220" className="absolute inset-0 w-full h-full opacity-70 pointer-events-none">
            <path
                d="M 40 160 C 80 50, 140 230, 180 100 S 270 50, 290 130"
                fill="none"
                stroke="url(#drawGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray="100"
                className="animate-draw-line"
            />
            <defs>
                <linearGradient id="drawGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
            </defs>
        </svg>

        <div className="relative z-10 animate-hero-in">
            <div className="inline-flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                    <Layout className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold tracking-tight">Collaborative Whiteboard</span>
            </div>
        </div>

        <div className="relative z-10 max-w-md animate-hero-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-4xl font-black tracking-tight leading-tight mb-4">
                Turn ideas into action, together.
            </h2>
            <p className="text-slate-300 font-medium leading-relaxed mb-8">
                A real-time whiteboard where your whole team draws, chats, and shares screens in the same space — no matter where they are.
            </p>
            <ul className="space-y-3">
                {FEATURES.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-3 text-sm font-medium text-slate-200">
                        <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-indigo-300" />
                        </span>
                        {text}
                    </li>
                ))}
            </ul>
        </div>

        <div className="relative z-10" />
    </div>
);

export default AuthHero;
