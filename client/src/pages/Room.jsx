import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Layout,
  Pencil,
  Eraser,
  Hand,
  Trash2,
  Undo2,
  Redo2,
  Minus,
  Plus,
  Copy,
  Check,
  LogOut,
  MessageSquare,
  Users,
  Send,
  Palette,
  Upload,
  Monitor,
  Moon,
  Sun,
  Square,
  Circle,
  Triangle,
  Lock,
  Unlock,
  ArrowLeft,
  Box
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

const SOCKET_SERVER = 'http://localhost:5000'; // Update this for production

const TOOL = {
  pan: 'pan',
  pencil: 'pencil',
  eraser: 'eraser',
  shape: 'shape'
};

const SWATCHES = ['#0f172a', '#2563eb', '#7c3aed', '#db2777', '#ef4444', '#f59e0b', '#10b981'];

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [nameOfRoom, setNameOfRoom] = useState(location.state?.roomName || 'Untitled Whiteboard');

  const [tool, setTool] = useState(TOOL.pencil);
  const [color, setColor] = useState('#2563eb');
  const [brushSize, setBrushSize] = useState(6);
  const [opacity, setOpacity] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [peerCursors, setPeerCursors] = useState({}); // {socketId: {x, y, name}}
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showShapes, setShowShapes] = useState(false);
  const [selectedShape, setSelectedShape] = useState('rect'); // rect, circle, triangle, line
  const [selectedId, setSelectedId] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  const [activeTab, setActiveTab] = useState('chat');
  const [chatInput, setChatInput] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });
  const [isExpiredByAdmin, setIsExpiredByAdmin] = useState(false);
  const [expirationMessage, setExpirationMessage] = useState('');
  const [messages, setMessages] = useState(() => [
    { id: 'm1', name: 'System', time: 'just now', text: 'Room is ready. Start drawing!' }
  ]);

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const displayName = user?.name || user?.email || 'Guest';

  const [users, setUsers] = useState([]);

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const socketRef = useRef(null);
  const lastPointRef = useRef(null);

  const strokesRef = useRef([]);
  const redoRef = useRef([]);
  const tempStrokeRef = useRef(null);
  const imageCacheRef = useRef({});
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctxRef.current = ctx;

    redrawAll();
  };

  const redrawAll = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(offset.x, offset.y);

    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke);
    }

    if (tempStrokeRef.current) {
      drawStroke(ctx, tempStrokeRef.current);
    }

    // Draw Selection UI
    if (selectedId) {
      const el = strokesRef.current.find(s => s.id === selectedId);
      if (el && el.type === 'image') {
        const padding = 4;
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(el.x - padding, el.y - padding, el.width + padding * 2, el.height + padding * 2);

        ctx.setLineDash([]);
        ctx.fillStyle = '#6366f1';
        // Draw resize handle (Bottom-Right)
        ctx.beginPath();
        const hr = 8;
        ctx.arc(el.x + el.width + padding, el.y + el.height + padding, hr / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  const drawStroke = (ctx, stroke) => {
    if (!stroke) return;
    if (stroke.type !== 'image' && !stroke.points?.length) return;

    ctx.save();

    if (stroke.type === 'image') {
      const imgData = stroke.data;
      if (!imageCacheRef.current[imgData]) {
        const img = new Image();
        img.onload = () => {
          imageCacheRef.current[imgData] = img;
          redrawAll();
        };
        img.src = imgData;
        ctx.restore();
        return;
      }
      const img = imageCacheRef.current[imgData];
      ctx.globalAlpha = stroke.opacity || 1;
      ctx.drawImage(img, stroke.x, stroke.y, stroke.width, stroke.height);
      ctx.restore();
      return;
    }

    ctx.globalCompositeOperation = stroke.type === 'erase' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.globalAlpha = stroke.opacity || 1;

    const pts = stroke.points;
    if (stroke.type === 'draw' || stroke.type === 'erase') {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    } else {
      const start = pts[0];
      const end = pts[pts.length - 1];
      const w = end.x - start.x;
      const h = end.y - start.y;

      ctx.beginPath();
      if (stroke.type === 'rect') {
        ctx.rect(start.x, start.y, w, h);
      } else if (stroke.type === 'circle') {
        const r = Math.sqrt(w * w + h * h);
        ctx.arc(start.x, start.y, r, 0, Math.PI * 2);
      } else if (stroke.type === 'triangle') {
        ctx.moveTo(start.x + w / 2, start.y);
        ctx.lineTo(start.x, start.y + h);
        ctx.lineTo(start.x + w, start.y + h);
        ctx.closePath();
      } else if (stroke.type === 'line') {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  useEffect(() => {
    initCanvas();

    const handleResize = () => {
      initCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    redrawAll();
  }, [darkMode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  useEffect(() => {
    if (isSharing && screenStream && localVideoRef.current) {
      localVideoRef.current.srcObject = screenStream;
    }
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [isSharing, screenStream, remoteStream]);

  useEffect(() => {
    // Socket Initialization
    const socket = io(SOCKET_SERVER);
    socketRef.current = socket;

    socket.emit('join-room', { roomId, userName: displayName, userId: user?.id, name: nameOfRoom });

    socket.on('whiteboard-data', (data) => {
      strokesRef.current = data;
      redrawAll();
    });

    socket.on('chat-history', (history) => {
      setMessages((prev) => {
        // Find existing non-system IDs
        const existingIds = new Set(prev.map(m => m.id));
        const newHistory = history.filter(h => !existingIds.has(h.id));
        return [...prev, ...newHistory];
      });
    });

    socket.on('draw', (stroke) => {
      const index = strokesRef.current.findIndex(s => s.id === stroke.id);
      if (index > -1) {
        strokesRef.current[index] = stroke;
      } else {
        strokesRef.current.push(stroke);
      }
      redrawAll();
    });

    socket.on('clear', () => {
      strokesRef.current = [];
      redrawAll();
    });

    socket.on('undo', () => {
      handleUndo(false);
    });

    socket.on('redo', () => {
      handleRedo(false);
    });

    socket.on('chat-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('re-entry-blocked', ({ message }) => {
      setIsExpiredByAdmin(true);
      setExpirationMessage(message);
    });

    socket.on('room-details', ({ name }) => {
      setNameOfRoom(name);
    });

    socket.on('room-expired', ({ message }) => {
      setIsExpiredByAdmin(true);
      setExpirationMessage(message);
    });

    socket.on('room-users', (userList) => {
      setUsers(userList);
      // Prune cursors for users no longer in the room
      const userIds = new Set(userList.map(u => u.id));
      setPeerCursors(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          if (!userIds.has(id)) delete next[id];
        });
        return next;
      });
    });

    socket.on('user-joined', (newUser) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: 'System',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `${newUser.name} joined the room.`
        }
      ]);
    });

    socket.on('cursor-move', ({ id, x, y, name }) => {
      setPeerCursors(prev => ({ ...prev, [id]: { x, y, name } }));
    });

    socket.on('screen-share-start', ({ streamId, userName }) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        name: 'System',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `${userName} started screen sharing.`
      }]);
    });

    socket.on('screen-share-stop', () => {
      setRemoteStream(null);
    });

    socket.on('user-left', (id) => {
      setPeerCursors(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    const handleBeforeUnload = (e) => {
      // By default, we don't block, but we can if there are unsaved changes.
      // However, per user request, we just want to ensure the room stays open.
      // The room STAYING open is handled by the server (disconnect doesn't expire).
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      socket.disconnect();
    };
  }, [roomId, displayName]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getPoint = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left - offset.x,
      y: e.clientY - rect.top - offset.y
    };
  };

  const handlePointerDown = (e) => {
    if (isLocked) return;
    if (tool === TOOL.pan) {
      const pt = getPoint(e);
      if (!pt) return;

      // Hit detection for resize handle
      if (selectedId) {
        const el = strokesRef.current.find(s => s.id === selectedId);
        if (el && el.type === 'image') {
          const padding = 4;
          const hx = el.x + el.width + padding;
          const hy = el.y + el.height + padding;
          const dist = Math.sqrt((pt.x - hx) ** 2 + (pt.y - hy) ** 2);
          if (dist < 15) {
            setResizing('br');
            lastPointRef.current = pt;
            return;
          }
        }
      }

      // Hit detection for images
      for (let i = strokesRef.current.length - 1; i >= 0; i--) {
        const s = strokesRef.current[i];
        if (s.type === 'image') {
          if (pt.x >= s.x && pt.x <= s.x + s.width && pt.y >= s.y && pt.y <= s.y + s.height) {
            setSelectedId(s.id);
            setTool(TOOL.pan); // Ensure we're in pan mode for dragging/resizing
            redrawAll();
            // Start dragging image logic could go here if needed, 
            // but for now we prioritize pan and selection
            break;
          }
        }
        if (i === 0) setSelectedId(null);
      }

      setIsPanning(true);
      lastPointRef.current = { x: e.clientX, y: e.clientY };
      redrawAll();
      return;
    }

    const pt = getPoint(e);
    if (!pt) return;

    canvasRef.current?.setPointerCapture?.(e.pointerId);

    setIsDrawing(true);
    redoRef.current = [];

    const stroke = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type: tool === TOOL.shape ? selectedShape : (tool === TOOL.eraser ? 'erase' : 'draw'),
      color,
      size: brushSize,
      opacity: tool === TOOL.eraser ? 1 : opacity,
      points: [pt]
    };

    if (tool === TOOL.shape) {
      tempStrokeRef.current = stroke;
    } else {
      strokesRef.current = [...strokesRef.current, stroke];
    }
    lastPointRef.current = pt;

    redrawAll();
  };

  const handlePointerMove = (e) => {
    if (isLocked) return;
    const pt = getPoint(e);
    if (!pt) return;

    // Emit cursor move
    socketRef.current?.emit('cursor-move', { roomId, x: pt.x, y: pt.y, name: displayName });

    if (resizing && selectedId) {
      const dx = pt.x - lastPointRef.current.x;
      const dy = pt.y - lastPointRef.current.y;

      const el = strokesRef.current.find(s => s.id === selectedId);
      if (el) {
        el.width = Math.max(20, el.width + dx);
        el.height = Math.max(20, el.height + dy);
        socketRef.current?.emit('draw', { roomId, stroke: el });
        lastPointRef.current = pt;
        redrawAll();
      }
      return;
    }

    if (isPanning) {
      const dx = e.clientX - lastPointRef.current.x;
      const dy = e.clientY - lastPointRef.current.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPointRef.current = { x: e.clientX, y: e.clientY };
      redrawAll();
      return;
    }

    if (!isDrawing) return;

    if (tool === TOOL.shape) {
      if (tempStrokeRef.current) {
        tempStrokeRef.current.points = [tempStrokeRef.current.points[0], pt];
        redrawAll();
      }
      return;
    }

    const strokes = strokesRef.current;
    const lastStroke = strokes[strokes.length - 1];
    if (!lastStroke) return;

    lastStroke.points.push(pt);
    lastPointRef.current = pt;

    socketRef.current?.emit('draw', { roomId, stroke: lastStroke });
    redrawAll();
  };

  const handlePointerUp = () => {
    if (isLocked) return;
    setResizing(null);
    if (isDrawing && tool === TOOL.shape && tempStrokeRef.current) {
      strokesRef.current = [...strokesRef.current, tempStrokeRef.current];
      socketRef.current?.emit('draw', { roomId, stroke: tempStrokeRef.current });
      tempStrokeRef.current = null;
    }
    setIsDrawing(false);
    setIsPanning(false);
    lastPointRef.current = null;
    redrawAll();
  };

  const handleClear = (emit = true) => {
    strokesRef.current = [];
    redoRef.current = [];
    redrawAll();
    if (emit) socketRef.current?.emit('clear', roomId);
  };

  const handleUndo = (emit = true) => {
    if (isLocked) return;
    const strokes = strokesRef.current;
    if (!strokes.length) return;
    const last = strokes[strokes.length - 1];
    strokesRef.current = strokes.slice(0, -1);
    redoRef.current = [...redoRef.current, last];
    redrawAll();
    if (emit) socketRef.current?.emit('undo', roomId);
  };

  const handleRedo = (emit = true) => {
    if (isLocked) return;
    const redo = redoRef.current;
    if (!redo.length) return;
    const stroke = redo[redo.length - 1];
    redoRef.current = redo.slice(0, -1);
    strokesRef.current = [...strokesRef.current, stroke];
    redrawAll();
    if (emit) socketRef.current?.emit('redo', roomId);
  };

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Unable to copy Room ID');
    }
  };

  const handleLeave = () => {
    socketRef.current?.emit('leave-room', { roomId, userId: user?.id });
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleScreenShare = async () => {
    if (isSharing) {
      screenStream?.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsSharing(false);
      socketRef.current?.emit('stop-sharing', roomId);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: false
      });
      setScreenStream(stream);
      setIsSharing(true);

      socketRef.current?.emit('start-sharing', { roomId, userName: displayName });

      stream.getVideoTracks()[0].onended = () => {
        setIsSharing(false);
        setScreenStream(null);
        socketRef.current?.emit('stop-sharing', roomId);
      };
    } catch (err) {
      console.error("Error sharing screen:", err);
    }
  };
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Scale image if it's too large
        let w = img.width;
        let h = img.height;
        const maxDim = 500;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w *= ratio;
          h *= ratio;
        }

        // Center relative to current view
        const x = (canvas.width / (2 * (window.devicePixelRatio || 1)) - w / 2) - offset.x;
        const y = (canvas.height / (2 * (window.devicePixelRatio || 1)) - h / 2) - offset.y;

        const stroke = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: 'image',
          data: event.target.result,
          x,
          y,
          width: w,
          height: h,
          opacity: 1,
          points: [{ x, y }] // For undo/redo positioning
        };

        strokesRef.current = [...strokesRef.current, stroke];
        socketRef.current?.emit('draw', { roomId, stroke });
        redrawAll();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    const message = {
      id: `${Date.now()}`,
      name: displayName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text
    };

    setMessages((prev) => [...prev, message]);
    socketRef.current?.emit('chat-message', { roomId, message });
    setChatInput('');
  };

  const ToolButton = ({ active, onClick, icon: Icon, label, color: bg }) => (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${active
        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
        : (bg ? '' : 'hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100')
        }`}
      aria-label={label}
      title={label}
      style={bg ? { backgroundColor: bg, border: active ? '2px solid white' : 'none' } : {}}
    >
      {!bg && Icon && <Icon className="w-5 h-5 mb-0.5" />}
    </button>
  );

  return (
    <div className={`fixed inset-0 h-[100dvh] w-screen flex flex-col font-sans transition-all duration-700 overflow-hidden touch-none select-none overscroll-none ${darkMode ? 'bg-[#0f111a] text-slate-200' : 'bg-[#f4f7fb] text-slate-800'}`}>
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[150px] transition-colors duration-1000 ${darkMode ? 'bg-indigo-900/10' : 'bg-indigo-100'}`} />
        <div className={`absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[150px] transition-colors duration-1000 ${darkMode ? 'bg-violet-900/10' : 'bg-violet-100'}`} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Header - Sleek & Modern */}
        <header className={`flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b transition-colors duration-500 ${darkMode ? 'bg-black/20 border-white/5' : 'bg-white/50 border-slate-200 backdrop-blur-md'}`}>
          <div className="flex items-center gap-3 md:gap-8">
            <div
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity group"
              title="Go to Dashboard (Session will stay open)"
            >
              <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                <Layout className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] md:text-sm font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{nameOfRoom}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className={`text-[8px] md:text-[10px] font-black tracking-[0.1em] uppercase ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>ID:</span>
                  <span className="text-[8px] md:text-[10px] font-bold text-indigo-500 tabular-nums">{roomId}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCopyRoomId}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-bold transition-all active:scale-95 ${copied ? 'bg-emerald-500 text-white' : (darkMode ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-white hover:shadow-md border border-slate-200 text-slate-600')}`}
            >
              {copied ? <Check className="w-3 md:w-3.5 h-3 md:h-3.5" /> : <Copy className="w-3 md:w-3.5 h-3 md:h-3.5" />}
              <span className="inline-flex">{copied ? 'Copied!' : 'Copy Room ID'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-bold ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span><span className="hidden xs:inline">{users.length} </span>Online</span>
            </div>

            <button
              onClick={() => setShowMobileChat(!showMobileChat)}
              className={`lg:hidden flex items-center justify-center w-9 h-9 rounded-xl transition-all ${darkMode ? 'bg-white/5 text-indigo-400' : 'bg-white border border-slate-200 text-indigo-500 shadow-sm'}`}
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <button
              onClick={handleLeave}
              className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg ${darkMode ? 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white shadow-black/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-indigo-500/10'}`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Leave Board</span>
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Left Tools Sidebar - Hidden on mobile, shown as bottom bar */}
          <aside className={`hidden md:flex relative z-20 w-[84px] flex-col items-center py-6 border-r transition-colors duration-500 gap-8 ${darkMode ? 'bg-black/20 border-white/5' : 'bg-white/50 border-slate-200 backdrop-blur-sm'}`}>
            <div className="relative flex items-center">
              <div className={`flex flex-col gap-2 p-1.5 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-slate-200/50'}`}>
                <ToolButton
                  active={tool === TOOL.pencil}
                  onClick={() => {
                    if (tool === TOOL.pencil) setShowSettings(!showSettings);
                    else {
                      setTool(TOOL.pencil);
                      setShowSettings(true);
                    }
                  }}
                  icon={Pencil}
                  label="Pencil"
                />
                <ToolButton
                  active={tool === TOOL.eraser}
                  onClick={() => {
                    if (tool === TOOL.eraser) setShowSettings(!showSettings);
                    else {
                      setTool(TOOL.eraser);
                      setShowSettings(true);
                      setShowShapes(false);
                    }
                  }}
                  icon={Eraser}
                  label="Eraser"
                />
                <ToolButton
                  active={tool === TOOL.shape}
                  onClick={() => {
                    if (tool === TOOL.shape) setShowShapes(!showShapes);
                    else {
                      setTool(TOOL.shape);
                      setShowShapes(true);
                      setShowSettings(false);
                    }
                  }}
                  icon={Box}
                  label="Shapes"
                />
                <ToolButton active={tool === TOOL.pan} onClick={() => { setTool(TOOL.pan); setShowSettings(false); setShowShapes(false); }} icon={Hand} label="Pan (Select)" />
              </div>

              {/* Shapes Panel */}
              {showShapes && tool === TOOL.shape && (
                <div className={`absolute left-[82px] top-10 flex gap-2 p-3 rounded-[22px] border-2 shadow-[0_10px_40px_rgba(0,0,0,0.1)] backdrop-blur-3xl transition-all duration-500 animate-in fade-in zoom-in-95 slide-in-from-left-4 z-[100] ${darkMode ? 'bg-black/80 border-indigo-500/30' : 'bg-white border-indigo-500/20'}`}>
                  <button onClick={() => { setSelectedShape('rect'); setShowShapes(false); }} title="Rectangle" className={`p-2 rounded-lg transition-all ${selectedShape === 'rect' ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-500/10'}`}><Square className="w-5 h-5" /></button>
                  <button onClick={() => { setSelectedShape('circle'); setShowShapes(false); }} title="Circle" className={`p-2 rounded-lg transition-all ${selectedShape === 'circle' ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-500/10'}`}><Circle className="w-5 h-5" /></button>
                  <button onClick={() => { setSelectedShape('triangle'); setShowShapes(false); }} title="Triangle" className={`p-2 rounded-lg transition-all ${selectedShape === 'triangle' ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-500/10'}`}><Triangle className="w-5 h-5" /></button>
                  <button onClick={() => { setSelectedShape('line'); setShowShapes(false); }} title="Line" className={`p-2 rounded-lg transition-all ${selectedShape === 'line' ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-500/10'}`}><Minus className="w-5 h-5" /></button>
                </div>
              )}

              {/* Tool Settings Panel (Pencil or Eraser) */}
              {showSettings && (tool === TOOL.pencil || tool === TOOL.eraser) && (
                <div className={`absolute left-[82px] top-0 flex flex-col gap-3.5 p-4 rounded-[22px] border-2 shadow-[0_10px_40px_rgba(0,0,0,0.15)] backdrop-blur-3xl transition-all duration-500 animate-in fade-in zoom-in-95 slide-in-from-left-4 z-[100] group/settings hover:scale-[1.02] hover:shadow-indigo-500/20 ${darkMode ? 'bg-black/80 border-indigo-500/30' : 'bg-white border-indigo-500/20'}`}>
                  {/* Glowing Indicator Arrow */}
                  <div className={`absolute -left-2 top-5 w-4 h-4 rotate-45 border-l-2 border-b-2 shadow-[-4px_4px_10px_rgba(99,102,241,0.1)] ${darkMode ? 'bg-black border-indigo-500/30' : 'bg-white border-indigo-500/20'}`} />

                  <div className="flex flex-col gap-2 min-w-[130px]">
                    <div className="flex justify-between items-center px-1">
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        {tool === TOOL.eraser ? 'Eraser' : 'Stroke'}
                      </span>
                      <span className={`text-[11px] font-black ${darkMode ? 'text-indigo-400' : 'text-black'}`}>{brushSize}px</span>
                    </div>
                    <div className="relative group/slider h-4 flex items-center">
                      <input
                        type="range"
                        min="1"
                        max="60"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className={`w-full h-1 rounded-full appearance-none cursor-pointer transition-all accent-indigo-500 ${darkMode ? 'bg-white/10' : 'bg-slate-100'}`}
                      />
                    </div>
                  </div>

                  {tool === TOOL.pencil && (
                    <>
                      <div className={`h-[1px] w-full ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`} />
                      <div className="flex flex-col gap-2 min-w-[130px]">
                        <div className="flex justify-between items-center px-1">
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Opacity</span>
                          <span className={`text-[11px] font-black ${darkMode ? 'text-indigo-400' : 'text-black'}`}>{Math.round(opacity * 100)}%</span>
                        </div>
                        <div className="relative group/slider h-4 flex items-center">
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.05"
                            value={opacity}
                            onChange={(e) => setOpacity(parseFloat(e.target.value))}
                            className={`w-full h-1 rounded-full appearance-none cursor-pointer transition-all accent-indigo-500 ${darkMode ? 'bg-white/10' : 'bg-slate-100'}`}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-3">
              <div className="w-8 h-px bg-slate-500/10 mx-auto" />
              <label className="relative cursor-pointer group mx-auto">
                <input type="color" className="sr-only" onChange={(e) => setColor(e.target.value)} />
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm border ${darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                  style={{ borderBottom: `4px solid ${color}` }}
                  title="Choose Color"
                >
                  <Palette className={`w-5 h-5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
                </div>
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-8 h-px bg-slate-500/10 mx-auto" />
              <button
                onClick={() => setIsLocked(!isLocked)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isLocked ? 'bg-red-500 text-white' : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'}`}
                title={isLocked ? 'Unlock Board' : 'Lock Board'}
              >
                {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              </button>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleUndo()}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-black/5 dark:hover:bg-white/5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleRedo()}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-black/5 dark:hover:bg-white/5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => handleClear()}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-red-500/10 hover:text-red-500 text-slate-400"
                title="Clear All"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </aside>

          {/* Mobile Bottom Toolbar */}
          <div className="md:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 rounded-2xl border-2 backdrop-blur-3xl shadow-2xl transition-all duration-500 bg-white/80 dark:bg-black/80 border-indigo-500/20">
            <div className="flex gap-1.5 border-r border-slate-500/10 pr-2">
              <ToolButton active={tool === TOOL.pencil} onClick={() => { setTool(TOOL.pencil); setShowSettings(true); setShowShapes(false); }} icon={Pencil} label="Pencil" />
              <ToolButton active={tool === TOOL.eraser} onClick={() => { setTool(TOOL.eraser); setShowSettings(true); setShowShapes(false); }} icon={Eraser} label="Eraser" />
              <ToolButton active={tool === TOOL.shape} onClick={() => { setTool(TOOL.shape); setShowShapes(true); setShowSettings(false); }} icon={Box} label="Shapes" />
              <ToolButton active={tool === TOOL.pan} onClick={() => { setTool(TOOL.pan); setShowSettings(false); setShowShapes(false); }} icon={Hand} label="Pan" />
            </div>
            <div className="flex gap-1">
              <button onClick={() => handleUndo()} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 opacity-70"><Undo2 className="w-4 h-4" /></button>
              <button onClick={() => setIsLocked(!isLocked)} className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isLocked ? 'bg-red-500 text-white' : 'opacity-70'}`}>{isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}</button>
              <button onClick={() => handleClear()} className="w-9 h-9 flex items-center justify-center rounded-lg text-red-500/60"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Main Workspace */}
          <main className="flex-1 flex flex-col relative z-10 bg-transparent overflow-hidden">
            <div className={`flex-1 m-2 md:m-6 rounded-2xl md:rounded-[32px] overflow-hidden relative group/canvas border-2 transition-all duration-700 ${isSharing || remoteStream ? 'bg-black border-indigo-500/40 shadow-2xl shadow-indigo-500/20' : (darkMode ? 'bg-slate-900 border-white/10 shadow-[0_30px_100px_-12px_rgba(0,0,0,0.6)]' : 'bg-white border-slate-200 shadow-[0_40px_100px_-20px_rgba(99,102,241,0.15)]')}`}>

              {/* Redundant controls removed - moved to Tool Sidebar settings */}

              <div className={`absolute inset-0 z-0 ${(isSharing || remoteStream) ? 'bg-black' : 'bg-transparent'}`}>
                {(isSharing || remoteStream) && (
                  <video
                    ref={isSharing ? localVideoRef : remoteVideoRef}
                    autoPlay
                    muted={isSharing} // Mute local but not remote if audio exists
                    playsInline
                    className="w-full h-full object-contain pointer-events-none"
                  />
                )}
              </div>

              <canvas
                ref={canvasRef}
                className={`relative z-10 w-full h-full touch-none ${tool === TOOL.pan ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              />
            </div>
          </main>

          {/* Right Panel - Polished Interaction hub */}
          {/* Mobile Overlay for Right Sidebar */}
          {showMobileChat && (
            <div
              className="lg:hidden absolute inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-300"
              onClick={() => setShowMobileChat(false)}
            />
          )}

          {/* Right Sidebar - Slide over on mobile */}
          <aside className={`fixed lg:relative top-0 right-0 h-full lg:h-auto w-80 md:w-96 lg:w-[400px] z-[60] lg:z-20 flex flex-col border-l transition-all duration-500 ease-in-out transform ${showMobileChat ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} ${darkMode ? 'bg-[#1a1c2a] border-white/5' : 'bg-white border-slate-200 shadow-2xl lg:shadow-none'}`}>
            <header className="p-6 flex items-center justify-between border-b border-transparent">
              <div className={`flex p-1.5 rounded-2xl w-full ${darkMode ? 'bg-black/30' : 'bg-slate-100'}`}>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all ${activeTab === 'chat' ? 'bg-white dark:bg-indigo-500 shadow-md text-indigo-500 dark:text-white scale-[1.02]' : 'opacity-50 hover:opacity-80'}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat</span>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all ${activeTab === 'users' ? 'bg-white dark:bg-indigo-500 shadow-md text-indigo-500 dark:text-white scale-[1.02]' : 'opacity-50 hover:opacity-80'}`}
                >
                  <Users className="w-4 h-4" />
                  <span>Users</span>
                </button>
              </div>
              <button
                onClick={() => setShowMobileChat(false)}
                className="lg:hidden ml-4 p-2 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/10"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </header>

            {activeTab === 'chat' ? (
              <div className="flex-1 flex flex-col min-h-0 touch-auto select-text">
                <div className="flex-1 overflow-y-auto px-6 space-y-4 no-scrollbar">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex flex-col gap-1.5 ${m.name === displayName ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{m.name}</span>
                        <span className="text-[9px] opacity-30">{m.time}</span>
                      </div>
                      <div className={`text-sm px-4 py-3 rounded-2xl max-w-[90%] shadow-sm leading-relaxed ${m.name === 'System' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-center w-full max-w-full' : (m.name === displayName ? 'bg-indigo-500 text-white' : (darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white border border-slate-200 text-slate-700'))}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-6 space-y-4">
                  <form onSubmit={handleSend} className="relative group">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      className={`w-full pl-6 pr-14 py-4 rounded-2xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-900'}`}
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-2 w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full flex items-center justify-center gap-3 p-3.5 rounded-2xl border transition-all hover:-translate-y-0.5 active:translate-y-0 ${darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}
                    >
                      <Upload className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold">Upload Image</span>
                    </button>

                    <button
                      onClick={handleScreenShare}
                      className={`w-full flex items-center justify-center gap-3 p-3.5 rounded-2xl border transition-all hover:-translate-y-0.5 active:translate-y-0 ${isSharing ? 'bg-red-500 text-white border-red-400' : (darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-200 shadow-sm hover:shadow-md')}`}
                    >
                      <Monitor className={`w-4 h-4 ${isSharing ? 'text-white' : 'text-emerald-500'}`} />
                      <span className="text-xs font-bold">{isSharing ? 'Stop Sharing' : 'Share Screen'}</span>
                    </button>

                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`w-full flex items-center justify-center gap-3 p-3.5 rounded-2xl border transition-all hover:-translate-y-0.5 active:translate-y-0 ${darkMode ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-900 text-white shadow-xl shadow-black/10'}`}
                    >
                      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      <span className="text-xs font-bold">{darkMode ? 'Cloud Mode' : 'Shadow Mode'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-4">Active Collaborators</div>
                <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar touch-auto select-text">
                  {users.map((u) => (
                    <div key={u.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:translate-x-1 ${darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${darkMode ? 'bg-slate-800 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}>
                            {u.name.slice(0, 1)}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 bg-emerald-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{u.name}</span>
                          <span className="text-[9px] uppercase font-black opacity-30 tracking-widest">{u.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
        {/* Room Expired Overlay */}
        {isExpiredByAdmin && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all animate-in fade-in duration-500">
            <div className={`relative w-full max-w-sm rounded-[40px] p-10 shadow-3xl text-center border ${darkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
              <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 animate-pulse" />
              </div>
              <h2 className={`text-2xl font-black tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{expirationMessage || 'Room Expired'}</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                The administrator has left the session. This room is now closed for collaborators.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-600/20"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Room;
