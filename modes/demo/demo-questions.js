// Données démo pour Q7 - Test sans MongoDB
const demoQ7Options = [
  {
    text: "",
    visual: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iNC41IiB5PSI0LjUiIHdpZHRoPSI1MSIgaGVpZ2h0PSI1MSIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2Utd2lkdGg9IjEuNSIgcng9IjEiLz4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMTgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0gMzAgMTIgQSAxOCAxOCAwIDAgMSAzMCA0OCBaIiBmaWxsPSIjMzMzMzMzIi8+Cjwvc3ZnPg==",
    type: "half-right",
    symbol: "◑",
    alt: "Demi-remplissage à droite",
    aria: "Option visuelle: Demi-remplissage à droite",
    description: "Demi-remplissage à droite"
  },
  {
    text: "",
    visual: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iNC41IiB5PSI0LjUiIHdpZHRoPSI1MSIgaGVpZ2h0PSI1MSIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2Utd2lkdGg9IjEuNSIgcng9IjEiLz4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMTgiIGZpbGw9IiMzMzMzMzMiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==",
    type: "full",
    symbol: "●",
    alt: "Remplissage complet",
    aria: "Option visuelle: Remplissage complet",
    description: "Remplissage complet"
  },
  {
    text: "",
    visual: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iNC41IiB5PSI0LjUiIHdpZHRoPSI1MSIgaGVpZ2h0PSI1MSIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2Utd2lkdGg9IjEuNSIgcng9IjEiLz4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMTgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==",
    type: "empty",
    symbol: "○",
    alt: "Cercle vide",
    aria: "Option visuelle: Cercle vide",
    description: "Cercle vide"
  },
  {
    text: "",
    visual: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iNC41IiB5PSI0LjUiIHdpZHRoPSI1MSIgaGVpZ2h0PSI1MSIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2Utd2lkdGg9IjEuNSIgcng9IjEiLz4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMTgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0gMzAgMTIgQSAxOCAxOCAwIDAgMCAzMCA0OCBaIiBmaWxsPSIjMzMzMzMzIi8+Cjwvc3ZnPg==",
    type: "half-left",
    symbol: "◐",
    alt: "Demi-remplissage à gauche",
    aria: "Option visuelle: Demi-remplissage à gauche",
    description: "Demi-remplissage à gauche"
  }
];

const demoQuestions = [
  {
    _id: "demo-q7",
    series: "A",
    questionIndex: 7,
    type: "raven",
    content: "Trouvez le motif manquant dans cette grille 3×3",
    options: demoQ7Options,
    correctAnswer: 0, // La première option (half-right) est correcte
    timeLimit: 60,
    explanation: "La règle est une progression de remplissage dans la grille 3×3 : chaque colonne suit l'ordre vide → demi-gauche → demi-droite → plein. La case manquante doit être 'demi-droite' (◑).",
    helpText: "Progression de remplissage par colonnes : ○ → ◐ → ◑ → ●",
    metadata: {
      gridFormat: "3×3",
      logic: "progression_remplissage",
      correctType: "half-right",
      correctSymbol: "◑",
      vocabulary: ["○ vide", "◐ demi-gauche", "◑ demi-droite", "● plein"],
      patternRule: "Progression par colonnes dans grille 3×3",
      visualStyle: "grid_coherent",
      optionsType: "pure_visual_no_letters"
    }
  }
];

module.exports = { demoQuestions, demoQ7Options };