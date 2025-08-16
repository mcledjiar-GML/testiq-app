import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import QuestionVisual from './QuestionVisual';
import RotationSequence from './RotationSequence';
import SemicircleSVG from './SemicircleSVG';
import Matrix3x3 from './Matrix3x3';
import SemicircleOptionSVG from './SemicircleOptionSVG';
import Grid2x2 from './Grid2x2';
import AlternatingSequence from './AlternatingSequence';

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
  const testMode = searchParams.get('mode') || 'standard';
  const testSerie = searchParams.get('serie') || null;

  useEffect(() => {
    const startTest = async () => {
      try {
        const response = await api.post('/api/tests/start', { 
          testType: 'raven',
          level: testLevel,
          mode: testMode,
          serie: testSerie
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

  // Define functions first
  const submitTest = useCallback(async (finalAnswers) => {
    try {
      // Mode démo : utiliser un userId factice si pas d'utilisateur connecté
      const isDemoMode = process.env.REACT_APP_AUTH_REQUIRED === 'false';
      const userId = isDemoMode && !user ? 'demo-placeholder' : user.id;
      
      const response = await api.post('/api/tests/submit', {
        userId: userId,
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
  }, [user, testLevel, navigate]);

  const handleAnswer = useCallback((selectedOption) => {
    if (questions.length === 0 || currentQuestion >= questions.length) {
      return;
    }
    
    const newAnswers = [...answers, {
      questionId: questions[currentQuestion]._id,
      questionIndex: questions[currentQuestion].questionIndex,
      selectedOption,
      correctAnswer: questions[currentQuestion].correctAnswer,
      timeUsed: (questions[currentQuestion].timeLimit || 60) - timeLeft,
      hintUsed: hintUsed, // -10% du score si vrai
      testPosition: currentQuestion + 1, // Position dans ce test spécifique
      // 🎯 NOUVEAU : Sauvegarder l'ordre exact des options et les valeurs réelles
      optionsOrder: questions[currentQuestion].options,
      selectedOptionValue: questions[currentQuestion].options[selectedOption],
      correctOptionValue: questions[currentQuestion].options[questions[currentQuestion].correctAnswer]
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
  }, [questions, currentQuestion, answers, timeLeft, hintUsed, submitTest]);

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
  }, [timeLeft, ready, handleAnswer]);

  // Reset ready à chaque changement de question
  useEffect(() => {
    setReady(false);
    setShowHint(false);
    setHintUsed(false);
  }, [currentQuestion]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fonction pour rendre les formes de Q5
  const renderQ5Shape = (shapeType, size = 48) => {
    const commonStyles = {
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    switch (shapeType) {
      case 'triangle':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" style={commonStyles}>
            <polygon 
              points="50,15 85,75 15,75" 
              fill="#000000" 
              stroke="#000000" 
              strokeWidth="2"
            />
          </svg>
        );
      case 'square':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" style={commonStyles}>
            <rect 
              x="20" y="20" 
              width="60" height="60" 
              fill="#000000" 
              stroke="#000000" 
              strokeWidth="2"
            />
          </svg>
        );
      case 'circle':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" style={commonStyles}>
            <circle 
              cx="50" cy="50" r="30" 
              fill="#000000" 
              stroke="#000000" 
              strokeWidth="2"
            />
          </svg>
        );
      case 'diamond':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" style={commonStyles}>
            <polygon 
              points="50,15 85,50 50,85 15,50" 
              fill="none" 
              stroke="#000000" 
              strokeWidth="3"
            />
          </svg>
        );
      default:
        return null;
    }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Retour au menu
          </button>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Question {currentQuestion + 1}/{questions.length}</h2>
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
        
        {/* Affichage spécialisé pour les questions Q1-Q12 */}
        {questions[currentQuestion]?.series === 'A' && questions[currentQuestion]?.questionIndex === 1 ? (
          <RotationSequence 
            showHint={showHint}
            onHintClick={() => {
              setShowHint(true);
              setHintUsed(true);
            }}
          />
        ) : questions[currentQuestion]?.series === 'A' && questions[currentQuestion]?.questionIndex === 3 ? (
          <AlternatingSequence 
            sequenceType="circles"
            showHint={showHint}
            onHintClick={() => {
              setShowHint(true);
              setHintUsed(true);
            }}
          />
        ) : questions[currentQuestion]?.series === 'A' && questions[currentQuestion]?.questionIndex === 5 ? (
          <Grid2x2 
            mode="alternating"
            showHint={showHint}
            onHintClick={() => {
              setShowHint(true);
              setHintUsed(true);
            }}
          />
        ) : questions[currentQuestion]?.series === 'A' && questions[currentQuestion]?.questionIndex === 7 ? (
          <Matrix3x3 
            showHint={showHint}
            onHintClick={() => {
              setShowHint(true);
              setHintUsed(true);
            }}
          />
        ) : questions[currentQuestion]?.series === 'A' && questions[currentQuestion]?.questionIndex === 9 ? (
          <AlternatingSequence 
            sequenceType="stars"
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
            {/* Désactivé pour questions avec composants spécialisés */}
            {![1, 3, 5, 7, 9, 12].includes(questions[currentQuestion]?.questionIndex) && (
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
                  margin: '20px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  {/* Cercle noir plein */}
                  <svg width="50" height="50" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="#000" stroke="#000" strokeWidth="2"/>
                  </svg>
                  {/* Cercle blanc contour */}
                  <svg width="50" height="50" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="white" stroke="#000" strokeWidth="3"/>
                  </svg>
                  {/* Cercle noir plein */}
                  <svg width="50" height="50" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="#000" stroke="#000" strokeWidth="2"/>
                  </svg>
                  {/* Cercle blanc contour */}
                  <svg width="50" height="50" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="white" stroke="#000" strokeWidth="3"/>
                  </svg>
                  {/* Point d'interrogation */}
                  <span style={{ 
                    color: '#667eea', 
                    border: '3px dashed #667eea', 
                    padding: '8px 16px',
                    borderRadius: '50%',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    minWidth: '50px',
                    minHeight: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
            
            {/* Affichage spécial pour Question 12 - Séquence de rotation */}
            {questions[currentQuestion]?.questionIndex === 12 && (
              <div style={{ 
                background: '#ffffff', 
                padding: '24px', 
                borderRadius: '12px',
                border: '1px solid #e0e0e0',
                marginBottom: '25px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                {/* Stimulus SVG: Séquence 0°, 45°, 90°, ? */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '20px',
                  marginBottom: '16px'
                }}>
                  {[0, 45, 90].map((angle, index) => (
                    <div key={index} style={{ textAlign: 'center' }}>
                      <svg width="60" height="60" viewBox="0 0 100 100">
                        <line 
                          x1="50" y1="50" 
                          x2="50" y2="20"
                          stroke="#000" 
                          strokeWidth="3"
                          transform={`rotate(${angle} 50 50)`}
                        />
                      </svg>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {angle}°
                      </div>
                    </div>
                  ))}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      border: '2px dashed #667eea', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      color: '#667eea',
                      fontWeight: 'bold'
                    }}>
                      ?
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      ?
                    </div>
                  </div>
                </div>
                
                <p style={{ 
                  color: '#666', 
                  fontSize: '14px', 
                  margin: '0',
                  fontWeight: '500'
                }}>
                  Quelle vignette complète la séquence ? (rotation +45° à chaque étape)
                </p>
              </div>
            )}
          </>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginTop: '20px' }}>
          {currentOptions.map((option, index) => {
              // Support both old format (string) and new format (object with text/alt)
              const optionText = typeof option === 'string' ? option : option.text;
              const optionAlt = typeof option === 'object' && option.alt ? option.alt : `Option ${index + 1}`;
              const optionRotation = typeof option === 'object' && option.rotation ? option.rotation : null;
              
              // Cas spéciaux : Questions avec composants custom
              const isRotationQuestion = questions[currentQuestion]?.series === 'A' && questions[currentQuestion]?.questionIndex === 1;
              const isAlternatingQuestion = [3, 5, 9].includes(questions[currentQuestion]?.questionIndex);
              const isMatrixGridQuestion = questions[currentQuestion]?.series === 'A' && questions[currentQuestion]?.questionIndex === 7;
              
              const isMatrixQuestion = questions[currentQuestion]?.questionIndex === 7 && typeof option === 'object' && option.type === 'semicircle';
              const isQ12RotationSequence = questions[currentQuestion]?.questionIndex === 12;
              const isQ7MatrixVisual = questions[currentQuestion]?.questionIndex === 7 && typeof option === 'object' && option.visual;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  title={optionAlt}
                  aria-label={optionAlt}
                  className={isRotationQuestion ? 'svg-container-clickable' : ''}
                  style={{
                    padding: (isQ12RotationSequence || isQ7MatrixVisual || isAlternatingQuestion) ? '12px' : (isRotationQuestion || isMatrixQuestion) ? '16px' : '15px',
                    border: (isQ12RotationSequence || isQ7MatrixVisual || isAlternatingQuestion) ? '2px solid #dee2e6' : '2px solid #e0e0e0',
                    borderRadius: '8px',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontSize: (isRotationQuestion || isMatrixQuestion || isQ12RotationSequence || isQ7MatrixVisual || isAlternatingQuestion) ? '14px' : '26px',
                    transition: 'border-color 0.2s ease, background-color 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    // Zone cliquable garantie ≥44px 
                    minHeight: isRotationQuestion ? 'var(--touch-target-optimal, 48px)' : (isQ12RotationSequence || isQ7MatrixVisual || isAlternatingQuestion) ? '80px' : (isMatrixQuestion) ? '96px' : '80px',
                    minWidth: isRotationQuestion ? 'var(--touch-target-optimal, 48px)' : (isQ12RotationSequence || isQ7MatrixVisual || isAlternatingQuestion) ? '80px' : (isMatrixQuestion) ? '96px' : 'auto',
                    boxShadow: (isQ12RotationSequence || isQ7MatrixVisual || isAlternatingQuestion) ? '0 1px 3px rgba(0,0,0,0.08)' : '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (isQ12RotationSequence || isQ7MatrixVisual || isAlternatingQuestion) {
                      e.target.style.borderColor = '#6c757d';
                      e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.12)';
                    } else {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.background = '#f0f2ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isQ12RotationSequence || isQ7MatrixVisual || isAlternatingQuestion) {
                      e.target.style.borderColor = '#dee2e6';
                      e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                    } else {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.background = 'white';
                    }
                  }}
                >
                  {isRotationQuestion && optionRotation ? (
                    <>
                      <SemicircleSVG 
                        rotation={optionRotation} 
                        size={64}
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
                  ) : isAlternatingQuestion ? (
                    // Q3, Q5, Q9 - Options alternées simples avec format texte (●, ○, ◼, ◻, ★, ☆)
                    <>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '50px'
                      }}>
                        {optionText === '●' ? (
                          <svg width="40" height="40" viewBox="0 0 50 50">
                            <circle cx="25" cy="25" r="20" fill="#000" stroke="#000" strokeWidth="2"/>
                          </svg>
                        ) : optionText === '○' ? (
                          <svg width="40" height="40" viewBox="0 0 50 50">
                            <circle cx="25" cy="25" r="20" fill="white" stroke="#000" strokeWidth="3"/>
                          </svg>
                        ) : (
                          <span style={{ 
                            fontSize: '32px',
                            fontFamily: 'Arial, sans-serif',
                            lineHeight: '1'
                          }}>
                            {optionText}
                          </span>
                        )}
                      </div>
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
                        type={
                          option.rotation === 'left' ? 'half_left' :
                          option.rotation === 'right' ? 'half_right' :
                          option.rotation === 'up' ? 'half_up' :
                          option.rotation === 'down' ? 'half_down' :
                          'empty'
                        }
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
                  ) : isQ12RotationSequence && typeof option === 'object' && option.rotation ? (
                    // Q12 - Segments de rotation SVG inline (80x80px cibles tactiles)
                    <>
                      <svg width="60" height="60" viewBox="0 0 100 100" style={{ display: 'block' }}>
                        <line 
                          x1="50" y1="50" 
                          x2="50" y2="20"
                          stroke="#000" 
                          strokeWidth="3"
                          transform={`rotate(${option.rotation} 50 50)`}
                        />
                      </svg>
                      <div style={{ 
                        marginTop: '8px', 
                        fontSize: '12px', 
                        color: '#000000',
                        fontWeight: 'bold'
                      }}>
                        {String.fromCharCode(65 + index)} - {option.text}
                      </div>
                    </>
                  ) : isQ7MatrixVisual ? (
                    // Q7 - Vignettes pures (style grille exact, pas de lettres)
                    <img 
                      src={option.visual} 
                      alt={option.alt || 'Motif grille'}
                      aria-label={option.aria || option.alt || 'Option visuelle grille'}
                      style={{ 
                        width: '60px', 
                        height: '60px',
                        minWidth: '60px',
                        minHeight: '60px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        pointerEvents: 'none'
                      }}
                    />
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