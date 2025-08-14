import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation des mots de passe
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/register', { 
        name, 
        email, 
        password 
      });
      
      // Rediriger vers la page de connexion
      navigate('/login', { 
        state: { message: 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.' }
      });
    } catch (error) {
      setError(
        error.response?.data?.error || 
        'Erreur lors de la création du compte'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>📝 Créer un compte</h2>
      {error && <p className="error">{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Nom complet :</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Votre nom complet"
          />
        </div>
        
        <div>
          <label htmlFor="email">Email :</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="votre@email.com"
          />
        </div>
        
        <div>
          <label htmlFor="password">Mot de passe :</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Au moins 6 caractères"
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword">Confirmer le mot de passe :</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Répétez le mot de passe"
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Création...' : 'Créer le compte'}
        </button>
      </form>
      
      <p style={{ marginTop: '20px', color: '#666' }}>
        Déjà un compte ? 
        <Link to="/login" style={{ color: '#667eea', textDecoration: 'none', marginLeft: '5px' }}>
          Se connecter
        </Link>
      </p>
    </div>
  );
}

export default Register;