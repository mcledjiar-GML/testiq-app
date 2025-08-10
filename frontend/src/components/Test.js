import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QuestionVisual from './QuestionVisual';

function Test({ user }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
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

  // Timer pour chaque question
  useEffect(() => {
    if (timeLeft > 0 && !loading && questions.length > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !loading && questions.length > 0) {
      // Temps écoulé, passer à la question suivante
      handleAnswer(-1); // -1 indique une réponse non donnée
    }
  }, [timeLeft, loading, questions.length, currentQuestion]);

  const handleAnswer = (selectedOption) => {
    if (questions.length === 0 || currentQuestion >= questions.length) {
      return;
    }
    
    const newAnswers = [...answers, {
      questionId: questions[currentQuestion]._id,
      selectedOption,
      correctAnswer: questions[currentQuestion].correctAnswer,
      timeUsed: (questions[currentQuestion].timeLimit || 60) - timeLeft
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
        
        {/* 🎨 VISUEL PROFESSIONNEL GÉNÉRATION AUTOMATIQUE */}
        <QuestionVisual 
          questionId={`Q${currentQuestion + 1}_${questions[currentQuestion]?.questionIndex || 'test'}`}
          questionContent={questions[currentQuestion]?.content}
          category={questions[currentQuestion]?.category}
        />
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginTop: '20px' }}>
          {questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              style={{
                padding: '15px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '26px',
                transition: 'all 0.2s ease'
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
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Test;