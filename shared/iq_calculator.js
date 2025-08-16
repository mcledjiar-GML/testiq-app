// Système de calcul d'IQ basé sur les standards Raven
class IQCalculator {
  
  // Classification standard de l'IQ (Échelle de Wechsler)
  static IQ_CLASSIFICATIONS = {
    130: { level: "Très supérieur", description: "Intelligence exceptionnelle", percentile: 98, emoji: "🧠✨" },
    120: { level: "Supérieur", description: "Intelligence remarquable", percentile: 91, emoji: "🎯" },
    110: { level: "Moyen supérieur", description: "Intelligence au-dessus de la moyenne", percentile: 75, emoji: "📈" },
    90: { level: "Moyen", description: "Intelligence dans la moyenne", percentile: 50, emoji: "✅" },
    80: { level: "Moyen inférieur", description: "Intelligence en dessous de la moyenne", percentile: 16, emoji: "📊" },
    70: { level: "Limite", description: "Intelligence à la limite", percentile: 2, emoji: "⚠️" },
    0: { level: "Déficient", description: "Intelligence déficiente", percentile: 0.1, emoji: "🔻" }
  };

  // Barème de conversion score -> IQ selon le type et niveau de test
  static calculateIQ(correctAnswers, totalQuestions, difficulty, testLevel = 'standard') {
    // Calculer le pourcentage de réussite
    const rawScore = (correctAnswers / totalQuestions) * 100;
    
    // Calcul de la difficulté moyenne pondérée
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    
    // Ajustement selon le niveau de test
    const testMultiplier = this.getTestMultiplier(testLevel);
    
    // Calcul de base de l'IQ
    let iq = this.convertScoreToIQ(rawScore, difficultyMultiplier, testMultiplier);
    
    // Normalisation finale
    iq = Math.round(Math.max(60, Math.min(200, iq)));
    
    return {
      iq: iq,
      classification: this.getClassification(iq),
      rawScore: rawScore,
      difficulty: difficulty,
      percentile: this.getPercentile(iq)
    };
  }

  static getDifficultyMultiplier(avgDifficulty) {
    // Plus la difficulté est élevée, plus le multiplicateur est important
    if (avgDifficulty >= 8) return 1.3;
    if (avgDifficulty >= 6) return 1.2;
    if (avgDifficulty >= 4) return 1.1;
    if (avgDifficulty >= 2) return 1.0;
    return 0.9;
  }

  static getTestMultiplier(testLevel) {
    switch(testLevel) {
      case 'full': return 1.1; // Test complet plus précis
      case 'standard': return 1.0;
      case 'short': return 0.95; // Test court moins précis
      default: return 1.0;
    }
  }

  static convertScoreToIQ(rawScore, difficultyMultiplier, testMultiplier) {
    // Formule corrigée basée sur la courbe normale (moyenne 100, écart-type 15)
    // 50% = IQ 100, 75% = IQ ~110, 90% = IQ ~125
    
    let baseIQ = 100; // IQ moyen
    
    // Conversion corrigée pour respecter la distribution normale
    if (rawScore >= 95) {
      baseIQ = 140 + (rawScore - 95) * 4; // Scores très élevés
    } else if (rawScore >= 90) {
      baseIQ = 125 + (rawScore - 90) * 3; // Scores excellents (90-95%)
    } else if (rawScore >= 80) {
      baseIQ = 110 + (rawScore - 80) * 1.5; // Scores très bons (80-90%)
    } else if (rawScore >= 70) {
      baseIQ = 100 + (rawScore - 70) * 1.0; // Scores bons (70-80%)
    } else if (rawScore >= 60) {
      baseIQ = 95 + (rawScore - 60) * 0.5; // Scores moyens (60-70%)
    } else if (rawScore >= 50) {
      baseIQ = 90 + (rawScore - 50) * 0.5; // Scores moyens-bas (50-60%)
    } else if (rawScore >= 30) {
      baseIQ = 80 + (rawScore - 30) * 0.5; // Scores bas (30-50%)
    } else {
      baseIQ = 65 + rawScore * 0.5; // Scores très bas
    }
    
    // Application des multiplicateurs (réduits pour éviter les distorsions)
    const finalMultiplier = Math.sqrt(difficultyMultiplier * testMultiplier);
    return baseIQ * finalMultiplier;
  }

