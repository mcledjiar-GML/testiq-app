// Questions Raven complètes - 60 questions en 5 séries
const ravenQuestions = [
  // SÉRIE A - Questions simples (12 questions, difficulté 1-2)
  {
    type: 'raven',
    series: 'A',
    difficulty: 1,
    content: 'Complétez le motif: Quel forme manque dans cette séquence?',
    options: ['◐', '◑', '◒', '◓'],
    correctAnswer: 0,
    category: 'spatial',
    timeLimit: 45
  },
  {
    type: 'raven',
    series: 'A',
    difficulty: 1,
    content: 'Continuez la séquence: 2, 4, 6, 8, ?',
    options: ['9', '10', '11', '12'],
    correctAnswer: 1,
    category: 'logique',
    timeLimit: 30
  },
  {
    type: 'raven',
    series: 'A',
    difficulty: 1,
    content: 'Quel motif complète la série: ●○●○?',
    options: ['●', '○', '●○', '○●'],
    correctAnswer: 0,
    category: 'spatial',
    timeLimit: 35
  },
  {
    type: 'raven',
    series: 'A',
    difficulty: 2,
    content: 'Complétez: 1, 3, 5, 7, ?',
    options: ['8', '9', '10', '11'],
    correctAnswer: 1,
    category: 'logique',
    timeLimit: 40
  },
  {
    type: 'raven',
    series: 'A',
    difficulty: 2,
    content: 'Trouvez le motif manquant dans cette grille 2x2',
    options: ['△', '□', '○', '◇'],
    correctAnswer: 2,
    category: 'spatial',
    timeLimit: 50
  },
  {
    type: 'raven',
    series: 'A',
    difficulty: 2,
    content: 'Continuez: A, C, E, G, ?',
    options: ['H', 'I', 'J', 'K'],
    correctAnswer: 1,
    category: 'verbal',
    timeLimit: 35
  },
  {
    type: 'raven',
    series: 'A',
    difficulty: 1,
    content: 'Complétez la suite: 10, 20, 30, 40, ?',
    options: ['45', '50', '55', '60'],
    correctAnswer: 1,
    category: 'logique',
    timeLimit: 30
  },
  {
    type: 'raven',
    series: 'A',
    difficulty: 2,
    content: 'Quel symbole manque: ★☆★☆?',
    options: ['★', '☆', '✦', '✧'],
    correctAnswer: 0,
    category: 'spatial',
    timeLimit: 40
  },
  {
    type: 'raven',
    series: 'A',
    difficulty: 2,
    content: 'Suite numérique: 5, 10, 15, 20, ?',
    options: ['22', '24', '25', '30'],
    correctAnswer: 2,
    category: 'logique',
    timeLimit: 35
  },
  {
    type: 'raven',
    series: 'A',
    difficulty: 1,
    content: 'Motif simple: □■□■?',
    options: ['□', '■', '□■', '■□'],
    correctAnswer: 0,
    category: 'spatial',
    timeLimit: 30
  },
  {
    type: 'raven',
    series: 'A',
    difficulty: 2,
    content: 'Complétez: 100, 90, 80, 70, ?',
    options: ['65', '60', '55', '50'],
    correctAnswer: 1,
    category: 'logique',
    timeLimit: 40
  },
  {
    type: 'raven',
    series: 'A',
    difficulty: 2,
    content: 'Dernier élément de la série A: rotation simple',
    options: ['↑', '→', '↓', '←'],
    correctAnswer: 2,
    category: 'spatial',
    timeLimit: 45
  },

  // SÉRIE B - Complexité moyenne (12 questions, difficulté 3-4)
  {
    type: 'raven',
    series: 'B',
    difficulty: 3,
    content: 'Analogie: 2 est à 4 comme 3 est à ?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 1,
    category: 'logique',
    timeLimit: 50
  },
  {
    type: 'raven',
    series: 'B',
    difficulty: 3,
    content: 'Matrice 2x2 avec rotation: trouvez l\'élément manquant\n\n🔲 MATRICE 2×2:\n[  ↗  ][  ↓  ]\n[  ↑  ][  ?  ]\n\n↗ → ↓ = Rotation 90° horaire ↻\nDonc: ↑ → ?',
    options: ['⬆', '⬇', '⬅', '➡'],
    correctAnswer: 3,
    category: 'spatial',
    timeLimit: 60
  },
  {
    type: 'raven',
    series: 'B',
    difficulty: 4,
    content: 'Suite de Fibonacci: 1, 1, 2, 3, 5, ?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 2,
    category: 'logique',
    timeLimit: 55
  },
  {
    type: 'raven',
    series: 'B',
    difficulty: 3,
    content: 'Si tous les A sont B et certains B sont C, alors:',
    options: ['Tous A sont C', 'Certains A sont C', 'Aucun A est C', 'Impossible à dire'],
    correctAnswer: 3,
    category: 'logique',
    timeLimit: 70
  },
  {
    type: 'raven',
    series: 'B',
    difficulty: 4,
    content: 'Motif complexe avec superposition de formes',
    options: ['◐', '◑', '◒', '◓'],
    correctAnswer: 1,
    category: 'spatial',
    timeLimit: 65
  },
  {
    type: 'raven',
    series: 'B',
    difficulty: 3,
    content: 'Progression arithmétique: 7, 14, 21, 28, ?',
    options: ['32', '35', '38', '42'],
    correctAnswer: 1,
    category: 'logique',
    timeLimit: 45
  },
  {
    type: 'raven',
    series: 'B',
    difficulty: 4,
    content: 'Analogie visuelle: △ est à ▽ comme □ est à ?',
    options: ['■', '◇', '○', '◈'],
    correctAnswer: 0,
    category: 'spatial',
    timeLimit: 60
  },
  {
    type: 'raven',
    series: 'B',
    difficulty: 3,
    content: 'Suite géométrique: 2, 6, 18, 54, ?',
    options: ['108', '150', '162', '180'],
    correctAnswer: 2,
    category: 'logique',
    timeLimit: 55
  },
  {
    type: 'raven',
    series: 'B',
    difficulty: 4,
    content: 'Matrice 3x3 avec progression de remplissage',
    options: ['25%', '50%', '75%', '100%'],
    correctAnswer: 2,
    category: 'spatial',
    timeLimit: 70
  },
  {
    type: 'raven',
    series: 'B',
    difficulty: 3,
    content: 'Logique: Si A>B et B>C, alors A ? C',
    options: ['<', '=', '>', 'Indéterminé'],
    correctAnswer: 2,
    category: 'logique',
    timeLimit: 50
  },
  {
    type: 'raven',
    series: 'B',
    difficulty: 4,
    content: 'Rotation et réflexion combinées',
    options: ['↖', '↗', '↙', '↘'],
    correctAnswer: 1,
    category: 'spatial',
    timeLimit: 65
  },
  {
    type: 'raven',
    series: 'B',
    content: 'Série B finale: motif complexe en spirale',
    difficulty: 4,
    options: ['🌀', '🔄', '↻', '↺'],
    correctAnswer: 2,
    category: 'spatial',
    timeLimit: 70
  },

  // SÉRIE C - Difficulté élevée (12 questions, difficulté 5-6)
  {
    type: 'raven',
    series: 'C',
    difficulty: 5,
    content: 'Matrice complexe avec multiple transformations',
    options: ['⬢', '⬡', '⬟', '⬞'],
    correctAnswer: 0,
    category: 'spatial',
    timeLimit: 80
  },
  {
    type: 'raven',
    series: 'C',
    difficulty: 5,
    content: 'Suite: 1, 4, 9, 16, 25, ?',
    options: ['30', '32', '36', '40'],
    correctAnswer: 2,
    category: 'logique',
    timeLimit: 60
  },
  {
    type: 'raven',
    series: 'C',
    difficulty: 6,
    content: 'Raisonnement complexe: Si P→Q et Q→R, alors P→R ?',
    options: ['Vrai', 'Faux', 'Parfois vrai', 'Indéterminable'],
    correctAnswer: 0,
    category: 'logique',
    timeLimit: 90
  },
  {
    type: 'raven',
    series: 'C',
    difficulty: 5,
    content: 'Superposition de 3 motifs géométriques',
    options: ['▨', '▦', '▤', '▣'],
    correctAnswer: 3,
    category: 'spatial',
    timeLimit: 75
  },
  {
    type: 'raven',
    series: 'C',
    difficulty: 6,
    content: 'Suite prime: 2, 3, 5, 7, 11, ?',
    options: ['12', '13', '14', '15'],
    correctAnswer: 1,
    category: 'logique',
    timeLimit: 70
  },
  {
    type: 'raven',
    series: 'C',
    difficulty: 5,
    content: 'Transformation spatiale en 3D mentale',
    options: ['⚀', '⚁', '⚂', '⚃'],
    correctAnswer: 2,
    category: 'spatial',
    timeLimit: 85
  },
  {
    type: 'raven',
    series: 'C',
    difficulty: 6,
    content: 'Progression: x, x², x³, x⁴, ? (avec x=2)',
    options: ['16', '24', '32', '40'],
    correctAnswer: 2,
    category: 'logique',
    timeLimit: 80
  },
  {
    type: 'raven',
    series: 'C',
    difficulty: 5,
    content: 'Matrice avec règles multiples appliquées',
    options: ['⬖', '⬗', '⬘', '⬙'],
    correctAnswer: 1,
    category: 'spatial',
    timeLimit: 90
  },
  {
    type: 'raven',
    series: 'C',
    difficulty: 6,
    content: 'Logique booléenne: (A ∧ B) ∨ (¬A ∧ ¬B) = ?',
    options: ['A', 'B', 'A ⊕ B', '¬(A ⊕ B)'],
    correctAnswer: 3,
    category: 'logique',
    timeLimit: 100
  },
  {
    type: 'raven',
    series: 'C',
    difficulty: 5,
    content: 'Symétries multiples et rotations',
    options: ['⟐', '⟑', '⟒', '⟓'],
    correctAnswer: 0,
    category: 'spatial',
    timeLimit: 85
  },
  {
    type: 'raven',
    series: 'C',
    difficulty: 6,
    content: 'Suite complexe: 1, 1, 2, 3, 5, 8, 13, ?',
    options: ['18', '20', '21', '23'],
    correctAnswer: 2,
    category: 'logique',
    timeLimit: 75
  },
  {
    type: 'raven',
    series: 'C',
    difficulty: 6,
    content: 'Série C finale: intégration de tous les concepts',
    options: ['◈', '◉', '◊', '○'],
    correctAnswer: 0,
    category: 'spatial',
    timeLimit: 95
  },

  // SÉRIE D - Très difficile (12 questions, difficulté 7-8)
  {
    type: 'raven',
    series: 'D',
    difficulty: 7,
    content: 'Matrice 3x3 avec transformations multiples complexes',
    options: ['⬢', '⬣', '⬤', '⬥'],
    correctAnswer: 1,
    category: 'spatial',
    timeLimit: 100
  },
  {
    type: 'raven',
    series: 'D',
    difficulty: 7,
    content: 'Suite: n! où n = 1,2,3,4,5, donc ?',
    options: ['60', '100', '120', '140'],
    correctAnswer: 2,
    category: 'logique',
    timeLimit: 90
  },
  {
    type: 'raven',
    series: 'D',
    difficulty: 8,
    content: 'Raisonnement modal: ◇P → □◇P, si ◇P alors ?',
    options: ['P', '□P', '◇◇P', '□◇P'],
    correctAnswer: 3,
    category: 'logique',
    timeLimit: 120
  },
  {
    type: 'raven',
    series: 'D',
    difficulty: 7,
    content: 'Transformation géométrique en 4 dimensions',
    options: ['⧈', '⧉', '⧊', '⧋'],
    correctAnswer: 2,
    category: 'spatial',
    timeLimit: 110
  },
  {
    type: 'raven',
    series: 'D',
    difficulty: 8,
    content: 'Suite de Catalan: 1,1,2,5,14,42,?',
    options: ['120', '132', '140', '150'],
    correctAnswer: 1,
    category: 'logique',
    timeLimit: 100
  },
  {
    type: 'raven',
    series: 'D',
    difficulty: 7,
    content: 'Motif fractal auto-similaire niveau 3',
    options: ['⟡', '⟢', '⟣', '⟤'],
    correctAnswer: 0,
    category: 'spatial',
    timeLimit: 115
  },
  {
    type: 'raven',
    series: 'D',
    difficulty: 8,
    content: 'Progression: 2^1, 3^2, 4^3, 5^4, donc 6^?',
    options: ['1296', '1944', '7776', '15625'],
    correctAnswer: 2,
    category: 'logique',
    timeLimit: 95
  },
  {
    type: 'raven',
    series: 'D',
    difficulty: 7,
    content: 'Composition de transformations non-commutatives',
    options: ['⚬', '⚭', '⚮', '⚯'],
    correctAnswer: 1,
    category: 'spatial',
    timeLimit: 105
  },
  {
    type: 'raven',
    series: 'D',
    difficulty: 8,
    content: 'Théorie des ensembles: P(A∪B) si |A|=3, |B|=4, |A∩B|=1',
    options: ['6', '7', '12', '24'],
    correctAnswer: 0,
    category: 'logique',
    timeLimit: 110
  },
  {
    type: 'raven',
    series: 'D',
    difficulty: 7,
    content: 'Tessellation complexe avec contraintes',
    options: ['⬟', '⬠', '⬡', '⬢'],
    correctAnswer: 3,
    category: 'spatial',
    timeLimit: 120
  },
  {
    type: 'raven',
    series: 'D',
    difficulty: 8,
    content: 'Suite récurrente: a(n) = a(n-1) + a(n-2) + a(n-3)',
    options: ['81', '88', '94', '100'],
    correctAnswer: 0,
    category: 'logique',
    timeLimit: 100
  },
  {
    type: 'raven',
    series: 'D',
    difficulty: 8,
    content: 'Série D finale: synthèse de tous les patterns',
    options: ['◆', '◇', '◈', '◉'],
    correctAnswer: 2,
    category: 'spatial',
    timeLimit: 125
  },

  // SÉRIE E - Extrêmement difficile (12 questions, difficulté 9-10)
  {
    type: 'raven',
    series: 'E',
    difficulty: 9,
    content: 'Matrice 4x4 avec règles interdépendantes',
    options: ['⬢', '⬣', '⬤', '⬥'],
    correctAnswer: 0,
    category: 'spatial',
    timeLimit: 130
  },
  {
    type: 'raven',
    series: 'E',
    difficulty: 9,
    content: 'Suite de Ackermann: A(2,1), A(2,2), A(2,3), A(2,4)?',
    options: ['11', '13', '15', '19'],
    correctAnswer: 3,
    category: 'logique',
    timeLimit: 120
  },
  {
    type: 'raven',
    series: 'E',
    difficulty: 10,
    content: 'Logique temporelle: □◇P ∧ ◇□Q → ?',
    options: ['◇(P∧Q)', '□(P∨Q)', '◇□(P→Q)', '□◇(P∧Q)'],
    correctAnswer: 2,
    category: 'logique',
    timeLimit: 150
  },
  {
    type: 'raven',
    series: 'E',
    difficulty: 9,
    content: 'Hypercube en projection 2D avec rotations',
    options: ['⧄', '⧅', '⧆', '⧇'],
    correctAnswer: 1,
    category: 'spatial',
    timeLimit: 140
  },
  {
    type: 'raven',
    series: 'E',
    difficulty: 10,
    content: 'Suite de Bell: 1,1,2,5,15,52,203,?',
    options: ['800', '877', '900', '950'],
    correctAnswer: 1,
    category: 'logique',
    timeLimit: 130
  },
  {
    type: 'raven',
    series: 'E',
    difficulty: 9,
    content: 'Transformation topologique préservant l\'homéomorphisme',
    options: ['◐', '◑', '◒', '◓'],
    correctAnswer: 2,
    category: 'spatial',
    timeLimit: 135
  },
  {
    type: 'raven',
    series: 'E',
    difficulty: 10,
    content: 'Théorie des graphes: chromatic number du graphe de Petersen',
    options: ['2', '3', '4', '5'],
    correctAnswer: 1,
    category: 'logique',
    timeLimit: 140
  },
  {
    type: 'raven',
    series: 'E',
    difficulty: 9,
    content: 'Groupe de symétrie D6 appliqué à un hexagone',
    options: ['⬢', '⬡', '⬟', '⬞'],
    correctAnswer: 0,
    category: 'spatial',
    timeLimit: 125
  },
  {
    type: 'raven',
    series: 'E',
    difficulty: 10,
    content: 'Suite de Motzkin: 1,1,2,4,9,21,51,?',
    options: ['120', '127', '132', '140'],
    correctAnswer: 1,
    category: 'logique',
    timeLimit: 135
  },
  {
    type: 'raven',
    series: 'E',
    difficulty: 9,
    content: 'Pavage non-périodique de Penrose',
    options: ['⟐', '⟑', '⟒', '⟓'],
    correctAnswer: 3,
    category: 'spatial',
    timeLimit: 145
  },
  {
    type: 'raven',
    series: 'E',
    difficulty: 10,
    content: 'Fonction de Ramsey: R(3,3) dans un graphe complet',
    options: ['5', '6', '7', '8'],
    correctAnswer: 1,
    category: 'logique',
    timeLimit: 150
  },
  {
    type: 'raven',
    series: 'E',
    difficulty: 10,
    content: 'Série E finale: métacognition et abstraction maximale',
    options: ['∞', '∅', '∃', '∀'],
    correctAnswer: 3,
    category: 'spatial',
    timeLimit: 160
  }
];

module.exports = ravenQuestions;