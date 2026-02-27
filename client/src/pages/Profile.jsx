import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Layout,
    User,
    Mail,
    Calendar,
    ArrowLeft,
    Edit3,
    Save,
    LogOut,
    Users,
    Clock,
    Search,
    Moon,
    Sun,
    Shield,
    Zap,
    Activity
} from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    const userData = useMemo(() => {
        try {
            const raw = localStorage.getItem('user');
            return raw ? JSON.parse(raw) : { name: 'Guest User', email: 'guest@example.com', createdAt: new Date().toISOString() };
        } catch {
            return { name: 'Guest User', email: 'guest@example.com', createdAt: new Date().toISOString() };
        }
    }, []);

    const [name, setName] = useState(userData.name);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const token = localStorage.getItem('token');
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const res = await fetch(`${API_URL}/api/rooms/recent`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setSessions(data.sessions);
                }
            } catch (error) {
                console.error('Error fetching sessions:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, []);

    const toggleTheme = () => {
        const newTheme = isDarkMode ? 'light' : 'dark';
        setIsDarkMode(!isDarkMode);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark');
    };

    const handleSave = async () => {
        if (name.trim() === userData.name) {
            setIsEditing(false);
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API_URL}/api/auth/update`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                setIsEditing(false);
            } else {
                alert(data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Server error while saving profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const filteredSessions = useMemo(() => {
        return sessions.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.roomId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [sessions, searchTerm]);

    const stats = useMemo(() => {
        const totalParticipants = sessions.reduce((acc, s) => acc + (s.participantCount || 0), 0);
        return [
            { label: 'Boards', value: sessions.length, icon: Layout, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Collaborators', value: totalParticipants, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Streak', value: '3 Days', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
        ];
    }, [sessions]);

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 relative overflow-hidden flex flex-col transition-colors duration-500">
            {/* Dynamic Background Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-[120px] opacity-60"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-blue-100 dark:bg-blue-900/20 rounded-full blur-[120px] opacity-60"></div>

            <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 flex-1">
                {/* Upper Navigation Row */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:border-indigo-200 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-all">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Dashboard
                    </button>

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: User Info & Settings */}
                    <div className="lg:col-span-4 space-y-6">
                        <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[32px] p-8 shadow-xl border border-white/50 dark:border-slate-800/50">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-indigo-500/20">
                                        {name.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-900" title="Online"></div>
                                </div>

                                <div className="space-y-1 w-full">
                                    <div className="flex items-center justify-center gap-2">
                                        {isEditing ? (
                                            <input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="text-xl font-black text-center bg-slate-50 dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-xl px-4 py-1.5 focus:outline-none focus:border-indigo-500 transition-all w-full"
                                                autoFocus
                                            />
                                        ) : (
                                            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{name}</h2>
                                        )}
                                        <button
                                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                            disabled={saving}
                                            className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                                        >
                                            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 flex items-center justify-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" />
                                        {userData.email}
                                    </p>
                                </div>

                                <div className="pt-4 w-full">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all group border border-transparent hover:border-red-200 dark:hover:border-red-900/30"
                                    >
                                        <span className="text-xs font-black uppercase tracking-widest text-red-400 group-hover:text-red-600">Sign Out</span>
                                        <LogOut className="w-4 h-4 text-red-300 group-hover:text-red-500" />
                                    </button>
                                </div>
                            </div>
                        </section>

                    </div>

                    {/* Right Column: Stats & Dynamic History */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            {stats.map((s, i) => (
                                <div key={i} className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-[32px] border border-white/50 dark:border-slate-800/50 shadow-sm flex flex-col items-center justify-center space-y-2 hover:shadow-md transition-all group">
                                    <div className={`w-12 h-12 rounded-2xl ${s.bg} dark:bg-slate-800 ${s.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <s.icon className="w-6 h-6" />
                                    </div>
                                    <div className="text-2xl font-black dark:text-white">{s.value}</div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Search & Sessions */}
                        <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[40px] border border-slate-100 dark:border-slate-800/60 shadow-xl space-y-8 flex-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                        <Calendar className="w-6 h-6 text-indigo-500" />
                                        Session Archive
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Activity Log</p>
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search boards..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-11 pr-6 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all w-full md:w-64"
                                    />
                                </div>
                            </div>

                            {loading ? (
                                <div className="py-24 text-center">
                                    <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-sm font-black uppercase tracking-widest text-slate-400">Loading Archive...</p>
                                </div>
                            ) : filteredSessions.length === 0 ? (
                                <div className="py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px]">
                                    <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No records found {searchTerm && 'for "' + searchTerm + '"'}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {filteredSessions.map((session) => {
                                        const isExpired = session.status === 'expired';
                                        const canJoin = !isExpired;

                                        return (
                                            <div
                                                key={session._id}
                                                className={`group flex flex-col md:flex-row items-center justify-between p-6 rounded-[32px] bg-slate-50/50 dark:bg-slate-800/30 transition-all border border-slate-100 dark:border-slate-800 ${!canJoin ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 cursor-pointer'}`}
                                                onClick={() => canJoin && navigate(`/room/${session.roomId}`)}
                                            >
                                                <div className="flex items-center gap-6 w-full">
                                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 ${isExpired ? 'bg-slate-100 dark:bg-slate-900' : 'bg-white dark:bg-slate-900 shadow-sm group-hover:bg-indigo-600'}`}>
                                                        <Layout className={`w-7 h-7 transition-colors ${isExpired ? 'text-slate-300' : 'text-indigo-500 group-hover:text-white'}`} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`text-xl font-black tracking-tight transition-colors uppercase leading-none ${isExpired ? 'text-slate-400' : 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
                                                                {session.name}
                                                            </div>
                                                            <div className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${isExpired ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-400 border-slate-200 dark:border-slate-800' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 animate-pulse'}`}>
                                                                {isExpired ? 'Expired' : 'Live'}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                                                            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-500" /> {session.participantCount} Participants</span>
                                                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-500" /> {new Date(session.lastActive).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 md:mt-0 w-full md:w-auto">
                                                    <div className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!canJoin ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 border border-transparent' : 'bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600'}`}>
                                                        {isExpired ? 'Expired' : 'Resume'} <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>

            <footer className="p-8 text-center bg-white/50 dark:bg-transparent backdrop-blur-sm border-t border-slate-100 dark:border-slate-800/50">
                <div className="inline-flex items-center gap-2 opacity-30 dark:opacity-20 grayscale hover:grayscale-0 transition-all">
                    <Layout className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Whiteboard Canvas v2.0</span>
                </div>
            </footer>
        </div>
    );
};

export default Profile;
