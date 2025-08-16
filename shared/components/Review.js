import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import QuestionVisual from './QuestionVisual';

function Review({ user }) {
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showDetailedExplanation, setShowDetailedExplanation] = useState(false);
  const [advancedExplanation, setAdvancedExplanation] = useState(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const navigate = useNavigate();
  const { testIndex } = useParams();

  // Réinitialiser l'état des explications détaillées quand on change de question
  useEffect(() => {
    setShowDetailedExplanation(false);
    setAdvancedExplanation(null);
  }, [currentQuestion]);

  // Fonction pour charger l'explication avancée
  const loadAdvancedExplanation = async (questionIndex, questionContent) => {
    try {
      setLoadingExplanation(true);
      console.log(`📡 Envoi requête explication:`, {
        questionId: `Q${questionIndex}`,
        questionContent: questionContent
      });
      
      const response = await api.post('/api/explanation', {
        questionId: `Q${questionIndex}`,
        questionContent: questionContent
      });
      setAdvancedExplanation(response.data.explanation);
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'explication avancée:', error);
      setAdvancedExplanation(null);
    } finally {
      setLoadingExplanation(false);
    }
  };

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
        
        const response = await api.get(`/api/tests/${user.id}/${testIndex}/review`);
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

  // Fonction pour obtenir des explications approfondies selon le type de question
  const getDetailedExplanation = (answer) => {
    const series = answer?.series || 'A';
    const difficulty = answer?.difficulty || 1;
    const category = answer?.category || 'logique';
    
    let content = {};
    
    if (series === 'A' && difficulty <= 3) {
      content = {
        title: "🔍 Série A - Reconnaissance de motifs simples",
        concept: "Les questions de série A testent votre capacité à identifier des motifs visuels et des séquences logiques simples.",
        techniques: [
          "Observez les changements de forme, taille ou position",
          "Identifiez les séquences répétitives ou progressives", 
          "Cherchez les symétries et rotations",
          "Analysez l'ajout ou la suppression d'éléments"
        ],
        examples: "Dans cette question, regardez comment les formes évoluent de gauche à droite et de haut en bas. Y a-t-il une progression logique ?",
        tips: "💡 Astuce : Commencez par identifier quel élément change (forme, position, nombre) puis trouvez la règle."
      };
    } else if (series === 'B' && difficulty <= 5) {
      content = {
        title: "🔄 Série B - Transformations et relations",
        concept: "Les questions de série B impliquent des transformations plus complexes entre les éléments.",
        techniques: [
          "Identifiez les relations entre lignes et colonnes",
          "Cherchez les transformations (rotation, miroir, inversion)",
          "Analysez les opérations logiques (union, intersection)",
          "Observez les changements de propriétés (couleur, texture)"
        ],
        examples: "Cette question teste votre capacité à voir comment deux éléments se combinent pour créer un troisième.",
        tips: "💡 Astuce : Regardez d'abord horizontalement, puis verticalement pour identifier la règle de transformation."
      };
    } else if (series === 'C' && difficulty <= 7) {
      content = {
        title: "📐 Série C - Logique spatiale avancée",
        concept: "Les questions de série C requièrent une analyse spatiale complexe et des raisonnements abstraits.",
        techniques: [
          "Décomposez les figures complexes en éléments simples",
          "Identifiez les superpositions et intersections",
          "Analysez les mouvements dans l'espace 3D",
          "Cherchez les invariants (ce qui ne change pas)"
        ],
        examples: "Ces questions testent votre visualisation spatiale et votre capacité à manipuler mentalement des objets complexes.",
        tips: "💡 Astuce : Utilisez votre imagination pour 'faire tourner' les formes mentalement."
      };
    } else if (series === 'D' && difficulty <= 8) {
      content = {
        title: "🧩 Série D - Raisonnement analogique",
        concept: "Les questions de série D testent votre capacité à voir des analogies et des relations proportionnelles.",
        techniques: [
          "Établissez des relations 'A est à B ce que C est à ?'",
          "Identifiez les transformations proportionnelles",
          "Analysez les changements d'échelle et de proportion",
          "Cherchez les correspondances entre éléments"
        ],
        examples: "Si la première forme se transforme d'une certaine manière, la seconde doit subir la même transformation.",
        tips: "💡 Astuce : Formulez verbalement la relation : 'la première devient la seconde parce que...'."
      };
    } else if (series === 'E' && difficulty >= 9) {
      content = {
        title: "🚀 Série E - Abstraction maximale",
        concept: "Les questions de série E représentent le niveau le plus élevé d'abstraction et de raisonnement complexe.",
        techniques: [
          "Combinez plusieurs types de raisonnement simultanément",
          "Identifiez des règles multiples qui s'appliquent en même temps",
          "Analysez les interactions entre différents systèmes",
          "Utilisez l'élimination systématique des options"
        ],
        examples: "Ces questions peuvent combiner rotations, transformations logiques et relations spatiales complexes.",
        tips: "💡 Astuce : Ne vous découragez pas - même les experts prennent du temps sur ces questions."
      };
    } else if (category === 'spatial') {
      content = {
        title: "🌐 Raisonnement spatial",
        concept: "Ces questions testent votre capacité à manipuler et visualiser des objets dans l'espace.",
        techniques: [
          "Visualisez les rotations en 3D",
          "Imaginez les pliages et dépliages",
          "Analysez les vues sous différents angles",
          "Utilisez des points de référence fixes"
        ],
        examples: "Imaginez que vous tenez l'objet dans vos mains et que vous le faites tourner.",
        tips: "💡 Astuce : Utilisez vos mains pour mimer les mouvements si nécessaire."
      };
    } else {
      content = {
        title: "🎯 Raisonnement logique général",
        concept: "Cette question teste vos capacités de raisonnement logique et d'analyse de motifs.",
        techniques: [
          "Décomposez le problème en étapes simples",
          "Cherchez les régularités et exceptions",
          "Utilisez l'élimination des réponses impossibles",
          "Vérifiez votre réponse en appliquant la règle trouvée"
        ],
        examples: "Cherchez la logique sous-jacente qui gouverne l'évolution des éléments.",
        tips: "💡 Astuce : Prenez le temps d'observer avant de chercher à résoudre rapidement."
      };
    }

    return content;
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
            <strong>Type:</strong> Raven ({reviewData.testInfo?.testLevel === 'short' ? 'rapide' : reviewData.testInfo?.testLevel === 'full' ? 'complet' : 'standard'})
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
              ← Précédent
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
              Suivant →
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
            📊 Raven Série {currentAnswer?.series || 'A'}
          </span>
          {/* **CORRECTION** : Afficher les vrais tags de la BD au lieu de "3×3" codé en dur */}
          {currentAnswer?.explanation && currentAnswer.explanation.includes('(Type:') && (
            <span style={{
              background: '#e9ecef',
              padding: '4px 8px',
              borderRadius: '8px'
            }}>
              🎯 {currentAnswer.explanation.match(/\(Type: ([^)]+)\)/)?.[1] || 'Question'}
            </span>
          )}
          <span style={{
            background: '#e9ecef',
            padding: '4px 8px',
            borderRadius: '8px'
          }}>
            📂 {currentAnswer?.category === 'spatial' ? 'Spatial' : currentAnswer?.category === 'logique' ? 'Logique' : 'Raisonnement'}
          </span>
          {currentAnswer?.timeUsed > 0 && (
            <span style={{
              background: '#e9ecef',
              padding: '4px 8px',
              borderRadius: '8px'
            }}>
              ⏱️ {Math.round(currentAnswer.timeUsed / 1000)}s utilisées
            </span>
          )}
        </div>

        {/* Texte de la question */}
        <h4 style={{ 
          fontSize: '34px', 
          fontWeight: 'bold', 
          marginBottom: '20px',
          color: '#333'
        }}>
          {currentAnswer?.question || 'Question non disponible'}
        </h4>

        {/* 🎨 VISUEL PROFESSIONNEL GÉNÉRATION AUTOMATIQUE */}
        {/* **CORRECTION** : Affichage conditionnel selon le type de question */}
        {currentAnswer?.question && currentAnswer.question.includes('rotation') ? (
          // Pour les questions de rotation : affichage spécifique
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
              fontSize: '18px', 
              fontWeight: 'bold',
              marginBottom: '15px',
              color: '#333'
            }}>
              🔄 Séquence de rotations
            </div>
            <div style={{ 
              fontSize: '48px', 
              letterSpacing: '12px',
              fontFamily: 'monospace',
              margin: '20px 0',
              color: '#667eea'
            }}>
              ◐ ◑ ◒ <span style={{ 
                color: '#dc3545', 
                border: '2px dashed #dc3545', 
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
              Identifiez la rotation suivante dans la séquence
            </p>
          </div>
        ) : currentAnswer?.question && currentAnswer.question.includes('grille 3×3') ? (
          // Pour Q7 : grille 3×3 avec overlay révision
          <div style={{ position: 'relative' }}>
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
                fontSize: '18px', 
                fontWeight: 'bold',
                marginBottom: '15px',
                color: '#333'
              }}>
                📊 Grille 3×3 - Progression de remplissage
              </div>
              
              {/* Grille 3×3 reproduite en révision */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                maxWidth: '300px',
                margin: '0 auto',
                position: 'relative'
              }}>
                {/* Reproduction de la matrice exacte du test */}
                {[
                  '○', '◐', '◑',
                  '◐', '?', '●', 
                  '◑', '●', '○'
                ].map((symbol, index) => {
                  const isMissingCell = symbol === '?';
                  const isCenterCell = index === 4;
                  
                  return (
                    <div
                      key={index}
                      style={{
                        width: '80px',
                        height: '80px',
                        border: isMissingCell ? '3px dashed #667eea' : '2px solid #e0e0e0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ffffff',
                        fontSize: isMissingCell ? '32px' : '40px',
                        fontWeight: 'bold',
                        color: isMissingCell ? '#667eea' : '#333',
                        position: 'relative'
                      }}
                    >
                      {symbol}
                      
                      {/* Overlay case manquante en révision */}
                      {isCenterCell && (
                        <>
                          <div style={{
                            position: 'absolute',
                            top: '-2px',
                            left: '-2px',
                            right: '-2px',
                            bottom: '-2px',
                            border: '3px solid #28a745',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            pointerEvents: 'none'
                          }} />
                          
                          <div style={{
                            position: 'absolute',
                            top: '-12px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: currentAnswer?.isCorrect ? '#28a745' : '#dc3545',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap'
                          }}>
                            {currentAnswer?.isCorrect ? 'Bonne réponse' : 'Case manquante'}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <p style={{ 
                color: '#666', 
                fontSize: '14px', 
                margin: '15px 0 0 0' 
              }}>
                Case centrale (1,1) : progression ○ → ◐ → ◑ → ●
              </p>
            </div>
          </div>
        ) : (
          // Pour les autres questions : visuel automatique avec indexation stable
          <QuestionVisual 
            questionId={currentAnswer?.stableIndex || currentAnswer?.questionIndex || (currentQuestion + 1)}
            questionContent={currentAnswer?.question}
            category={currentAnswer?.category}
          />
        )}

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
              fontSize: '26px',
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
              <div 
                key={index} 
                style={{
                  ...buttonStyle,
                  cursor: 'default', // Pas de curseur pointer en révision
                  pointerEvents: 'none' // Désactivé complètement
                }}
              >
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
                  
                  {/* **NOUVEAU** : Options visuelles pures avec descriptions */}
                  {option.visual ? (
                    // Vignettes visuelles pures (Q7: style grille, Q12: rotation)
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      flexDirection: 'column'
                    }}>
                      <img 
                        src={option.visual} 
                        alt={option.alt || 'Option visuelle'}
                        aria-label={option.aria || option.alt || 'Option visuelle'}
                        style={{ 
                          width: '60px', 
                          height: '60px',
                          minWidth: '60px',
                          minHeight: '60px',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          cursor: 'default', // Désactivé en révision
                          pointerEvents: 'none'
                        }}
                      />
                      {/* Description sous la vignette */}
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#6c757d',
                        textAlign: 'center',
                        lineHeight: '1.3',
                        maxWidth: '80px'
                      }}>
                        {option.description || option.alt || 'Option'}
                      </div>
                    </div>
                  ) : (
                    <span>{typeof option === 'string' ? option : option.text || option}</span>
                  )}
                  
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
                        VOTRE RÉPONSE
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
            margin: '0 0 15px 0',
            lineHeight: '1.5'
          }}>
            {currentAnswer?.explanation || 'Aucune explication disponible'}
          </p>
          
          {/* **NOUVEAU** : Feedback visuel détaillé pour Q7 et Q12 */}
          {(currentAnswer?.options?.some(opt => opt.visual) && !currentAnswer?.isCorrect) && (
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '16px',
              margin: '15px 0',
              fontSize: '14px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#856404' }}>🔍 Comparaison de vos réponses :</strong>
              </div>
              
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Votre réponse */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#721c24', fontWeight: 'bold' }}>Votre choix :</span>
                  {currentAnswer.options[currentAnswer.yourAnswer]?.visual && (
                    <img 
                      src={currentAnswer.options[currentAnswer.yourAnswer].visual}
                      alt={currentAnswer.options[currentAnswer.yourAnswer].alt || 'Votre réponse'}
                      style={{ 
                        width: '32px', 
                        height: '32px',
                        border: '2px solid #dc3545',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  )}
                  <span style={{ fontSize: '12px', color: '#721c24' }}>
                    {currentAnswer.options[currentAnswer.yourAnswer]?.description || currentAnswer.options[currentAnswer.yourAnswer]?.alt || 'Votre choix'}
                  </span>
                </div>
                
                <span style={{ color: '#856404', fontSize: '16px' }}>≠</span>
                
                {/* Bonne réponse */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#155724', fontWeight: 'bold' }}>Bonne réponse :</span>
                  {currentAnswer.options[currentAnswer.correctAnswer]?.visual && (
                    <img 
                      src={currentAnswer.options[currentAnswer.correctAnswer].visual}
                      alt={currentAnswer.options[currentAnswer.correctAnswer].alt || 'Bonne réponse'}
                      style={{ 
                        width: '32px', 
                        height: '32px',
                        border: '2px solid #28a745',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  )}
                  <span style={{ fontSize: '12px', color: '#155724' }}>
                    {currentAnswer.options[currentAnswer.correctAnswer]?.description || currentAnswer.options[currentAnswer.correctAnswer]?.alt || 'Solution correcte'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* **NOUVEAU** : Aide supplémentaire pour Q12 en mode révision */}
          {currentAnswer?.question?.includes('rotation') && currentAnswer?.helpText && (
            <div style={{
              background: '#e3f2fd',
              border: '1px solid #2196f3',
              borderRadius: '8px',
              padding: '12px',
              margin: '10px 0',
              fontSize: '14px'
            }}>
              <strong style={{ color: '#1976d2' }}>💡 Aide à la résolution :</strong>
              <p style={{ margin: '5px 0 0 0', color: '#424242' }}>
                {currentAnswer.helpText}
              </p>
            </div>
          )}
          
          {/* Bouton Savoir plus */}
          <button
            onClick={async () => {
              if (!showDetailedExplanation && !advancedExplanation) {
                // **CORRECTION** : Utiliser l'ID visuel cohérent ou la position originale
                const explanationId = currentAnswer?.visualQuestionId?.replace('Q', '') 
                                   || currentAnswer?.originalTestPosition 
                                   || currentAnswer?.questionIndex 
                                   || (currentQuestion + 1);
                
                console.log(`🔍 Debug - currentAnswer:`, {
                  visualQuestionId: currentAnswer?.visualQuestionId,
                  originalTestPosition: currentAnswer?.originalTestPosition,
                  questionIndex: currentAnswer?.questionIndex,
                  finalId: explanationId,
                  question: currentAnswer?.question?.substring(0, 30),
                  series: currentAnswer?.series
                });
                
                console.log(`✅ Utilisation ID cohérent: ${explanationId}`);
                await loadAdvancedExplanation(explanationId, currentAnswer?.question);
              }
              setShowDetailedExplanation(!showDetailedExplanation);
            }}
            disabled={loadingExplanation}
            style={{
              background: loadingExplanation ? '#6c757d' : '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '15px',
              fontSize: '14px',
              cursor: loadingExplanation ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: '500'
            }}
          >
            {loadingExplanation ? '⏳ Chargement...' : `📚 ${showDetailedExplanation ? 'Masquer le cours' : 'Savoir plus'}`}
          </button>
        </div>

        {/* Explication détaillée */}
        {showDetailedExplanation && (
          <div style={{
            background: '#e8f4fd',
            border: '2px solid #17a2b8',
            borderRadius: '15px',
            padding: '25px',
            marginBottom: '20px'
          }}>
            {advancedExplanation ? (
              // Explication avancée
              <>
                <h3 style={{ 
                  color: '#0c5460', 
                  marginBottom: '20px',
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}>
                  🔄 Série {advancedExplanation.serie} - {advancedExplanation.competence.charAt(0).toUpperCase() + advancedExplanation.competence.slice(1)}
                </h3>
                
                {/* Solution pas-à-pas */}
                {advancedExplanation.solutionPasAPas && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: '#0c5460', marginBottom: '10px' }}>🎯 Solution pas-à-pas</h4>
                    <ol style={{ color: '#0c5460', lineHeight: '1.6', fontSize: '16px' }}>
                      {advancedExplanation.solutionPasAPas.map((step, index) => (
                        <li key={index} style={{ marginBottom: '8px', fontWeight: '500' }}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                
                {/* Règle extraite */}
                {advancedExplanation.regleExtraite && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: '#0c5460', marginBottom: '10px' }}>📏 Règle extraite</h4>
                    <p style={{ 
                      color: '#0c5460', 
                      lineHeight: '1.6', 
                      fontSize: '16px',
                      background: '#b3d9ff',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: '500'
                    }}>
                      {advancedExplanation.regleExtraite}
                    </p>
                  </div>
                )}
                
                {/* Généralisation */}
                {advancedExplanation.generalisation && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: '#0c5460', marginBottom: '10px' }}>🚀 Généralisation</h4>
                    <p style={{ color: '#0c5460', lineHeight: '1.6', fontSize: '16px' }}>
                      {advancedExplanation.generalisation}
                    </p>
                  </div>
                )}
                
                {/* Analyse des distracteurs */}
                {advancedExplanation.analyseDistracteurs && advancedExplanation.analyseDistracteurs.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: '#0c5460', marginBottom: '10px' }}>🎯 Analyse des options</h4>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {advancedExplanation.analyseDistracteurs.map((item, index) => (
                        <div key={index} style={{
                          background: item.raisonChoixFrequent.startsWith('✅') ? '#d4f6d4' : '#ffe6e6',
                          padding: '10px',
                          borderRadius: '8px',
                          border: `1px solid ${item.raisonChoixFrequent.startsWith('✅') ? '#28a745' : '#dc3545'}`
                        }}>
                          <strong>{item.option}</strong>: {item.raisonChoixFrequent}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Nouveau concept */}
                {advancedExplanation.nouveauConcept && advancedExplanation.nouveauConcept.isNew && advancedExplanation.nouveauConcept.fiche && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: '#0c5460', marginBottom: '10px' }}>📚 Nouveau concept</h4>
                    <div style={{
                      background: '#fff3cd',
                      border: '1px solid #ffc107',
                      padding: '15px',
                      borderRadius: '10px'
                    }}>
                      <h5 style={{ color: '#856404', margin: '0 0 10px 0' }}>{advancedExplanation.nouveauConcept.fiche.nom}</h5>
                      <p style={{ color: '#856404', lineHeight: '1.6', fontSize: '14px', margin: '0 0 10px 0' }}>
                        {advancedExplanation.nouveauConcept.fiche.definition}
                      </p>
                      <p style={{ color: '#856404', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>
                        <strong>Application:</strong> {advancedExplanation.nouveauConcept.fiche.application}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Métacognition */}
                {advancedExplanation.metacognition && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: '#0c5460', marginBottom: '10px' }}>⏱️ Métacognition</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      {advancedExplanation.metacognition.tempsCibleSec && (
                        <div style={{
                          background: '#e8f5e8',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #28a745'
                        }}>
                          <strong>Temps cible:</strong> {advancedExplanation.metacognition.tempsCibleSec}s
                        </div>
                      )}
                      {advancedExplanation.metacognition.heuristiqueExpress && (
                        <div style={{
                          background: '#e8f5e8',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #28a745'
                        }}>
                          <strong>Astuce:</strong> {advancedExplanation.metacognition.heuristiqueExpress}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => setShowDetailedExplanation(false)}
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '8px 15px',
                    borderRadius: '15px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    marginTop: '20px',
                    fontWeight: '500'
                  }}
                >
                  ✖️ Fermer le cours
                </button>
              </>
            ) : (
              // Fallback vers l'explication classique
              (() => {
                const detailedContent = getDetailedExplanation(currentAnswer);
                return (
                  <>
                    <h3 style={{ 
                      color: '#0c5460', 
                      marginBottom: '20px',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}>
                      {detailedContent.title}
                    </h3>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ color: '#0c5460', marginBottom: '10px' }}>📖 Concept</h4>
                      <p style={{ color: '#0c5460', lineHeight: '1.6', fontSize: '16px' }}>
                        {detailedContent.concept}
                      </p>
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ color: '#0c5460', marginBottom: '10px' }}>🛠️ Techniques de résolution</h4>
                      <ul style={{ color: '#0c5460', lineHeight: '1.6', fontSize: '16px' }}>
                        {detailedContent.techniques?.map((technique, index) => (
                          <li key={index} style={{ marginBottom: '5px' }}>{technique}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ color: '#0c5460', marginBottom: '10px' }}>💡 Application</h4>
                      <p style={{ color: '#0c5460', lineHeight: '1.6', fontSize: '16px' }}>
                        {detailedContent.examples}
                      </p>
                    </div>
                    
                    <div style={{
                      background: '#b3d9ff',
                      padding: '15px',
                      borderRadius: '10px',
                      border: '1px solid #17a2b8'
                    }}>
                      <p style={{ 
                        color: '#0c5460', 
                        margin: 0, 
                        fontWeight: '500',
                        fontSize: '16px'
                      }}>
                        {detailedContent.tips}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setShowDetailedExplanation(false)}
                      style={{
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '8px 15px',
                        borderRadius: '15px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        marginTop: '20px',
                        fontWeight: '500'
                      }}
                    >
                      ✖️ Fermer le cours
                    </button>
                  </>
                );
              })()
            )}
          </div>
        )}
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

      {/* **CORRECTION** : Résumé seulement si on est à la dernière question */}
      {currentQuestion === reviewData.answers.length - 1 && (
        <div style={{
          background: '#e3f2fd',
          padding: '20px',
          borderRadius: '15px',
          marginBottom: '25px',
          border: '2px solid #1976d2'
        }}>
          <h4 style={{ color: '#1565c0', marginBottom: '15px' }}>🎉 Test terminé - Résumé de votre performance</h4>
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
      )}

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