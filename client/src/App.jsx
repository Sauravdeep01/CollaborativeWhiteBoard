import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';
import Profile from './pages/Profile';
import Logic from './pages/Logic';
import './App.css';

function App() {
  const token = localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={token ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/profile"
          element={token ? <Profile /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/logic"
          element={token ? <Logic /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/room/:roomId"
          element={token ? <Room /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
