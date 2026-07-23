import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Layout, Plus, ArrowRight, User, LogOut, Users, Clock, Calendar,
    Sparkles, Search, Filter, Grid, List, Copy, Check,
    Zap, RefreshCw, Compass, ShieldCheck, Flame, X
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { API_URL } from '../config';

const Dashboard = () => {
    const [roomCode, setRoomCode] = useState('');
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'live' | 'expired'
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [copiedCode, setCopiedCode] = useState(null);

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');

    const navigate = useNavigate();
    const particleCanvasRef = useRef(null);
    const particlesRef = useRef([]);

    const currentUser = useMemo(() => {
        try {
            const raw = localStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }, []);

    const username = currentUser?.name || currentUser?.email?.split('@')[0] || 'Creator';

    const cleanRoomCode = roomCode.trim();
    const canJoin = cleanRoomCode.length > 0;

    // Generate background space stars
    const stars = useMemo(() => {
        const colors = ['#ffffff', '#fde047', '#c084fc', '#ffffff', '#f472b6', '#fef08a'];
        const anims = ['animate-twinkle-1', 'animate-twinkle-2', 'animate-twinkle-3'];

        return Array.from({ length: 70 }).map((_, i) => {
            const top = ((i * 37) % 100);
            const left = ((i * 53) % 100);
            const size = (i % 4) + 1.5;
            const color = colors[i % colors.length];
            const anim = anims[i % anims.length];
            const opacity = 0.35 + ((i % 6) * 0.1);
            return { id: i, top: `${top}%`, left: `${left}%`, size, color, anim, opacity };
        });
    }, []);

    // Interactive Cosmic Stardust Sparkle Particle Engine
    useEffect(() => {
        const canvas = particleCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        const colors = ['#ffffff', '#fde047', '#c084fc', '#f472b6', '#a7f3d0'];
        let animId;

        const handlePointerMove = (e) => {
            for (let i = 0; i < 2; i++) {
                particlesRef.current.push({
                    x: e.clientX + (Math.random() - 0.5) * 8,
                    y: e.clientY + (Math.random() - 0.5) * 8,
                    vx: (Math.random() - 0.5) * 1.2,
                    vy: (Math.random() - 0.5) * 1.2 - 0.3,
                    size: Math.random() * 2.5 + 1.5,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    life: 1.0,
                    maxLife: 1.0,
                    rotation: Math.random() * Math.PI
                });
            }

            if (particlesRef.current.length > 80) {
                particlesRef.current.splice(0, particlesRef.current.length - 80);
            }
        };

        window.addEventListener('pointermove', handlePointerMove, { passive: true });

        const drawStarSparkle = (cx, cy, spikes, outerRadius, innerRadius, color, opacity) => {
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            const step = Math.PI / spikes;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);

            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();

            ctx.fillStyle = color;
            ctx.globalAlpha = opacity;
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.restore();
        };

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const particles = particlesRef.current;

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 45) {
                        const lineOpacity = (1 - dist / 45) * particles[i].life * particles[j].life * 0.4;
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(192, 132, 252, ${lineOpacity})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.022;

                if (p.life > 0) {
                    drawStarSparkle(p.x, p.y, 4, p.size * 2, p.size * 0.6, p.color, p.life);
                }
            }

            particlesRef.current = particles.filter(p => p.life > 0);
            animId = requestAnimationFrame(render);
        };

        animId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('pointermove', handlePointerMove);
            if (animId) cancelAnimationFrame(animId);
        };
    }, []);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setLoading(false);
                    return;
                }
                const res = await fetch(`${API_URL}/api/rooms/recent`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                    return;
                }

                const data = await res.json();
                if (data.success) {
                    setSessions(data.sessions || []);
                }
            } catch (error) {
                console.error('Error fetching sessions:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, [navigate]);

    const handleCreateRoom = () => {
        setNewRoomName('');
        setShowCreateModal(true);
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        if (!newRoomName.trim() || creating) return;

        setCreating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/rooms/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ name: newRoomName.trim() })
            });

            const data = await res.json();
            if (data.success && data.room) {
                setShowCreateModal(false);
                toast.success('Whiteboard created successfully!');
                navigate(`/room/${data.room.roomId}`, {
                    state: { roomName: data.room.name }
                });
            } else {
                toast.error(data.message || 'Failed to create room');
            }
        } catch (error) {
            console.error('Error creating room:', error);
            toast.error('Error creating whiteboard session');
        } finally {
            setCreating(false);
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        const codeToValidate = roomCode.trim();
        if (!codeToValidate || joining) return;

        setJoining(true);
        try {
            const res = await fetch(`${API_URL}/api/rooms/validate/${encodeURIComponent(codeToValidate)}`);
            const data = await res.json();

            if (!res.ok || !data.success) {
                toast.error(data.message || 'Invalid room code. Room does not exist.');
                setJoining(false);
                return;
            }

            toast.success(`Joining ${data.name || 'whiteboard'}...`);
            navigate(`/room/${data.roomId}`);
        } catch (error) {
            console.error('Error validating room code:', error);
            toast.error('Unable to validate room code. Please check your network.');
        } finally {
            setJoining(false);
        }
    };

    const handleCopyRoomId = (roomId, e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(roomId);
        setCopiedCode(roomId);
        toast.success(`Copied room code: ${roomId}`);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setRoomCode(text.trim());
                toast.success('Pasted room code!');
            }
        } catch {
            toast.error('Unable to paste from clipboard');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Filter sessions based on search query & status
    const filteredSessions = useMemo(() => {
        return sessions.filter((s) => {
            const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.roomId?.toLowerCase().includes(searchQuery.toLowerCase());
            const isExpired = s.status === 'expired';

            if (!matchesSearch) return false;
            if (filterStatus === 'live') return !isExpired;
            if (filterStatus === 'expired') return isExpired;
            return true;
        });
    }, [sessions, searchQuery, filterStatus]);

    const activeCount = useMemo(() => sessions.filter(s => s.status !== 'expired').length, [sessions]);

    return (
        <div className="min-h-screen bg-black text-slate-100 font-sans relative transition-colors duration-500 selection:bg-purple-500 selection:text-white overflow-x-hidden">
            
            {/* Pure Black Background & Space Starfield Layer */}
            <div className="pointer-events-none fixed inset-0 z-0 bg-black overflow-hidden">
                
                {/* Twinkling Cosmic Starfield */}
                <div className="absolute inset-0 animate-space-float">
                    {stars.map((star) => (
                        <div
                            key={star.id}
                            className={`absolute rounded-full ${star.anim}`}
                            style={{
                                top: star.top,
                                left: star.left,
                                width: `${star.size}px`,
                                height: `${star.size}px`,
                                backgroundColor: star.color,
                                boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
                                opacity: star.opacity
                            }}
                        />
                    ))}
                </div>

                {/* Subtle Space Dust Grid */}
                <div className="absolute inset-0 bg-grid-pattern-dark opacity-20" />
            </div>

            {/* Interactive Cosmic Stardust & Constellation Particle Canvas */}
            <canvas
                ref={particleCanvasRef}
                className="pointer-events-none fixed inset-0 z-50"
            />

            {/* Main Interactive Dashboard Interface */}
            <div className="relative z-20 mx-auto w-full max-w-7xl px-4 py-6 md:py-10">

                {/* Top Navigation Header Container (Level 1: #0f172a Dark Slate Glass) */}
                <header className="flex items-center justify-between gap-4 p-4 md:px-6 rounded-3xl bg-[#0f172a]/95 text-white border border-slate-800 shadow-2xl backdrop-blur-xl transition-all">
                    <div className="flex items-center gap-3.5">
                        <div className="group relative inline-flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer">
                            <Layout className="w-6 h-6 text-white transform group-hover:rotate-12 transition-transform duration-300" />
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#0f172a]"></span>
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg md:text-xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-pink-300 to-amber-300 bg-clip-text text-transparent">
                                    Whiteboard Live
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-widest border bg-purple-500/20 text-purple-300 border-purple-500/40 font-extrabold">
                                    Pro
                                </span>
                            </div>
                            <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Real-time canvas workspace
                            </div>
                        </div>
                    </div>

                    {/* Header Controls Right */}
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Create Room Primary Button */}
                        <button
                            type="button"
                            onClick={handleCreateRoom}
                            className="px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/30"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                            <span className="hidden sm:inline">New Board</span>
                        </button>

                        {/* Profile Link */}
                        <Link
                            to="/profile"
                            className="p-2.5 rounded-2xl transition-all text-xs font-extrabold flex items-center gap-2 bg-[#1e293b] text-slate-200 border border-slate-700/80 hover:bg-slate-700/80"
                            title="Profile"
                        >
                            <User className="w-4 h-4 text-purple-400" />
                        </Link>

                        {/* Logout Button */}
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="p-2.5 rounded-2xl border transition-all text-xs font-extrabold flex items-center gap-2 bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Hero & Join Section Grid */}
                <main className="mt-8 md:mt-10 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                        
                        {/* Welcome Column Box (Level 1: #0f172a Dark Slate Glass Card) */}
                        <div className="lg:col-span-2 p-8 rounded-3xl bg-[#0f172a]/95 text-white border border-slate-800 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
                            {/* Decorative Corner Glow */}
                            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-purple-600/15 via-pink-600/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>

                            <div>
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold mb-4">
                                    <Sparkles className="w-4 h-4 text-purple-400 animate-bounce" />
                                    <span>Real-Time Canvas Collaboration</span>
                                </div>

                                <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white">
                                    Welcome back,{' '}
                                    <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-amber-300 bg-clip-text text-transparent">
                                        {username}!
                                    </span> 👋
                                </h1>

                                <p className="mt-3 text-sm md:text-base font-semibold text-slate-300 max-w-xl leading-relaxed">
                                    Create a new interactive whiteboard or jump into ongoing team sessions seamlessly.
                                </p>
                            </div>

                            {/* KPI Metrics Chips (Level 2: Elevated #1e293b Cards) */}
                            <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4 pt-6 border-t border-slate-800">
                                <div className="p-4 rounded-2xl bg-[#1e293b] text-white border border-slate-700/80 shadow-md">
                                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                        <Layout className="w-4 h-4 text-purple-400" />
                                        Total Boards
                                    </div>
                                    <div className="text-2xl font-black mt-1 text-white">{sessions.length}</div>
                                </div>

                                <div className="p-4 rounded-2xl bg-[#1e293b] text-white border border-slate-700/80 shadow-md">
                                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                        <Flame className="w-4 h-4 text-emerald-400" />
                                        Active Live
                                    </div>
                                    <div className="text-2xl font-black mt-1 text-emerald-400">{activeCount}</div>
                                </div>

                                <div className="p-4 rounded-2xl bg-[#1e293b] text-white border border-slate-700/80 shadow-md">
                                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                        <Users className="w-4 h-4 text-pink-400" />
                                        Team Ready
                                    </div>
                                    <div className="text-2xl font-black mt-1 text-white">Online</div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Join Room Card Box (Level 1: #0f172a Container) */}
                        <div className="p-8 rounded-3xl bg-[#0f172a]/95 text-white border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25">
                                        <Compass className="w-6 h-6 animate-spin-slow" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 bg-purple-500/15 px-3 py-1 rounded-full border border-purple-500/30">
                                        Instant Access
                                    </span>
                                </div>

                                <h2 className="mt-5 text-xl font-black tracking-tight text-white">Join Existing Room</h2>
                                <p className="mt-1 text-xs text-slate-300 font-semibold">
                                    Enter room code from a teammate to jump straight into action.
                                </p>

                                <form onSubmit={handleJoinRoom} className="mt-5 space-y-4">
                                    <div className="relative">
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
                                            Whiteboard Code
                                        </label>
                                        <div className="relative flex items-center">
                                            <input
                                                type="text"
                                                value={roomCode}
                                                onChange={(e) => setRoomCode(e.target.value)}
                                                className="w-full px-4 py-3.5 pr-20 bg-[#030712] text-white border-2 border-slate-800 focus:border-purple-400 rounded-2xl text-base font-bold placeholder:text-slate-500 focus:outline-none transition-all shadow-inner"
                                                placeholder="e.g. x9k2L1p"
                                            />
                                            <button
                                                type="button"
                                                onClick={handlePasteFromClipboard}
                                                className="absolute right-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl transition-colors shadow-md"
                                                title="Paste room code from clipboard"
                                            >
                                                Paste
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!canJoin || joining}
                                        className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 group ${canJoin && !joining
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-500/25 hover:-translate-y-0.5 active:translate-y-0'
                                                : 'bg-slate-800/80 text-slate-500 font-bold cursor-not-allowed border border-slate-700/80'
                                            }`}
                                    >
                                        {joining ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                                Validating Code...
                                            </>
                                        ) : (
                                            <>
                                                Join Room Now
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                                <span>Room codes are case-insensitive</span>
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            </div>
                        </div>
                    </div>

                    {/* Recent Whiteboard Sessions Container Box (Level 1: #0f172a Container) */}
                    <section className="p-6 md:p-8 rounded-3xl bg-[#0f172a]/95 text-white border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
                        {/* Section Header with Search and Filter Controls */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-purple-400" />
                                    Recent Workspaces
                                </h3>
                                <p className="text-xs md:text-sm text-slate-300 font-semibold">
                                    Jump back into your recent whiteboard collaborations.
                                </p>
                            </div>

                            {/* Search & Layout Control Toolbar */}
                            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                {/* Live Search Input */}
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name or code..."
                                        className="w-full pl-9 pr-8 py-2.5 bg-[#030712] text-white border border-slate-800 rounded-xl text-xs font-bold placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Status Filter Buttons */}
                                <div className="flex items-center p-1 rounded-xl border border-slate-800 bg-[#030712] text-xs font-bold">
                                    {['all', 'live', 'expired'].map((st) => (
                                        <button
                                            key={st}
                                            onClick={() => setFilterStatus(st)}
                                            className={`px-3.5 py-1.5 rounded-lg capitalize font-black transition-all ${filterStatus === st ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>

                                {/* View Switcher (Grid vs List) */}
                                <div className="flex items-center p-1 rounded-xl border border-slate-800 bg-[#030712]">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                        title="Grid View"
                                    >
                                        <Grid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                        title="List View"
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sessions Grid or List Rendering */}
                        {loading ? (
                            <div className="py-20 text-center space-y-3">
                                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                                <div className="text-sm font-black text-slate-400">Loading your board sessions...</div>
                            </div>
                        ) : filteredSessions.length === 0 ? (
                            <div className="py-16 text-center rounded-3xl border-2 border-dashed border-slate-800 bg-[#030712]/60 p-8">
                                <Layout className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <div className="text-base font-black text-white">No whiteboard sessions found</div>
                                <p className="text-xs text-slate-400 font-semibold mt-1 max-w-sm mx-auto">
                                    {searchQuery ? `No rooms matching "${searchQuery}". Try clearing your filter.` : 'Create a new board above to get started with real-time collaboration!'}
                                </p>
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="mt-4 px-4 py-2 bg-purple-600 text-white text-xs font-black rounded-xl hover:bg-purple-500 transition-colors shadow-sm"
                                    >
                                        Reset Search Filter
                                    </button>
                                )}
                            </div>
                        ) : viewMode === 'grid' ? (
                            /* GRID VIEW CARDS (Level 2: Elevated #1e293b Cards) */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredSessions.map((session) => {
                                    const isExpired = session.status === 'expired';
                                    const canOpen = !isExpired;

                                    return (
                                        <div
                                            key={session._id}
                                            onClick={() => canOpen && navigate(`/room/${session.roomId}`)}
                                            className={`group relative p-6 rounded-3xl bg-[#1e293b] text-white border border-slate-700/80 shadow-xl hover:border-purple-500/50 hover:shadow-purple-500/15 transition-all duration-300 flex flex-col justify-between ${canOpen ? 'cursor-pointer hover:-translate-y-1' : 'opacity-65'}`}
                                        >
                                            {/* Top Card Gradient Accent Header */}
                                            <div className={`h-2.5 rounded-t-3xl -mx-6 -mt-6 mb-4 bg-gradient-to-r ${isExpired ? 'from-slate-700 to-slate-800' : 'from-purple-500 via-pink-500 to-amber-500'}`} />

                                            <div>
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <h4 className="text-lg font-black tracking-tight text-white group-hover:text-purple-400 transition-colors line-clamp-1">
                                                        {session.name}
                                                    </h4>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border shrink-0 ${isExpired ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 animate-pulse'}`}>
                                                        {isExpired ? 'Expired' : 'Live'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="text-xs font-mono font-black bg-[#030712] text-purple-300 border border-slate-800 px-2.5 py-1 rounded-lg">
                                                        Code: {session.roomId}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleCopyRoomId(session.roomId, e)}
                                                        className="p-1.5 text-slate-400 hover:text-purple-400 transition-colors border border-slate-700/80 rounded-lg hover:bg-slate-800"
                                                        title="Copy Code"
                                                    >
                                                        {copiedCode === session.roomId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Footer Card Info */}
                                            <div className="pt-4 border-t border-slate-800 space-y-3">
                                                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3.5 h-3.5 text-purple-400" />
                                                        {session.participantCount || 1} participant{session.participantCount !== 1 && 's'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                                                        {new Date(session.lastActive).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={!canOpen}
                                                    onClick={() => canOpen && navigate(`/room/${session.roomId}`)}
                                                    className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md ${canOpen ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20' : 'bg-slate-800/80 text-slate-500 font-bold border border-slate-700/80'}`}
                                                >
                                                    {isExpired ? 'Board Expired' : 'Open Whiteboard'}
                                                    {canOpen && <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* LIST VIEW CARDS (Level 2: Elevated #1e293b Cards) */
                            <div className="space-y-3">
                                {filteredSessions.map((session) => {
                                    const isExpired = session.status === 'expired';
                                    const canOpen = !isExpired;

                                    return (
                                        <div
                                            key={session._id}
                                            onClick={() => canOpen && navigate(`/room/${session.roomId}`)}
                                            className={`p-4 md:p-5 rounded-2xl bg-[#1e293b] text-white border border-slate-700/80 hover:border-purple-500/40 hover:shadow-xl transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${canOpen ? 'cursor-pointer' : 'opacity-65'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isExpired ? 'bg-slate-800 text-slate-500' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`}>
                                                    <Layout className="w-6 h-6" />
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-base font-black tracking-tight text-white">{session.name}</h4>
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${isExpired ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 animate-pulse'}`}>
                                                            {isExpired ? 'Expired' : 'Live'}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1 font-semibold">
                                                        <span className="font-mono font-black bg-[#030712] text-purple-300 border border-slate-800 px-2 py-0.5 rounded text-[11px]">
                                                            Code: {session.roomId}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{session.participantCount || 1} participant(s)</span>
                                                        <span>•</span>
                                                        <span>Active: {new Date(session.lastActive).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleCopyRoomId(session.roomId, e)}
                                                    className="p-2.5 rounded-xl border border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                                    title="Copy Room Link"
                                                >
                                                    {copiedCode === session.roomId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={!canOpen}
                                                    onClick={() => canOpen && navigate(`/room/${session.roomId}`)}
                                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md ${canOpen ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20' : 'bg-slate-800/80 text-slate-500 font-bold border border-slate-700/80'}`}
                                                >
                                                    {isExpired ? 'Expired' : 'Open'}
                                                    {canOpen && <ArrowRight className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </main>
            </div>

            {/* Create Room Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity" onClick={() => setShowCreateModal(false)}></div>
                    <form
                        onSubmit={handleModalSubmit}
                        className="relative w-full max-w-md bg-[#0f172a] text-white border border-slate-800 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200 z-10 space-y-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Plus className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight text-white">Create Whiteboard</h3>
                                <p className="text-xs text-slate-300 font-semibold">Give your session a name to get started.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                                    Whiteboard Name
                                </label>
                                <input
                                    type="text"
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    placeholder="e.g. System Design Architecture..."
                                    className="w-full px-5 py-4 bg-[#030712] text-white border-2 border-slate-800 focus:border-purple-500 rounded-2xl text-sm font-black placeholder:text-slate-500 focus:outline-none transition-all"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-4 bg-[#1e293b] text-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all active:scale-95 border border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-2 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold shadow-purple-500/25 flex items-center justify-center gap-2"
                                >
                                    {creating ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Launch Board'
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
