import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

function Review({ user }) {
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const navigate = useNavigate();
  const { testIndex } = useParams();

  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        console.log('🔄 Chargement des données de révision pour le test:', testIndex);
        console.log('👤 User ID:', user?.id);
        
        if (!user || !user.id) {
          console.error('❌ Utilisateur non défini');
          alert('Erreur: Utilisateur non connecté');
          navigate('/login');
          return;
        }
        
        if (!testIndex || isNaN(parseInt(testIndex))) {
          console.error('❌ Index de test invalide:', testIndex);
          alert('Erreur: Index de test invalide');
          navigate('/results');
          return;
        }
        
        const response = await axios.get(`/api/tests/${user.id}/${testIndex}/review`);
        console.log('✅ Données de révision reçues:', response.data);
        console.log('🔍 Détails des answers:', response.data.answers);
        console.log('📊 Nombre de questions:', response.data.answers?.length);
        console.log('🎯 Première question:', response.data.answers?.[0]);
        console.log('🔍 Structure première question:', JSON.stringify(response.data.answers?.[0], null, 2));
        console.log('📝 Contenu question:', response.data.answers?.[0]?.question);
        console.log('🎯 Options:', response.data.answers?.[0]?.options);
        setReviewData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des données de révision:', error);
        console.error('❌ Error details:', error.response?.data);
        
        if (error.response?.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          navigate('/login');
        } else if (error.response?.status === 400) {
          alert('Test non trouvé ou index invalide.');
          navigate('/results');
        } else {
          alert(`Erreur lors du chargement de la révision: ${error.response?.data?.error || error.message}`);
          navigate('/results');
        }
        setLoading(false);
      }
    };

    fetchReviewData();
  }, [user, testIndex, navigate]);

  if (loading) {
    return (
      <div className="review-container">
        <h2>📖 Chargement de la révision...</h2>
      </div>
    );
  }

  if (!reviewData || !reviewData.answers || !reviewData.answers.length) {
    return (
      <div className="review-container">
        <h2>❌ Aucune donnée de révision disponible</h2>
        <p>Ce test ne peut pas être révisé.</p>
        <button 
          onClick={() => navigate('/results')}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            borderRadius: '20px',
            cursor: 'pointer'
          }}
        >
          Retour aux résultats
        </button>
      </div>
    );
  }

  const currentAnswer = reviewData.answers[currentQuestion];
  if (!currentAnswer) {
    return (
      <div className="review-container">
        <h2>❌ Question non trouvée</h2>
        <p>La question demandée n'existe pas.</p>
        <button 
          onClick={() => navigate('/results')}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            borderRadius: '20px',
            cursor: 'pointer'
          }}
        >
          Retour aux résultats
        </button>
      </div>
    );
  }
  
  const progress = ((currentQuestion + 1) / reviewData.answers.length) * 100;

  const getAnswerColor = (isCorrect) => {
    return isCorrect ? '#28a745' : '#dc3545';
  };

  const getAnswerIcon = (isCorrect, yourAnswer) => {
    if (yourAnswer === -1) return '⏰';
    return isCorrect ? '✅' : '❌';
  };

  return (
    <div className="review-container">
      {/* En-tête avec informations du test */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '25px',
        borderRadius: '15px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 15px 0' }}>📖 Révision du Test</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', fontSize: '14px' }}>
          <div>
            <strong>Type:</strong> {reviewData.testInfo?.testType || 'N/A'} ({reviewData.testInfo?.testLevel || 'N/A'})
          </div>
          <div>
            <strong>QI:</strong> {reviewData.testInfo?.iq || 'N/A'}
          </div>
          <div>
            <strong>Score:</strong> {reviewData.testInfo?.score || 'N/A'}%
          </div>
          <div>
            <strong>Date:</strong> {reviewData.testInfo?.date ? new Date(reviewData.testInfo.date).toLocaleDateString('fr-FR') : 'N/A'}
          </div>
        </div>
      </div>

      {/* Navigation et progression */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>Question {currentQuestion + 1}/{reviewData.answers.length}</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              style={{
                background: currentQuestion === 0 ? '#ccc' : '#6c757d',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '15px',
                cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Précédente
            </button>
            <button
              onClick={() => setCurrentQuestion(Math.min(reviewData.answers.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === reviewData.answers.length - 1}
              style={{
                background: currentQuestion === reviewData.answers.length - 1 ? '#ccc' : '#6c757d',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '15px',
                cursor: currentQuestion === reviewData.answers.length - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Suivante →
            </button>
          </div>
        </div>
        
        {/* Barre de progression */}
        <div style={{
          width: '100%',
          height: '8px',
          background: '#e0e0e0',
          borderRadius: '4px'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
      </div>

      {/* Question actuelle */}
      <div style={{
        background: '#f8f9fa',
        padding: '25px',
        borderRadius: '15px',
        marginBottom: '20px',
        border: '2px solid #dee2e6'
      }}>
        {/* Métadonnées de la question */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          marginBottom: '20px',
          fontSize: '12px',
          color: '#666'
        }}>
          <span style={{
            background: '#e9ecef',
            padding: '4px 8px',
            borderRadius: '8px'
          }}>
            📊 Série {currentAnswer?.series || 'N/A'}
          </span>
          <span style={{
            background: '#e9ecef',
            padding: '4px 8px',
            borderRadius: '8px'
          }}>
            🎯 Difficulté {currentAnswer?.difficulty || 0}/10
          </span>
          <span style={{
            background: '#e9ecef',
            padding: '4px 8px',
            borderRadius: '8px'
          }}>
            📂 {currentAnswer?.category || 'N/A'}
          </span>
          {currentAnswer?.timeUsed > 0 && (
            <span style={{
              background: '#e9ecef',
              padding: '4px 8px',
              borderRadius: '8px'
            }}>
              ⏱️ {currentAnswer.timeUsed}s utilisées
            </span>
          )}
        </div>

        {/* Texte de la question */}
        <h4 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          marginBottom: '20px',
          color: '#333'
        }}>
          {currentAnswer?.question || 'Question non disponible'}
        </h4>

        {/* Options de réponse */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '15px',
          marginBottom: '25px'
        }}>
          {(currentAnswer?.options || []).map((option, index) => {
            let buttonStyle = {
              padding: '15px',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'default',
              textAlign: 'left',
              position: 'relative'
            };

            // Couleur selon le type de réponse
            if (index === currentAnswer?.correctAnswer) {
              // Bonne réponse
              buttonStyle = {
                ...buttonStyle,
                background: '#d4edda',
                border: '2px solid #28a745',
                color: '#155724'
              };
            } else if (index === currentAnswer?.yourAnswer && !currentAnswer?.isCorrect) {
              // Votre mauvaise réponse
              buttonStyle = {
                ...buttonStyle,
                background: '#f8d7da',
                border: '2px solid #dc3545',
                color: '#721c24'
              };
            } else {
              // Autres options
              buttonStyle = {
                ...buttonStyle,
                background: '#f8f9fa',
                border: '2px solid #dee2e6',
                color: '#495057'
              };
            }

            return (
              <div key={index} style={buttonStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Icône de statut */}
                  {index === currentAnswer?.correctAnswer && (
                    <span style={{ fontSize: '20px' }}>✅</span>
                  )}
                  {index === currentAnswer?.yourAnswer && !currentAnswer?.isCorrect && (
                    <span style={{ fontSize: '20px' }}>
                      {currentAnswer?.yourAnswer === -1 ? '⏰' : '❌'}
                    </span>
                  )}
                  
                  <span>{option}</span>
                  
                  {/* Étiquettes */}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
                    {index === currentAnswer?.correctAnswer && (
                      <span style={{
                        background: '#28a745',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        CORRECTE
                      </span>
                    )}
                    {index === currentAnswer?.yourAnswer && (
                      <span style={{
                        background: currentAnswer?.isCorrect ? '#28a745' : '#dc3545',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        VOTRE CHOIX
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explication */}
        <div style={{
          background: currentAnswer?.isCorrect ? '#d4edda' : '#f8d7da',
          border: `2px solid ${currentAnswer?.isCorrect ? '#28a745' : '#dc3545'}`,
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <h5 style={{ 
            color: currentAnswer?.isCorrect ? '#155724' : '#721c24',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {getAnswerIcon(currentAnswer?.isCorrect, currentAnswer?.yourAnswer)}
            {currentAnswer?.isCorrect ? 'Bonne réponse !' : 'Réponse incorrecte'}
          </h5>
          <p style={{ 
            color: currentAnswer?.isCorrect ? '#155724' : '#721c24',
            margin: 0,
            lineHeight: '1.5'
          }}>
            {currentAnswer?.explanation || 'Aucune explication disponible'}
          </p>
        </div>
      </div>

      {/* Navigation rapide */}
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '15px',
        marginBottom: '25px',
        border: '2px solid #dee2e6'
      }}>
        <h4 style={{ marginBottom: '15px', color: '#333' }}>🗺️ Navigation rapide</h4>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px'
        }}>
          {(reviewData.answers || []).map((answer, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                background: answer?.isCorrect ? '#28a745' : '#dc3545',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px',
                position: 'relative',
                opacity: index === currentQuestion ? 1 : 0.7,
                transform: index === currentQuestion ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s ease'
              }}
            >
              {index + 1}
              {index === currentQuestion && (
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '6px',
                  height: '6px',
                  background: '#fff',
                  borderRadius: '50%'
                }}></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Résumé */}
      <div style={{
        background: '#e3f2fd',
        padding: '20px',
        borderRadius: '15px',
        marginBottom: '25px',
        border: '2px solid #1976d2'
      }}>
        <h4 style={{ color: '#1565c0', marginBottom: '15px' }}>📊 Résumé de votre performance</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '15px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745' }}>
              {reviewData.summary?.correctAnswers || 0}
            </div>
            <div style={{ color: '#1565c0', fontSize: '12px' }}>Bonnes réponses</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc3545' }}>
              {(reviewData.summary?.totalQuestions || 0) - (reviewData.summary?.correctAnswers || 0)}
            </div>
            <div style={{ color: '#1565c0', fontSize: '12px' }}>Erreurs</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1976d2' }}>
              {(reviewData.summary?.averageDifficulty || 0).toFixed(1)}
            </div>
            <div style={{ color: '#1565c0', fontSize: '12px' }}>Difficulté moyenne</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff9800' }}>
              {reviewData.testInfo?.iq || 'N/A'}
            </div>
            <div style={{ color: '#1565c0', fontSize: '12px' }}>QI obtenu</div>
          </div>
        </div>
      </div>

      {/* Boutons de navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        justifyContent: 'center'
      }}>
        <button 
          onClick={() => navigate('/results')}
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
          📊 Retour aux résultats
        </button>
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
      </div>
    </div>
  );
}

export default Review;