// Explications enrichies pour le mode démo
const demoExplanations = {
  'Q7': {
    basic: "La règle est une progression de remplissage dans la grille 3×3 : chaque colonne suit l'ordre vide → demi-gauche → demi-droite → plein.",
    detailed: "Dans cette grille 3×3, chaque colonne représente une progression de remplissage. La logique est séquentielle : ○ (vide) → ◐ (demi-gauche) → ◑ (demi-droite) → ● (plein). La case manquante, située en position centrale, doit suivre cette progression et être un demi-remplissage à droite (◑).",
    vocabulary: ["○ vide", "◐ demi-gauche", "◑ demi-droite", "● plein"],
    patternRule: "Progression par colonnes dans grille 3×3",
    difficulty: "Débutant - Pattern de remplissage simple",
    tips: "Observez chaque colonne séparément pour identifier la progression"
  }
};

module.exports = { demoExplanations };