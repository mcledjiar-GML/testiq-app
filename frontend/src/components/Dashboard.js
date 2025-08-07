import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard({ user }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <h2>🎯 Bienvenue, {user.name}!</h2>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
        Testez votre intelligence avec nos évaluations scientifiques de QI.
        Choisissez une option pour commencer :
      </p>
      
      <div className="dashboard-buttons">
        <button onClick={() => navigate('/test')}>
          🧠 Commencer un test de QI
          <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>
            Test basé sur les matrices de Raven
          </div>
        </button>
        
        <button onClick={() => navigate('/results')}>
          📊 Voir mes résultats
          <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>
            Historique et analyses de performance
          </div>
        </button>
      </div>
      
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        background: '#f8f9fa', 
        borderRadius: '10px',
        textAlign: 'left'
      }}>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>ℹ️ À propos des tests</h3>
        <ul style={{ color: '#666', lineHeight: '1.6' }}>
          <li>• Tests basés sur des méthodes scientifiques reconnues</li>
          <li>• Évaluation de différents types d'intelligence</li>
          <li>• Résultats détaillés et interprétation personnalisée</li>
          <li>• Suivi de votre progression dans le temps</li>
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;