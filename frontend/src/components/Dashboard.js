import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearingDemo, setClearingDemo] = useState(false);
  
  // Détection du mode démo
  const isDemoMode = process.env.REACT_APP_AUTH_REQUIRED === 'false';

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        if (isDemoMode) {
          // Mode démo : récupérer l'ID de l'utilisateur démo depuis le backend
          console.log('🎭 Mode démo : récupération des stats de l\'utilisateur démo');
          try {
            // Faire une requête pour trouver l'utilisateur démo
            const response = await api.get('/api/demo/user-info');
            if (response.data.userId) {
              const statsResponse = await api.get(`/api/results/${response.data.userId}`);
              setUserStats(statsResponse.data);
            } else {
              setUserStats({ tests: [], totalTests: 0 });
            }
          } catch (error) {
            // Si l'utilisateur démo n'existe pas encore, créer un état vide
            console.log('🎭 Utilisateur démo pas encore créé, stats vides');
            setUserStats({ tests: [], totalTests: 0 });
          }
          setLoading(false);
          return;
        }
        
        // Mode production : utilisateur connecté
        if (!user || !user.id) {
          setUserStats({ tests: [], totalTests: 0 });
          setLoading(false);
          return;
        }
        
        const response = await api.get(`/api/results/${user.id}`);
        setUserStats(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error);
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user?.id, isDemoMode]);

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

  // Fonction pour vider l'historique démo
  const clearDemoHistory = async () => {
    if (!isDemoMode) return;
    
    if (!window.confirm('🧹 Êtes-vous sûr de vouloir vider tout l\'historique des tests démo ?')) {
      return;
    }
    
    setClearingDemo(true);
    try {
      const response = await api.delete('/api/demo/clear-history');
      
      if (response.data.demoMode) {
        console.log('✅ Historique démo vidé avec succès');
        // Rafraîchir les stats (vider localement)
        setUserStats({ tests: [], totalTests: 0 });
        alert('🎉 Historique démo vidé avec succès !');
      }
    } catch (error) {
      console.error('❌ Erreur lors du vidage démo:', error);
      alert('❌ Erreur lors du vidage de l\'historique démo');
    } finally {
      setClearingDemo(false);
    }
  };

  return (
    <div className="dashboard-container">
      <h2>🎯 Bienvenue{user?.name ? `, ${user.name}` : ' en mode démo'}!</h2>
      
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
        Choisissez votre type de test :
      </p>
      
      {/* Section Tests Guidés (par défaut) */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ 
          color: '#2c3e50', 
          marginBottom: '20px', 
          fontSize: '22px',
          borderBottom: '2px solid #3498db',
          paddingBottom: '10px'
        }}>
          🏠 Tests Guidés (Recommandés)
        </h3>
        
        <div className="dashboard-buttons" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px' 
        }}>
          <button 
            onClick={() => navigate('/test?mode=guided&level=debutant')}
            style={{
              background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
              border: 'none',
              borderRadius: '15px',
              padding: '25px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 5px 15px rgba(46, 204, 113, 0.3)'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🟢 Débutant</div>
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>Série A (12 questions)</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              15 min • Difficulté 1-2 • Bases du raisonnement
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/test?mode=guided&level=intermediaire')}
            style={{
              background: 'linear-gradient(135deg, #f39c12, #e67e22)',
              border: 'none',
              borderRadius: '15px',
              padding: '25px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 5px 15px rgba(243, 156, 18, 0.3)'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🟡 Intermédiaire</div>
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>Séries A+B (24 questions)</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              25 min • Difficulté 1-4 • Test équilibré
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/test?mode=guided&level=avance')}
            style={{
              background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
              border: 'none',
              borderRadius: '15px',
              padding: '25px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 5px 15px rgba(231, 76, 60, 0.3)'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🟠 Avancé</div>
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>Séries A+B+C (36 questions)</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              45 min • Difficulté 1-6 • Challenge spatial
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/test?mode=guided&level=expert')}
            style={{
              background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
              border: 'none',
              borderRadius: '15px',
              padding: '25px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 5px 15px rgba(142, 68, 173, 0.3)'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔴 Expert</div>
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>Toutes séries (60 questions)</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              90 min • Difficulté 1-10 • Test complet Raven
            </div>
          </button>
        </div>
      </div>
      
      {/* Bouton Tests Personnalisés */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        padding: '30px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        color: 'white'
      }}>
        <h3 style={{ 
          color: 'white', 
          marginBottom: '15px',
          fontSize: '24px' 
        }}>
          ⚙️ Besoin de plus d'options ?
        </h3>
        <p style={{ 
          fontSize: '16px', 
          marginBottom: '20px',
          opacity: 0.9 
        }}>
          Accédez aux tests par série, tests ciblés par QI, et plus d'options avancées
        </p>
        <button 
          onClick={() => navigate('/tests-personnalises')}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            padding: '15px 30px',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          🎯 Tests Personnalisés
        </button>
      </div>
      
      {/* Boutons navigation classiques */}
      <div className="dashboard-buttons">
        <button onClick={() => navigate('/results')}>
          📊 Voir mes résultats
          <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>
            Historique et analyses de performance
          </div>
        </button>
        
        {/* Bouton spécial mode démo */}
        {isDemoMode && (
          <button 
            onClick={clearDemoHistory}
            disabled={clearingDemo}
            style={{
              background: clearingDemo ? '#95a5a6' : 'linear-gradient(135deg, #e74c3c, #c0392b)',
              border: 'none',
              borderRadius: '15px',
              padding: '20px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: clearingDemo ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: clearingDemo ? 'none' : '0 5px 15px rgba(231, 76, 60, 0.3)',
              opacity: clearingDemo ? 0.7 : 1
            }}
          >
            {clearingDemo ? (
              <>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>⏳ Nettoyage...</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  Vidage en cours
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>🧹 Vider Historique Démo</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  Effacer tous les tests démo enregistrés
                </div>
              </>
            )}
          </button>
        )}
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