import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Plus, ArrowRight, User, LogOut, Users, Clock, Calendar } from 'lucide-react';
import { nanoid } from 'nanoid';

const Dashboard = () => {
    const [roomCode, setRoomCode] = useState('');
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const currentUser = useMemo(() => {
        try {
            const raw = localStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }, []);

    const username = currentUser?.name || currentUser?.email || 'there';

    const normalizedRoomCode = roomCode.trim();
    const canJoin = normalizedRoomCode.length > 0;

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const token = localStorage.getItem('token');
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const res = await fetch(`${API_URL}/api/rooms/recent`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
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

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');

    const handleCreateRoom = () => {
        setShowCreateModal(true);
    };

    const handleModalSubmit = (e) => {
        e.preventDefault();
        if (!newRoomName.trim()) return;
        const id = nanoid(10);
        navigate(`/room/${id}`, { state: { roomName: newRoomName.trim() } });
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (!canJoin) return;
        navigate(`/room/${normalizedRoomCode}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-blue-50 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute bottom-[-25%] right-[-10%] w-[55%] h-[55%] bg-indigo-50 rounded-full blur-3xl opacity-60"></div>

            <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
                <header className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="inline-flex items-center justify-center w-11 h-11 bg-white rounded-2xl shadow-md border border-slate-100">
                            <Layout className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <div className="text-sm font-extrabold tracking-tight">Whiteboard</div>
                            <div className="text-xs text-slate-500 font-medium">Real-time collaboration</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCreateRoom}
                            className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold shadow-lg shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create Room
                        </button>

                        <Link
                            to="/profile"
                            className="px-3 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 active:scale-[0.98] transition-all inline-flex items-center gap-2"
                        >
                            <User className="w-4 h-4" />
                            Profile
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="px-3 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 active:scale-[0.98] transition-all inline-flex items-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </header>

                <main className="mt-10 sm:mt-14">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            Welcome back, <span className="text-blue-600">{username}</span>
                        </h1>
                        <p className="mt-2 text-slate-600 font-medium">
                            Start a new whiteboard or join an existing room.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <section className="bg-white/80 backdrop-blur-xl rounded-3xl p-7 shadow-2xl border border-white/40 hover:shadow-3xl transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="inline-flex items-center justify-center w-11 h-11 bg-slate-50 rounded-2xl border border-slate-200">
                                        <Plus className="w-5 h-5 text-slate-900" />
                                    </div>
                                    <h2 className="mt-5 text-lg font-extrabold tracking-tight">Create New Whiteboard</h2>
                                    <p className="mt-1.5 text-sm text-slate-500 font-medium max-w-sm">
                                        Spin up a room instantly and invite your team to collaborate.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleCreateRoom}
                                className="mt-6 w-full py-3.5 bg-slate-900 text-white rounded-2xl font-semibold shadow-lg shadow-slate-200 hover:bg-black hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 group"
                            >
                                Create Room
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <p className="mt-3 text-xs text-slate-500 font-medium">
                                You’ll get a shareable room code.
                            </p>
                        </section>

                        <section className="bg-white/80 backdrop-blur-xl rounded-3xl p-7 shadow-2xl border border-white/40">
                            <div className="inline-flex items-center justify-center w-11 h-11 bg-slate-50 rounded-2xl border border-slate-200">
                                <ArrowRight className="w-5 h-5 text-slate-900" />
                            </div>
                            <h2 className="mt-5 text-lg font-extrabold tracking-tight">Join Existing Room</h2>
                            <p className="mt-1.5 text-sm text-slate-500 font-medium max-w-sm">
                                Enter a room code to join an active whiteboard session.
                            </p>

                            <form onSubmit={handleJoinRoom} className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                                        Room Code
                                    </label>
                                    <input
                                        type="text"
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-sm"
                                        placeholder="Enter room code"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!canJoin}
                                    className={`w-full py-3.5 rounded-2xl font-semibold shadow-lg shadow-slate-200 transition-all inline-flex items-center justify-center gap-2 group ${canJoin
                                        ? 'bg-slate-900 text-white hover:bg-black hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]'
                                        : 'bg-slate-300 text-slate-600 cursor-not-allowed'
                                        }`}
                                >
                                    Join Room
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>

                            <p className="mt-3 text-xs text-slate-500 font-medium">
                                Tip: Room codes are case-insensitive.
                            </p>
                        </section>
                    </div>

                    <section className="mt-10 mb-10 bg-white/70 backdrop-blur-xl rounded-[40px] p-10 shadow-xl border border-white/40">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Recent Sessions</h3>
                                <p className="text-sm text-slate-500 font-medium">Pick up where you left off with your team.</p>
                            </div>
                            <div className="px-4 py-1.5 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {sessions.length} Boards
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center animate-pulse">
                                <div className="text-sm font-bold text-slate-400">Syncing with server...</div>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="py-20 text-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                                <div className="text-slate-400 font-bold">No recent boards found.</div>
                                <p className="text-xs text-slate-500 mt-1">Start by creating your first collaboration room!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                {sessions.map((session) => {
                                    const isCreator = currentUser && session.creatorId &&
                                        (session.creatorId === currentUser.id || session.creatorId._id === currentUser.id);
                                    const isExpired = session.status === 'expired';
                                    const canJoin = !isExpired;

                                    return (
                                        <div
                                            key={session._id}
                                            className={`group p-6 rounded-[32px] bg-white border border-slate-100 hover:border-indigo-500/30 shadow-sm transition-all flex flex-col sm:flex-row items-center justify-between gap-6 ${!canJoin ? 'opacity-70 grayscale-[0.5]' : 'hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1'}`}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-500 ${isExpired ? 'bg-slate-100' : 'bg-indigo-50 group-hover:bg-indigo-500'}`}>
                                                    <Layout className={`w-6 h-6 transition-colors ${isExpired ? 'text-slate-400' : 'text-indigo-500 group-hover:text-white'}`} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`text-lg font-black tracking-tight transition-colors ${isExpired ? 'text-slate-500' : 'group-hover:text-indigo-600'}`}>{session.name}</div>
                                                        <div className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${isExpired ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200 animate-pulse'}`}>
                                                            {isExpired ? 'Expired' : 'Live'}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                        <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-indigo-500" /> {session.participantCount} participants</div>
                                                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-indigo-500" /> {new Date(session.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                        <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-500" /> {new Date(session.lastActive).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <button
                                                    type="button"
                                                    disabled={!canJoin}
                                                    onClick={() => navigate(`/room/${session.roomId}`)}
                                                    className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg ${!canJoin
                                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                        : 'bg-slate-900 text-white hover:bg-indigo-600 active:scale-95 hover:shadow-indigo-500/20'}`}
                                                >
                                                    {isExpired ? 'Expired' : 'Open Board'}
                                                </button>
                                                {!canJoin && (
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Board Closed</span>
                                                )}
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
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateModal(false)}></div>
                    <form
                        onSubmit={handleModalSubmit}
                        className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                <Plus className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Name Your Board</h3>
                                <p className="text-sm text-slate-500 font-medium">What are you working on today?</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                                    Whiteboard Name
                                </label>
                                <input
                                    type="text"
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    placeholder="e.g. Design Architecture, Brainstorming..."
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all shadow-sm"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-2 px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-500/10"
                                >
                                    Launch Board
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
