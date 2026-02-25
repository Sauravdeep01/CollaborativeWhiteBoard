import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout, Plus, ArrowRight, User, LogOut } from 'lucide-react';

const Dashboard = () => {
    const [roomCode, setRoomCode] = useState('');

    const username = useMemo(() => {
        try {
            const raw = localStorage.getItem('user');
            if (!raw) return 'there';
            const user = JSON.parse(raw);
            return user?.name || user?.email || 'there';
        } catch {
            return 'there';
        }
    }, []);

    const normalizedRoomCode = roomCode.trim();
    const canJoin = normalizedRoomCode.length > 0;

    const handleCreateRoom = () => {
        console.log('Create room clicked');
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (!canJoin) return;
        console.log('Join room clicked:', { roomCode: normalizedRoomCode });
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
                            to="#"
                            className="px-3 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 active:scale-[0.98] transition-all inline-flex items-center gap-2"
                        >
                            <User className="w-4 h-4" />
                            Profile
                        </Link>

                        <button
                            type="button"
                            onClick={() => console.log('Logout clicked')}
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
                                    className={`w-full py-3.5 rounded-2xl font-semibold shadow-lg shadow-slate-200 transition-all inline-flex items-center justify-center gap-2 group ${
                                        canJoin
                                            ? 'bg-slate-900 text-white hover:bg-black hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]'
                                            : 'bg-slate-300 text-slate-600 cursor-not-allowed'
                                    }`}
                                >
                                    Join Room
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>

                            <p className="mt-3 text-xs text-slate-500 font-medium">
                                Tip: Room codes are case-insensitive (you can normalize later).
                            </p>
                        </section>
                    </div>

                    <section className="mt-10 bg-white/70 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/40">
                        <h3 className="text-base font-extrabold tracking-tight">Recent Sessions</h3>
                        <p className="mt-1 text-sm text-slate-500 font-medium">
                            This will show saved boards from MongoDB later.
                        </p>

                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 3 }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                                >
                                    <div className="text-sm font-extrabold">Board #{idx + 1}</div>
                                    <div className="mt-1 text-xs text-slate-500 font-medium">Last edited: —</div>
                                    <button
                                        type="button"
                                        onClick={() => console.log('Open recent board:', idx + 1)}
                                        className="mt-4 w-full px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-black active:scale-[0.98] transition-all"
                                    >
                                        Open
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
