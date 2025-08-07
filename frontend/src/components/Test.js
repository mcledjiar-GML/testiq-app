import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Test({ user }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const startTest = async () => {
      try {
        const response = await axios.post('/api/tests/start', { 
          testType: 'raven' 
        });
        setQuestions(response.data.questions);
        if (response.data.questions.length > 0) {
          setTimeLeft(response.data.questions[0].timeLimit || 60);
        }
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du démarrage du test:', error);
        setLoading(false);
      }
    };

    startTest();
  }, []);

  // Timer pour chaque question
  useEffect(() => {
    if (timeLeft > 0 && !loading && questions.length > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !loading && questions.length > 0) {
      // Temps écoulé, passer à la question suivante
      handleAnswer(-1); // -1 indique une réponse non donnée
    }
  }, [timeLeft, loading, questions.length]);

  const handleAnswer = (selectedOption) => {
    const newAnswers = [...answers, {
      questionId: questions[currentQuestion]._id,
      selectedOption,
      correctAnswer: questions[currentQuestion].correctAnswer,
      timeUsed: (questions[currentQuestion].timeLimit || 60) - timeLeft
    }];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      // Question suivante
      setCurrentQuestion(currentQuestion + 1);
      setTimeLeft(questions[currentQuestion + 1].timeLimit || 60);
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
        testType: 'raven'
      });
      
      // Rediriger vers les résultats avec le score
      navigate('/results', { 
        state: { 
          latestScore: response.data.score,
          correctAnswers: response.data.correctAnswers,
          totalQuestions: finalAnswers.length
        }
      });
    } catch (error) {
      console.error('Erreur lors de la soumission du test:', error);
      alert('Erreur lors de la sauvegarde du test. Veuillez réessayer.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="test-container">
        <h2>🧠 Préparation du test...</h2>
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

      <div styl