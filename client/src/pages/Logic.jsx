import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Cpu, Globe, Zap, Layers, Share2, MousePointer2, Settings, ShieldCheck, Code2 } from 'lucide-react';

const Logic = () => {
    const navigate = useNavigate();

    const techStack = [
        { name: 'React 18', desc: 'Atomic state management for low-latency drawing events.', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-50' },
        { name: 'Socket.IO', desc: 'Real-time bidirectional event pipeline for instant syncing.', icon: Share2, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { name: 'Canvas API', desc: 'High-performance pixel rendering with hardware acceleration.', icon: Layers, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { name: 'Express JIT', desc: 'Just-in-time event broadcasting with optimized room scaling.', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
    ];

    const logicFlows = [
        {
            title: 'Stroke Virtualization',
            desc: 'Drawing actions are converted into JSON stroke data objects. These objects contain point matrices, color hexes, and brush dynamics. This allows for lossless undo/redo and perfectly synced peer rendering.',
            icon: MousePointer2
        },
        {
            title: 'Conflict Resolution',
            desc: 'Socket.IO rooms handle concurrent drawing. Last-write-wins (LWW) resolution ensures that even with 50+ users, the whiteboard remains a single source of truth without desyncing canvas buffers.',
            icon: ShieldCheck
        },
        {
            title: 'Media Stream Routing',
            desc: 'Screen sharing uses native getDisplayMedia coupled with P2P-ready signaling. The video stream is processed as a dynamic canvas background, allowing real-time annotations on top of live broadcasts.',
            icon: Share2
        }
    ];

    return (
        <div className="min-h-screen bg-[#0f111a] font-sans text-slate-200 relative overflow-hidden flex flex-col selection:bg-indigo-500/30">
            {/* Matrix Background Effect */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,#0f111a_100%)]"></div>
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
            </div>

            <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-12 flex-1">
                {/* Navigation */}
                <button
                    onClick={() => navigate(-1)}
                    className="group mb-12 flex items-center gap-2 text-xs font-black tracking-widest uppercase text-slate-500 hover:text-indigo-400 transition-all"
                >
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-all group-hover:scale-110">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    System Protocol
                </button>

                <header className="mb-20 space-y-6">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Cpu className="w-4 h-4 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Engine Logic v2.0.4</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-none">
                        How Whiteboard <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400">Processes Reality.</span>
                    </h1>
                    <p className="max-w-xl text-slate-500 font-medium leading-relaxed">
                        A deep dive into the collaborative engine powering your whiteboard. From low-level canvas rendering to real-time event virtualization.
                    </p>
                </header>

                {/* Core Stack Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
                    {techStack.map((tech, i) => (
                        <div key={i} className="group relative p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all hover:bg-white/[0.04] overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
                            <tech.icon className={`w-10 h-10 mb-6 ${tech.color} transition-transform group-hover:scale-110 duration-500`} />
                            <h3 className="text-sm font-black text-white mb-2 uppercase tracking-widest">{tech.name}</h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{tech.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Detailed Logic Sections */}
                <div className="space-y-32 mb-20">
                    {logicFlows.map((flow, i) => (
                        <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-24`}>
                            <div className="flex-1 space-y-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 rotate-6">
                                    <flow.icon className="w-7 h-7 text-white" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{flow.title}</h2>
                                <p className="text-slate-400 font-medium leading-loose text-sm md:text-base">
                                    {flow.desc}
                                </p>
                                <div className="pt-4 flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">Latency</span>
                                        <span className="text-sm font-bold text-white">&lt; 15ms</span>
                                    </div>
                                    <div className="w-px h-8 bg-white/10"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">Packet Sync</span>
                                        <span className="text-sm font-bold text-white">Lossless</span>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Tech Graphic */}
                            <div className="flex-1 w-full max-w-[400px]">
                                <div className="aspect-square relative rounded-[48px] bg-gradient-to-br from-indigo-500/10 to-transparent border border-white/10 flex items-center justify-center group overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                                    <div className="w-[80%] h-[80%] rounded-[40px] border border-white/5 bg-black/40 shadow-2xl backdrop-blur-3xl flex flex-col p-6 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                            <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                                            <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                                        </div>
                                        <div className="flex-1 rounded-2xl bg-white/5 border border-white/5 p-4 overflow-hidden font-mono text-[10px] text-indigo-300">
                                            <div className="animate-pulse">
                                                <span className="text-indigo-500">const</span> stroke_id = <span className="text-emerald-400">"act_8291"</span>;<br />
                                                <span className="text-indigo-500">socket</span>.emit(<span className="text-emerald-400">'draw'</span>, &#123;<br />
                                                &nbsp;&nbsp;type: <span className="text-amber-400">'pencil'</span>,<br />
                                                &nbsp;&nbsp;pts: [<span className="text-violet-400">x: 104, y: 88...</span>],<br />
                                                &nbsp;&nbsp;sync: <span className="text-indigo-500">true</span><br />
                                                &#125;);
                                            </div>
                                        </div>
                                    </div>
                                    {/* Decorative orbital rings */}
                                    <div className="absolute w-[120%] h-[120%] border border-indigo-500/10 rounded-full animate-[spin_20s_linear_infinite]"></div>
                                    <div className="absolute w-[140%] h-[140%] border border-white/5 rounded-full animate-[spin_30s_linear_infinite_reverse]"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA Section */}
                <section className="mt-40 p-12 rounded-[48px] bg-white text-slate-900 flex flex-col items-center text-center space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <Code2 className="w-12 h-12 text-indigo-600 mb-2" />
                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter">Ready to build your masterpiece?</h2>
                    <p className="max-w-sm text-slate-500 font-medium">Experience the logic in action by creating a collaborative whiteboard right now.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-10 py-4 bg-slate-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:-translate-y-1 active:translate-y-0 transition-all shadow-xl shadow-slate-200"
                    >
                        Launch Dashboard
                    </button>
                </section>
            </div>

            <footer className="p-12 border-t border-white/5 text-center mt-20">
                <div className="flex items-center justify-center gap-10 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Hardware Accel</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sub-15ms Sync</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">SVG Vectorization</span>
                </div>
            </footer>
        </div>
    );
};

export default Logic;
