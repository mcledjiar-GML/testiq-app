import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

function Results({ user }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="results-container">
        <h2>📊 Chargement de vos résultats...</h2>
      </div>
    );
  }

  // Informations du dernier test (si disponibles)
  const latestTestData = location.state;
  const hasLatestTest = latestTestData && latestTestData.latestScore !== undefined;

  return (
    <div className="results-container">
      <h2>📊 Vos Résultats de Tests de QI</h2>
      
      {/* Résultat du dernier test */}
      {hasLatestTest && (
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '30px',
          borderRadius: '15px',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '24px' }}>
            🎉 Test terminé !
          </h3>
          <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '10px 0' }}>
            {latestTestData.latestScore}%
          </div>
          <p style={{ margin: '10px 0', opacity: 0.9 }}>
            {latestTestData.correctAnswers}/{latestTestData.totalQuestions} réponses correctes
          </p>
        </div>
      )}

      {/* Statistiques générales */}
      {results && results.tests.length > 0 ? (
        <div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '25px', 
              borderRadius: '10px',
              textAlign: 'center',
              border: '2px solid #dee2e6'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
                {results.averageScore.toFixed(1)}%
              </div>
              <div style={{ color: '#666', marginTop: '5px' }}>Score moyen</div>
            </div>
            
            <div style={{ 
              background: '#f8f9fa', 
              padding: '25px', 
              borderRadius: '10px',
              textAlign: 'center',
              border: '2px solid #dee2e6'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
                {results.tests.length}
              </div>
              <div style={{ color: '#666', marginTop: '5px' }}>Tests passés</div>
            </div>
            
            <div style={{ 
              background: '#f8f9fa', 
              padding: '25px', 
              borderRadius: '10px',
              textAlign: 'center',
              border: '2px solid #dee2e6'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fd7e14' }}>
                {results.interpretation}
              </div>
              <div style={{ color: '#666', marginTop: '5px' }}>Évaluation</div>
            </div>
          </div>

          {/* Historique des tests */}
          <div style={{ marginTop: '40px' }}>
            <h3 style={{ color: '#333', marginBottom: '20px' }}>
              📈 Historique des tests
            </h3>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {results.tests
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((test, index) => (
                <div key={index} style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  marginBottom: '10px',
                  borderRadius: '10px',
                  border: '2px solid #dee2e6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>
                      Test {test.testType} 
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
                    <div style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                      {new Date(test.date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold',
                    color: test.score >= 70 ? '#28a745' : test.score >= 50 ? '#fd7e14' : '#dc3545'
                  }}>
                    {test.score}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conseils d'amélioration */}
          <div style={{ 
            marginTop: '40px', 
            padding: '25px', 
            background: '#e3f2fd', 
            borderRadius: '10px',
            border: '2px solid #1976d2'
          }}>
            <h4 style={{ color: '#1565c0', marginBottom: '15px' }}>
              💡 Conseils pour améliorer votre score
            </h4>
            <ul style={{ color: '#1565c0', lineHeight: '1.6', textAlign: 'left' }}>
              <li>• Pratiquez régulièrement les tests de logique</li>
              <li>• Travaillez sur la reconnaissance de motifs</li>
              <li>• Améliorez votre concentration et gestion du temps</li>
              <li>• Diversifiez vos types d'exercices mentaux</li>
            </ul>
          </div>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          color: '#666'
        }}>
          <h3>🤔 Aucun test effectué</h3>
          <p>Commencez votre premier test pour voir vos résultats ici.</p>
          <button 
            onClick={() => navigate('/test')}
            style={{
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            🧠 Commencer un test
          </button>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        justifyContent: 'center',
        marginTop: '40px'
      }}>
        <button 
          onClick={() => navigate('/test')}
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