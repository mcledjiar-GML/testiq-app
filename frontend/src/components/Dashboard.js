import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await api.get(`/api/results/${user.id}`);
        setUserStats(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error);
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user.id]);

  // Fonction pour calculer le QI actuel (moyenne des 3 derniers tests ou dernier test)
  const getCurrentIQ = () => {
    if (!userStats || !userStats.tests || userStats.tests.length === 0) {
      return null;
    }
    
    // Trier les tests par date (plus récent en premier)
    const sortedTests = userStats.tests
      .filter(test => test.iq && test.iq > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedTests.length === 0) return null;
    
    // Prendre les 3 derniers tests (ou moins s'il y en a moins)
    const recentTests = sortedTests.slice(0, 3);
    
    if (recentTests.length === 1) {
      return {
        iq: recentTests[0].iq,
        source: 'dernier test',
        classification: recentTests[0].classification
      };
    } else {
      const averageIQ = Math.round(
        recentTests.reduce((sum, test) => sum + test.iq, 0) / recentTests.length
      );
      return {
        iq: averageIQ,
        source: `moyenne des ${recentTests.length} derniers tests`,
        classification: getIQClassification(averageIQ)
      };
    }
  };

  // Fonction pour obtenir la classification d'un QI
  const getIQClassification = (iq) => {
    if (iq >= 130) return { level: "Très supérieur", emoji: "🧠✨" };
    if (iq >= 120) return { level: "Supérieur", emoji: "🎯" };
    if (iq >= 110) return { level: "Moyen supérieur", emoji: "📈" };
    if (iq >= 90) return { level: "Moyen", emoji: "✅" };
    if (iq >= 80) return { level: "Moyen inférieur", emoji: "📊" };
    if (iq >= 70) return { level: "Limite", emoji: "⚠️" };
    return { level: "Déficient", emoji: "🔻" };
  };

  const currentIQ = getCurrentIQ();

  return (
    <div className="dashboard-container">
      <h2>🎯 Bienvenue, {user.name}!</h2>
      
      {/* Affichage du QI actuel */}
      {!loading && currentIQ && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '15px',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '16px', opacity: 0.9, marginBottom: '10px' }}>
            🧠 Votre QI actuel
          </div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '10px 0' }}>
            {currentIQ.classification.emoji} {currentIQ.iq}
          </div>
          <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '5px' }}>
            {currentIQ.classification.level}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            Basé sur votre {currentIQ.source}
          </div>
        </div>
      )}
      
      {!loading && !currentIQ && userStats && userStats.tests && userStats.tests.length > 0 && (
        <div style={{
          background: '#fff3cd',
          color: '#856404',
          padding: '15px',
          borderRadius: '10px',
          marginBottom: '30px',
          textAlign: 'center',
          border: '1px solid #ffeaa7'
        }}>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            📊 Vos tests précédents n'incluent pas de calcul de QI
          </div>
          <div style={{ fontSize: '14px', marginTop: '5px' }}>
            Effectuez un nouveau test pour obtenir votre QI actualisé
          </div>
        </div>
      )}
      
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
        Testez votre intelligence avec nos évaluations scientifiques de QI.
        Choisissez une option pour commencer :
      </p>
      
      <div className="dashboard-buttons">
        <button onClick={() => navigate('/test?level=short')}>
          ⚡ Test rapide (12 questions)
          <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>
            15 minutes - Échantillon de chaque série
          </div>
        </button>
        
        <button onClick={() => navigate('/test?level=standard')}>
          🧠 Test standard (20 questions)
          <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>
            25 minutes - Test équilibré recommandé
          </div>
        </button>
        
        <button onClick={() => navigate('/test?level=full')}>
          🎯 Test complet Raven (60 questions)
          <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>
            90 minutes - Test professionnel complet
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