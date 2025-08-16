import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import Test from './components/Test';
import Results from './components/Results';
import Dashboard from './components/Dashboard';
import Review from './components/Review';
import TestsPersonnalises from './components/TestsPersonnalises';
import './App.css';
import './styles/svg-tokens.css';

// Configuration de l'URL de base pour axios
axios.defaults.baseURL = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authRequired = process.env.REACT_APP_AUTH_REQUIRED !== 'false';

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
          {!authRequired && (
            <div className="demo-info">
              <span>🎭 Mode Démo</span>
              <button onClick={() => window.location.href = '/dashboard'} className="home-btn">🏠 Menu Principal</button>
            </div>
          )}
        </header>
        
        <main className="App-main">
          <Routes>
            <Route path="/" element={
              authRequired 
                ? (user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />) 
                : <Navigate to="/dashboard" />
            } />
            <Route path="/login" element={!user ? <Login onLogin={login} /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={
              authRequired 
                ? (user ? <Dashboard user={user} /> : <Navigate to="/login" />)
                : <Dashboard user={null} />
            } />
            <Route path="/tests-personnalises" element={
              authRequired 
                ? (user ? <TestsPersonnalises user={user} /> : <Navigate to="/login" />)
                : <TestsPersonnalises user={null} />
            } />
            <Route path="/test" element={
              authRequired 
                ? (user ? <Test user={user} /> : <Navigate to="/login" />)
                : <Test user={null} />
            } />
            <Route path="/results" element={
              authRequired 
                ? (user ? <Results user={user} /> : <Navigate to="/login" />)
                : <Results user={null} />
            } />
            <Route path="/review/:testIndex" element={
              authRequired 
                ? (user ? <Review user={user} /> : <Navigate to="/login" />)
                : <Review user={null} />
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;