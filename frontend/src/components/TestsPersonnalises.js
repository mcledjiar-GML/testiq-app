import React from 'react';
import { useNavigate } from 'react-router-dom';

function TestsPersonnalises({ user }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '30px',
        gap: '15px'
      }}>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 15px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Retour
        </button>
        <h2 style={{ margin: 0 }}>⚙️ Tests Personnalisés</h2>
      </div>
      
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '40px' }}>
        Choisissez le type de test qui correspond à vos besoins :
      </p>

      {/* Section 1: Tests Guidés */}
      <div style={{ marginBottom: '50px' }}>
        <h3 style={{ 
          color: '#2c3e50', 
          marginBottom: '25px', 
          fontSize: '24px',
          borderBottom: '3px solid #3498db',
          paddingBottom: '10px'
        }}>
          🏠 Tests Guidés (Progression Recommandée)
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
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
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🟢 Débutant</div>
            <div style={{ fontSize: '16px', marginBottom: '5px' }}>Série A uniquement</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              12 questions • 15 min • Difficulté 1-2
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
              Idéal pour découvrir les tests de QI
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
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🟡 Intermédiaire</div>
            <div style={{ fontSize: '16px', marginBottom: '5px' }}>Séries A + B</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              24 questions • 25 min • Difficulté 1-4
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
              Test équilibré recommandé
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
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🟠 Avancé</div>
            <div style={{ fontSize: '16px', marginBottom: '5px' }}>Séries A + B + C</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              36 questions • 45 min • Difficulté 1-6
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
              Challenge de raisonnement spatial
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
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔴 Expert</div>
            <div style={{ fontSize: '16px', marginBottom: '5px' }}>Toutes séries A-E</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              60 questions • 90 min • Difficulté 1-10
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
              Test complet professionnel Raven
            </div>
          </button>
        </div>
      </div>

      {/* Section 2: Tests par Série */}
      <div style={{ marginBottom: '50px' }}>
        <h3 style={{ 
          color: '#2c3e50', 
          marginBottom: '25px', 
          fontSize: '24px',
          borderBottom: '3px solid #e67e22',
          paddingBottom: '10px'
        }}>
          📚 Tests par Série (Spécialisés)
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '15px' 
        }}>
          <button 
            onClick={() => navigate('/test?mode=serie&serie=A')}
            style={{
              background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
              border: 'none',
              borderRadius: '12px',
              padding: '20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>📖 Série A - Bases</div>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>
              Questions 1-12 • Difficulté 1-2
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Rotation, séquences, alternance
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/test?mode=serie&serie=B')}
            style={{
              background: 'linear-gradient(135deg, #3498db, #2980b9)',
              border: 'none',
              borderRadius: '12px',
              padding: '20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>📔 Série B - Logique</div>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>
              Questions 13-24 • Difficulté 3-4
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Relations spatiales, analogies
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/test?mode=serie&serie=C')}
            style={{
              background: 'linear-gradient(135deg, #f39c12, #e67e22)',
              border: 'none',
              borderRadius: '12px',
              padding: '20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>📘 Série C - Spatial</div>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>
              Questions 25-36 • Difficulté 5-6
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Matrices 3x3, transformations
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/test?mode=serie&serie=D')}
            style={{
              background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
              border: 'none',
              borderRadius: '12px',
              padding: '20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>📕 Série D - Complexe</div>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>
              Questions 37-48 • Difficulté 7-8
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Raisonnement abstrait avancé
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/test?mode=serie&serie=E')}
            style={{
              background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
              border: 'none',
              borderRadius: '12px',
              padding: '20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>📚 Série E - Genius</div>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>
              Questions 49-60 • Difficulté 9-10
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Capacités exceptionnelles
            </div>
          </button>
        </div>
      </div>

      {/* Section 3: Tests Ciblés */}
      <div style={{ marginBottom: '50px' }}>
        <h3 style={{ 
          color: '#2c3e50', 
          marginBottom: '25px', 
          fontSize: '24px',
          borderBottom: '3px solid #9b59b6',
          paddingBottom: '10px'
        }}>
          🎯 Tests Ciblés par QI
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '15px' 
        }}>
          <button 
            onClick={() => navigate('/test?mode=cible&qi=90-110')}
            style={{
              background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
              border: 'none',
              borderRadius: '12px',
              padding: '20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>🎯 QI 90-110</div>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '5px' }}>
              Intelligence Moyenne
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Série A • 12 questions
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/test?mode=cible&qi=110-120')}
            style={{
              background: 'linear-gradient(135deg, #3498db, #2980b9)',
              border: 'none',
              borderRadius: '12px',
              padding: '20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>🎯 QI 110-120</div>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '5px' }}>
              Supérieur à la Moyenne
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Séries A+B • 24 questions
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/test?mode=cible&qi=120-130')}
            style={{
              background: 'linear-gradient(135deg, #f39c12, #e67e22)',
              border: 'none',
              borderRadius: '12px',
              padding: '20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>🎯 QI 120-130</div>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '5px' }}>
              Intelligence Supérieure
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Séries A+B+C • 36 questions
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/test?mode=cible&qi=130+')}
            style={{
              background: 'linear-gradient(135deg, #8e44ad, #9b59b6)',
              border: 'none',
              borderRadius: '12px',
              padding: '20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '5px' }}>🎯 QI 130+</div>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '5px' }}>
              Très Supérieur
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Toutes séries • 60 questions
            </div>
          </button>
        </div>
      </div>

      {/* Info section */}
      <div style={{ 
        marginTop: '50px', 
        padding: '25px', 
        background: '#f8f9fa', 
        borderRadius: '15px',
        textAlign: 'left'
      }}>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>ℹ️ Guide de sélection</h3>
        <div style={{ color: '#666', lineHeight: '1.6', fontSize: '14px' }}>
          <p><strong>🏠 Tests Guidés :</strong> Progression naturelle du plus simple au plus complexe</p>
          <p><strong>📚 Tests par Série :</strong> Idéal pour travailler un type de raisonnement spécifique</p>
          <p><strong>🎯 Tests Ciblés :</strong> Évaluation dans une tranche de QI précise</p>
        </div>
      </div>
    </div>
  );
}

export default TestsPersonnalises;