import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

function Results({ user }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(`/api/results/${user.id}`);
        setResults(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des résultats:', error);
        setLoading(false);
      }
    };

    fetchResults();
  }, [user.id]);

  // Fonction pour supprimer un test spécifique
  const deleteTest = async (testIndex) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce test ?')) return;
    
    console.log('🗑️ Suppression du test index:', testIndex);
    console.log('👤 User ID:', user.id);
    
    setDeleteLoading(true);
    try {
      console.log('🔄 Envoi de la requête de suppression...');
      const deleteResponse = await axios.delete(`/api/tests/${user.id}/${testIndex}`);
      console.log('✅ Réponse suppression:', deleteResponse.data);
      
      // Recharger les résultats
      console.log('🔄 Rechargement des résultats...');
      const response = await axios.get(`/api/results/${user.id}`);
      console.log('📊 Nouveaux résultats:', response.data);
      setResults(response.data);
      
      // Forcer le rechargement de la page pour éviter les problèmes de cache
      alert('Test supprimé avec succès !');
      window.location.reload();
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      console.error('❌ Error response:', error.response);
      alert(`Erreur lors de la suppression du test: ${error.response?.data?.error || error.message}`);
    }
    setDeleteLoading(false);
  };

  // Fonction pour supprimer tout l'historique
  const deleteAllTests = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer TOUT votre historique de tests ? Cette action est irréversible !')) return;
    
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/tests/${user.id}/all`);
      setResults({ tests: [], averageScore: 0, interpretation: 'Aucun test effectué' });
      alert('Historique entièrement supprimé !');
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'historique.');
    }
    setDeleteLoading(false);
  };

  // Fonction pour aller à la révision d'un test
  const reviewTest = (testIndex) => {
    console.log('🔍 Tentative de révision du test index:', testIndex);
    
    if (!results || !results.tests || testIndex < 0 || testIndex >= results.tests.length) {
      console.error('❌ Index de test invalide:', testIndex);
      alert('Erreur: Test non trouvé');
      return;
    }
    
    // Les tests sont affichés triés par date (plus récent en premier)
    // Index 0 = dernier test (8 août 19:04) = Index DB 5
    // Index 1 = avant-dernier (8 août 18:58) = Index DB 4  
    // Index 2 = (8 août 18:43) = Index DB 3
    // etc.
    
    let dbIndex;
    if (testIndex === 0) dbIndex = 5; // Dernier test
    else if (testIndex === 1) dbIndex = 4; // Avant-dernier
    else if (testIndex === 2) dbIndex = 3; // 3ème plus récent
    else if (testIndex === 3) dbIndex = 2; // 4ème plus récent 
    else if (testIndex === 4) dbIndex = 1; // 5ème plus récent
    else if (testIndex === 5) dbIndex = 0; // Plus ancien
    else dbIndex = testIndex; // Fallback
    
    console.log('🎯 Mapping: testIndex', testIndex, '→ dbIndex', dbIndex);
    navigate(`/review/${dbIndex}`);
  };

  if (loading) {
    return (
      <div className="results-container">
        <h2>📊 Chargement de vos résultats...</h2>
      </div>
    );
  }

  // Informations du dernier test (si disponibles)
  const latestTestData = location.state;
  const hasLatestTest = latestTestData && latestTestData.iq !== undefined;

  // Fonction pour obtenir la couleur selon l'IQ
  const getIQColor = (iq) => {
    if (iq >= 130) return '#2e7d32'; // Vert foncé
    if (iq >= 120) return '#388e3c'; // Vert
    if (iq >= 110) return '#1976d2'; // Bleu
    if (iq >= 90) return '#ff9800'; // Orange
    if (iq >= 80) return '#f57c00'; // Orange foncé
    return '#d32f2f'; // Rouge
  };

  // Fonction pour obtenir l'emoji selon l'IQ
  const getIQEmoji = (iq) => {
    if (iq >= 130) return '🧠✨';
    if (iq >= 120) return '🎯';
    if (iq >= 110) return '📈';
    if (iq >= 90) return '✅';
    if (iq >= 80) return '📊';
    return '⚠️';
  };

  return (
    <div className="results-container">
      <h2>🧠 Évaluation de votre Intelligence (QI)</h2>
      
      {/* Résultat du dernier test avec IQ */}
      {hasLatestTest && (
        <div style={{ 
          background: `linear-gradient(135deg, ${getIQColor(latestTestData.iq)} 0%, ${getIQColor(latestTestData.iq)}dd 100%)`,
          color: 'white',
          padding: '40px',
          borderRadius: '20px',
          marginBottom: '30px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '18px', opacity: 0.9, marginBottom: '10px' }}>
            🎉 Test {latestTestData.testLevel === 'full' ? 'Complet' : latestTestData.testLevel === 'short' ? 'Rapide' : 'Standard'} Terminé !
          </div>
          
          {/* Affichage principal de l'IQ */}
          <div style={{ fontSize: '72px', fontWeight: 'bold', margin: '20px 0' }}>
            {getIQEmoji(latestTestData.iq)} {latestTestData.iq}
          </div>
          
          <div style={{ fontSize: '24px', fontWeight: '600', marginBottom: '15px' }}>
            QI: {latestTestData.classification.level}
          </div>
          
          <div style={{ fontSize: '16px', opacity: 0.9, marginBottom: '20px' }}>
            {latestTestData.classification.description}
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '15px',
            marginTop: '25px'
          }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '10px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{latestTestData.latestScore}%</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Score du test</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '10px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{latestTestData.percentile}e</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Percentile</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '10px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{latestTestData.totalQuestions}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Questions</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '10px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{latestTestData.difficulty.toFixed(1)}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Difficulté moy.</div>
            </div>
          </div>
        </div>
      )}

      {/* Comparaison avec la population */}
      {hasLatestTest && latestTestData.populationComparison && (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '25px', 
          borderRadius: '15px',
          marginBottom: '30px',
          border: '2px solid #dee2e6'
        }}>
          <h3 style={{ color: '#333', marginBottom: '20px', textAlign: 'center' }}>
            📊 Comparaison avec la population générale
          </h3>
          
          <div style={{ textAlign: 'center', fontSize: '18px', marginBottom: '20px' }}>
            {latestTestData.populationComparison.description}
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-around',
            alignItems: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#28a745' }}>
                {latestTestData.populationComparison.betterThan}%
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>Moins bon que vous</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#dc3545' }}>
                {latestTestData.populationComparison.worseThan}%
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>Meilleur que vous</div>
            </div>
          </div>
        </div>
      )}

      {/* Échelle d'IQ avec positionnement */}
      {hasLatestTest && (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '25px', 
          borderRadius: '15px',
          marginBottom: '30px',
          border: '2px solid #dee2e6'
        }}>
          <h3 style={{ color: '#333', marginBottom: '20px', textAlign: 'center' }}>
            📏 Échelle d'Intelligence (QI)
          </h3>
          
          <div style={{ position: 'relative', margin: '20px 0' }}>
            {/* Barre d'échelle */}
            <div style={{
              width: '100%',
              height: '30px',
              background: 'linear-gradient(to right, #d32f2f 0%, #f57c00 20%, #ff9800 40%, #1976d2 60%, #388e3c 80%, #2e7d32 100%)',
              borderRadius: '15px',
              position: 'relative'
            }}>
              {/* Marqueur de position */}
              <div style={{
                position: 'absolute',
                left: `${Math.min(Math.max((latestTestData.iq - 60) / 140 * 100, 0), 100)}%`,
                top: '-10px',
                transform: 'translateX(-50%)',
                width: '20px',
                height: '50px',
                background: '#000',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                ▼
              </div>
            </div>
            
            {/* Étiquettes */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginTop: '15px',
              fontSize: '12px',
              color: '#666'
            }}>
              <span>60</span>
              <span>80</span>
              <span>100</span>
              <span>120</span>
              <span>140</span>
              <span>160+</span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginTop: '5px',
              fontSize: '10px',
              color: '#999'
            }}>
              <span>Déficient</span>
              <span>Limite</span>
              <span>Moyen</span>
              <span>Supérieur</span>
              <span>Très supérieur</span>
              <span>Exceptionnel</span>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '15px', fontWeight: 'bold', color: getIQColor(latestTestData.iq) }}>
            Votre QI: {latestTestData.iq} ({latestTestData.classification.level})
          </div>
        </div>
      )}

      {/* Conseils personnalisés */}
      {hasLatestTest && latestTestData.advice && (
        <div style={{ 
          background: '#e3f2fd', 
          padding: '25px', 
          borderRadius: '15px',
          marginBottom: '30px',
          border: '2px solid #1976d2'
        }}>
          <h3 style={{ color: '#1565c0', marginBottom: '20px' }}>
            💡 Conseils personnalisés pour vous
          </h3>
          <ul style={{ color: '#1565c0', lineHeight: '1.8', textAlign: 'left' }}>
            {latestTestData.advice.map((advice, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>• {advice}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Historique des tests avec IQ */}
      {results && results.tests.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#333', margin: 0 }}>
              📈 Historique de vos QI
            </h3>
            <button
              onClick={deleteAllTests}
              disabled={deleteLoading}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '15px',
                fontSize: '12px',
                cursor: deleteLoading ? 'not-allowed' : 'pointer',
                opacity: deleteLoading ? 0.6 : 1
              }}
            >
              {deleteLoading ? '⏳ Suppression...' : '🗑️ Supprimer tout'}
            </button>
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {results.tests
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((test, index) => (
              <div key={index} style={{
                background: '#f8f9fa',
                padding: '20px',
                marginBottom: '15px',
                borderRadius: '10px',
                border: '2px solid #dee2e6'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                      Test {test.testType} ({test.testLevel || 'standard'})
                      {index === 0 && hasLatestTest && (
                        <span style={{ 
                          background: '#28a745', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          marginLeft: '10px'
                        }}>
                          NOUVEAU
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#666', fontSize: '14px' }}>
                      {new Date(test.date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {test.classification && (
                      <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>
                        {test.classification.level}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: 'bold',
                      color: test.iq ? getIQColor(test.iq) : '#999',
                      marginBottom: '5px'
                    }}>
                      QI {test.iq || 'N/A'}
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      color: '#666',
                      marginBottom: '10px'
                    }}>
                      {test.score}% réussite
                    </div>
                  </div>
                </div>
                
                {/* Boutons d'action */}
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginTop: '15px',
                  paddingTop: '15px',
                  borderTop: '1px solid #dee2e6'
                }}>
                  <button
                    onClick={() => reviewTest(index)}
                    style={{
                      background: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      padding: '8px 15px',
                      borderRadius: '15px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    📝 Réviser les réponses
                  </button>
                  <button
                    onClick={() => deleteTest(index)}
                    disabled={deleteLoading}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '8px 15px',
                      borderRadius: '15px',
                      fontSize: '12px',
                      cursor: deleteLoading ? 'not-allowed' : 'pointer',
                      opacity: deleteLoading ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aucun test effectué */}
      {(!results || results.tests.length === 0) && !hasLatestTest && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          color: '#666'
        }}>
          <h3>🤔 Aucun test effectué</h3>
          <p>Passez votre premier test pour découvrir votre QI !</p>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        justifyContent: 'center',
        marginTop: '40px'
      }}>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          🧠 Nouveau test
        </button>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          🏠 Tableau de bord
        </button>
      </div>
    </div>
  );
}

export default Results;