  static getClassification(iq) {
    for (let threshold of Object.keys(this.IQ_CLASSIFICATIONS).sort((a, b) => b - a)) {
      if (iq >= parseInt(threshold)) {
        return this.IQ_CLASSIFICATIONS[threshold];
      }
    }
    return this.IQ_CLASSIFICATIONS[0];
  }

  static getPercentile(iq) {
    // Calcul du percentile basé sur la distribution normale
    // IQ 100 = 50e percentile, IQ 115 = ~84e percentile, etc.
    if (iq >= 145) return 99.9;
    if (iq >= 130) return 98;
    if (iq >= 120) return 91;
    if (iq >= 115) return 84;
    if (iq >= 110) return 75;
    if (iq >= 105) return 63;
    if (iq >= 100) return 50;
    if (iq >= 95) return 37;
    if (iq >= 90) return 25;
    if (iq >= 85) return 16;
    if (iq >= 80) return 9;
    if (iq >= 75) return 5;
    if (iq >= 70) return 2;
    return 1;
  }

  // Génération de conseils personnalisés selon l'IQ
  static getPersonalizedAdvice(iq, testLevel) {
    const classification = this.getClassification(iq);
    const advice = [];

    if (iq >= 130) {
      advice.push("🎓 Votre intelligence est exceptionnelle ! Considérez des défis intellectuels avancés.");
      advice.push("📚 Vous pourriez exceller dans la recherche, l'innovation ou les domaines créatifs complexes.");
      advice.push("🤝 Utilisez vos capacités pour aider les autres et résoudre des problèmes sociaux.");
    } else if (iq >= 120) {
      advice.push("🌟 Vous avez une intelligence remarquable ! Explorez des sujets complexes.");
      advice.push("💼 Vous êtes bien adapté(e) aux professions intellectuelles exigeantes.");
      advice.push("🎯 Fixez-vous des objectifs ambitieux et continuez à apprendre.");
    } else if (iq >= 110) {
      advice.push("📈 Votre intelligence est au-dessus de la moyenne ! Continuez à vous challenger.");
      advice.push("🎨 Explorez différents domaines pour découvrir vos talents cachés.");
      advice.push("📖 La lecture régulière peut encore enrichir vos capacités.");
    } else if (iq >= 90) {
      advice.push("✅ Votre intelligence est dans la moyenne normale. C'est parfaitement bien !");
      advice.push("🏋️‍♂️ Exercez régulièrement votre cerveau avec des puzzles et jeux de logique.");
      advice.push("🎪 Diversifiez vos activités mentales pour stimuler différentes capacités.");
    } else {
      advice.push("💪 Votre potentiel peut être développé ! L'intelligence n'est pas figée.");
      advice.push("🧩 Pratiquez régulièrement des exercices de logique et de réflexion.");
      advice.push("🎵 Essayez différentes activités : musique, art, sport pour stimuler votre cerveau.");
    }

    // Conseils selon le type de test
    if (testLevel === 'short') {
      advice.push("⏰ Refaites le test complet pour une évaluation plus précise de votre IQ.");
    } else if (testLevel === 'full') {
      advice.push("🎯 Ce résultat basé sur le test complet est très fiable.");
    }

    return advice;
  }

  // Comparaison avec la population générale
  static getPopulationComparison(iq) {
    const percentile = this.getPercentile(iq);
    const betterThan = percentile;
    const population = 100 - percentile;

    return {
      betterThan: Math.round(betterThan),
      worseThan: Math.round(population),
      description: `Vous avez un score supérieur à ${Math.round(betterThan)}% de la population`
    };
  }
}

module.exports = IQCalculator;