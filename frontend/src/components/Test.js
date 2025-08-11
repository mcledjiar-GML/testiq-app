import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QuestionVisual from './QuestionVisual';
import RotationSequence from './RotationSequence';
import SemicircleSVG from './SemicircleSVG';
import Matrix3x3 from './Matrix3x3';
import SemicircleOptionSVG from './SemicircleOptionSVG';

function Test({ user }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const testLevel = searchParams.get('level') || 'standard';

  useEffect(() => {
    const startTest = async () => {
      try {
        const response = await axios.post('/api/tests/start', { 
          testType: 'raven',
          level: testLevel
        });
        setQuestions(response.data.questions);
        if (response.data.questions.length > 0) {
          setTimeLeft(response.data.questions[0].timeLimit || 60);
        }
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du démarrage du test:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        } else if (error.response?.data?.error) {
          alert(`Erreur: ${error.response.data.error}`);
        } else {
          alert('Erreur de connexion. Veuillez réessayer.');
        }
        setLoading(false);
      }
    };

    startTest();
  }, [navigate]);

  // Mapping des options (support ancien/nouveau format) et état ready
  const currentOptions = useMemo(() => {
    const currentQ = questions[currentQuestion];
    return currentQ?.options ?? currentQ?.choices ?? [];
  }, [questions, currentQuestion]);

  // Ready = quand on a exactement 4 options
  useEffect(() => {
    if (currentOptions.length === 4 && !loading) {
      setReady(true);
    } else {
      setReady(false);
    }
  }, [currentOptions, loading]);

  // Timer ne démarre QUE quand ready=true (évite timer figé)
  useEffect(() => {
    if (!ready) return; // Garde-fou principal
    
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      // Temps écoulé, passer à la question suivante
      handleAnswer(-1); // -1 indique une réponse non donnée
    }
  }, [timeLeft, ready]);

  // Reset ready à chaque changement de question
  useEffect(() => {
    setReady(false);
    setShowHint(false);
    setHintUsed(false);
  }, [currentQuestion]);

  const handleAnswer = (selectedOption) => {
    if (questions.length === 0 || currentQuestion >= questions.length) {
      return;
    }
    
    const newAnswers = [...answers, {
      questionId: questions[currentQuestion]._id,
      selectedOption,
      correctAnswer: questions[currentQuestion].correctAnswer,
      timeUsed: (questions[currentQuestion].timeLimit || 60) - timeLeft,
      hintUsed: hintUsed // -10% du score si vrai
    }];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      // Question suivante
      const nextIndex = currentQuestion + 1;
      setCurrentQuestion(nextIndex);
      setTimeLeft(questions[nextIndex]?.timeLimit || 60);
    } else {
      // Fin du test
      submitTest(newAnswers);
    }
  };

  const submitTest = async (finalAnswers) => {
    try {
      const response = await axios.post('/api/tests/submit', {
        userId: user.id,
        answers: finalAnswers,
        testType: 'raven',
        testLevel: testLevel
      });
      
      // Rediriger vers les résultats avec tous les nouveaux données
      navigate('/results', { 
        state: { 
          latestScore: response.data.score,
          correctAnswers: response.data.correctAnswers,
          totalQuestions: finalAnswers.length,
          iq: response.data.iq,
          classification: response.data.classification,
          percentile: response.data.percentile,
          advice: response.data.advice,
          populationComparison: response.data.populationComparison,
          testLevel: response.data.testLevel,
          difficulty: response.data.difficulty
        }
      });
    } catch (error) {
      console.error('Erreur lors de la soumission du test:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else if (error.response?.data?.error) {
        alert(`Erreur: ${error.response.data.error}`);
      } else {
        alert('Erreur lors de la sauvegarde du test. Veuillez réessayer.');
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const testLevelNames = {
    'short': '⚡ Test rapide',
    'standard': '🧠 Test standard', 
    'full': '🎯 Test complet Raven'
  };

  if (loading) {
    return (
      <div className="test-container">
        <h2>{testLevelNames[testLevel]} - Préparation...</h2>
        <p>Chargement des questions de test de QI...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="test-container">
        <h2>❌ Erreur</h2>
        <p>Impossible de charger les questions du test.</p>
        <button onClick={() => navigate('/dashboard')}>
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  // Garde-fou UI : question sans 4 options
  if (currentOptions.length !== 4 && !loading) {
    console.error('ERREUR: Question sans options valides!', {
      questionId: questions[currentQuestion]?._id,
      series: questions[currentQuestion]?.series,
      questionIndex: questions[currentQuestion]?.questionIndex,
      optionsCount: currentOptions.length,
      currentOptions: currentOptions
    });

    return (
      <div className="test-container">
        <h2>⚠️ Question indisponible</h2>
        <p style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
          Cette question est temporairement indisponible (options manquantes).
        </p>
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => handleAnswer(-1)}
            style={{ 
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Passer à la question suivante
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;


  return (
    <div className="test-container">
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Question {currentQuestion + 1}/{questions.length}</h2>
          <div style={{ 
            background: timeLeft <= 10 ? '#ff6b6b' : '#667eea', 
            color: 'white', 
            padding: '8px 15px', 
            borderRadius: '20px',
            fontWeight: 'bold'
          }}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>
        
        {/* Barre de progression */}
        <div style={{ 
          width: '100%', 
          height: '8px', 
          background: '#e0e0e0', 
          borderRadius: '4px',
          marginTop: '10px'
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

      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '15px', lineHeight: '1.4' }}>
          {questions[currentQuestion]?.content || 
           questions[currentQuestion]?.question || 
           `Question ${currentQuestion + 1} - Contenu non disponible`}
        </h3>
        
        {/* Affichage spécial pour la Question 1 de rotation */}
        {questions[currentQuestion]?.series === 'A' && questions[currentQuestion]?.questionIndex === 1 ? (
          <RotationSequence 
            showHint={showHint}
            onHintClick={() => {
              setShowHint(true);
              setHintUsed(true);
            }}
          />
        ) : (
          <>
            {/* Affichage du stimulus si disponible pour autres questions */}
            {questions[currentQuestion]?.stimulus && (
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                textAlign: 'center',
                padding: '15px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                {questions[currentQuestion].stimulus}
              </div>
            )}
            
            {/* 🎨 VISUEL PROFESSIONNEL pour autres questions */}
            {/* Désactivé pour Q3 (fusion de 2 items différents) et Q7 (matrice 3x3 custom) */}
            {questions[currentQuestion]?.questionIndex !== 3 && 
             questions[currentQuestion]?.questionIndex !== 7 && (
              <QuestionVisual 
                questionId={`Q${questions[currentQuestion]?.questionIndex || (currentQuestion + 1)}`}
                questionContent={questions[currentQuestion]?.content}
                category={questions[currentQuestion]?.category}
              />
            )}
            
            {/* Affichage spécial pour Question 3 - séquence simple */}
            {questions[currentQuestion]?.questionIndex === 3 && (
              <div style={{ 
                background: '#ffffff', 
                padding: '24px', 
                borderRadius: '12px',
                border: '1px solid #e0e0e0',
                marginBottom: '20px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <div style={{ 
                  fontSize: '48px', 
                  letterSpacing: '8px',
                  fontFamily: 'monospace',
                  margin: '20px 0'
                }}>
                  ● ○ ● ○ <span style={{ 
                    color: '#667eea', 
                    border: '2px dashed #667eea', 
                    padding: '4px 12px',
                    borderRadius: '50%',
                    fontSize: '40px'
                  }}>?</span>
                </div>
                <p style={{ 
                  color: '#666', 
                  fontSize: '14px', 
                  margin: '10px 0 0 0' 
                }}>
                  Complétez la séquence
                </p>
              </div>
            )}
            
            {/* Affichage spécial pour Question 7 - Matrice 3×3 cohérente */}
            {questions[currentQuestion]?.questionIndex === 7 && (
              <Matrix3x3 
                showHint={showHint}
                onHintClick={() => {
                  setShowHint(true);
                  setHintUsed(true);
                }}
              />
            )}
          </>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginTop: '20px' }}>
          {currentOptions.map((option, index) => {
              // Support both old format (string) and new format (object with text/alt)
              const optionText = typeof option === 'string' ? option : option.text;
              const optionAlt = typeof option === 'object' && option.alt ? option.alt : `Option ${index + 1}`;
              const optionRotation = typeof option === 'object' && option.rotation ? option.rotation : null;
              
              // Cas spéciaux : Questions avec SVG custom
              const isRotationQuestion = questions[currentQuestion]?.series === 'A' && questions[currentQuestion]?.questionIndex === 1;
              const isMatrixQuestion = questions[currentQuestion]?.questionIndex === 7;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  title={optionAlt}
                  aria-label={optionAlt}
                  style={{
                    padding: (isRotationQuestion || isMatrixQuestion) ? '16px' : '15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontSize: (isRotationQuestion || isMatrixQuestion) ? '14px' : '26px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: (isRotationQuestion || isMatrixQuestion) ? '96px' : '80px',
                    minWidth: (isRotationQuestion || isMatrixQuestion) ? '96px' : 'auto',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = '#f0f2ff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.background = 'white';
                  }}
                >
                  {isRotationQuestion && optionRotation ? (
                    <>
                      <SemicircleSVG 
                        rotation={optionRotation} 
                        size={56} 
                        alt={optionAlt}
                      />
                      <div style={{ 
                        marginTop: '8px', 
                        fontSize: '14px', 
                        color: '#000000',
                        fontWeight: 'bold'
                      }}>
                        {String.fromCharCode(65 + index)}
                      </div>
                    </>
                  ) : isMatrixQuestion && typeof option === 'object' && option.type === 'semicircle' ? (
                    <>
                      <SemicircleOptionSVG 
                        type={optionText}
                        size={56} 
                        alt={optionAlt}
                      />
                      <div style={{ 
                        marginTop: '8px', 
                        fontSize: '14px', 
                        color: '#000000',
                        fontWeight: 'bold'
                      }}>
                        {String.fromCharCode(65 + index)}
                      </div>
                    </>
                  ) : (
                    optionText
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default Test;