import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import Test from './components/Test';
import Results from './components/Results';
import Dashboard from './components/Dashboard';
import Review from './components/Review';
import './App.css';

// Configuration de l'URL de base pour axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Vérifier si le token est valide
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Chargement...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>🧠 TestIQ - Application de Test de QI</h1>
          {user && (
            <div className="user-info">
              <span>Bonjour, {user.name} 👋</span>
              <button onClick={logout} className="logout-btn">Déconnexion</button>
            </div>
          )}
        </header>
        
        <main className="App-main">
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            <Route path="/login" element={!user ? <Login onLogin={login} /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/test" element={user ? <Test user={user} /> : <Navigate to="/login" />} />
            <Route path="/results" element={user ? <Results user={user} /> : <Navigate to="/login" />} />
            <Route path="/review/:testIndex" element={user ? <Review user={user} /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;