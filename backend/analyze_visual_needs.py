#!/usr/bin/env python3
"""
🔍 ANALYSEUR DES BESOINS EN VISUELS - TESTIQ
==========================================

Analyse les 60 questions pour identifier celles nécessitant des visualisations
et génère un rapport complet avec recommandations.
"""

import re
import json

def analyze_question_for_visuals(content, category, difficulty, series):
    """Analyse une question pour déterminer si elle a besoin d'un visuel"""
    
    content_lower = content.lower()
    
    # Mots-clés indiquant un besoin de visuel
    visual_keywords = {
        'matrices': ['matrice', 'matrix', '2x2', '3x3', '4x4', 'rotation', 'transformation'],
        'geometry': ['géométrie', 'forme', 'triangle', 'carré', 'cercle', 'rotation', 'symétrie'],
        'spatial': ['spatial', 'rotation', '3d', '4d', 'dé', 'cube', 'perspective'],
        'sets': ['ensemble', 'venn', 'intersection', 'union', '∪', '∩', 'inclusion-exclusion'],
        'sequences': ['motif', 'pattern', 'séquence', 'progression', 'fibonacci', 'spirale'],
        'graphs': ['graphe', 'arbre', 'réseau', 'sommet', 'arête', 'connexion'],
        'logic': ['diagramme', 'schéma', 'logique booléenne', 'table de vérité'],
        'fractals': ['fractal', 'auto-similaire', 'itération', 'récursif']
    }
    
    # Score de besoin en visuel (0-100)
    visual_score = 0
    matched_keywords = []
    visual_type = None
    
    # Analyser les mots-clés
    for category_name, keywords in visual_keywords.items():
        for keyword in keywords:
            if keyword in content_lower:
                visual_score += 15
                matched_keywords.append(keyword)
                if not visual_type:
                    visual_type = category_name
    
    # Bonus selon la catégorie
    if category == 'spatial':
        visual_score += 20
    elif category == 'logique' and any(k in content_lower for k in ['ensemble', 'venn', 'intersection']):
        visual_score += 25
    elif category == 'numerique' and any(k in content_lower for k in ['fibonacci', 'progression', 'spirale']):
        visual_score += 15
    
    # Bonus selon la série (plus complexe = plus de visuel)
    series_bonus = {'A': 5, 'B': 10, 'C': 15, 'D': 20, 'E': 25}
    visual_score += series_bonus.get(series, 0)
    
    # Bonus selon la difficulté
    if difficulty >= 7:
        visual_score += 10
    elif difficulty >= 4:
        visual_score += 5
    
    # Détermination finale
    visual_needed = visual_score >= 30
    priority = 'HIGH' if visual_score >= 60 else 'MEDIUM' if visual_score >= 40 else 'LOW'
    
    return {
        'visual_needed': visual_needed,
        'visual_score': min(visual_score, 100),
        'priority': priority,
        'visual_type': visual_type or 'generic',
        'matched_keywords': matched_keywords,
        'recommendation': get_visual_recommendation(visual_type, content_lower)
    }

def get_visual_recommendation(visual_type, content):
    """Recommandations spécifiques selon le type de visuel"""
    
    recommendations = {
        'matrices': 'Matrice interactive avec flèches colorées et animation des rotations',
        'geometry': 'Formes géométriques 3D avec transformations animées',
        'spatial': 'Visualisation 3D interactive avec rotation et perspective',
        'sets': 'Diagrammes de Venn dynamiques avec calculs step-by-step',
        'sequences': 'Graphique de progression avec courbes et animations',
        'graphs': 'Réseau interactif avec nœuds et arêtes colorés',
        'logic': 'Tables de vérité et diagrammes logiques interactifs',
        'fractals': 'Animation fractale avec zoom progressif',
        'generic': 'Visualisation adaptée au contenu spécifique'
    }
    
    return recommendations.get(visual_type, recommendations['generic'])

def main():
    """Analyse principale"""
    
    print("🔍 ANALYSE DES BESOINS EN VISUELS - 60 QUESTIONS TESTIQ")
    print("=" * 60)
    
    # Charger les questions (simulées - dans la vraie implémentation, lire depuis raven_questions.js)
    questions_sample = [
        {"content": "Complétez le motif: Quel forme manque dans cette séquence?", "category": "spatial", "difficulty": 1, "series": "A"},
        {"content": "Continuez la séquence: 2, 4, 6, 8, ?", "category": "numerique", "difficulty": 1, "series": "A"},
        {"content": "Matrice 2x2 avec rotation: trouvez l'élément manquant", "category": "spatial", "difficulty": 3, "series": "B"},
        {"content": "Suite de Fibonacci: 1, 1, 2, 3, 5, ?", "category": "numerique", "difficulty": 4, "series": "B"},
        {"content": "Théorie des ensembles: P(A∪B) si |A|=3, |B|=4, |A∩B|=1", "category": "logique", "difficulty": 6, "series": "C"},
        {"content": "Transformation géométrique en 4 dimensions", "category": "spatial", "difficulty": 8, "series": "D"},
        {"content": "Fractal auto-similaire avec itérations complexes", "category": "spatial", "difficulty": 9, "series": "E"}
    ]
    
    # Statistiques
    total_questions = len(questions_sample)
    needs_visual = 0
    high_priority = 0
    medium_priority = 0
    low_priority = 0
    
    visual_types_count = {}
    
    print(f"\n📊 RAPPORT D'ANALYSE ({total_questions} questions échantillon)")
    print("-" * 60)
    
    for i, question in enumerate(questions_sample, 1):
        analysis = analyze_question_for_visuals(
            question['content'], 
            question['category'], 
            question['difficulty'], 
            question['series']
        )
        
        # Statistiques
        if analysis['visual_needed']:
            needs_visual += 1
            
        if analysis['priority'] == 'HIGH':
            high_priority += 1
        elif analysis['priority'] == 'MEDIUM':
            medium_priority += 1
        else:
            low_priority += 1
            
        visual_type = analysis['visual_type']
        visual_types_count[visual_type] = visual_types_count.get(visual_type, 0) + 1
        
        # Affichage détaillé
        status = "✅ VISUEL REQUIS" if analysis['visual_needed'] else "❌ Pas nécessaire"
        priority_emoji = {"HIGH": "🔥", "MEDIUM": "⚡", "LOW": "💡"}
        
        print(f"\nQ{i:2d} - {status} {priority_emoji[analysis['priority']]} [{analysis['visual_score']:3d}/100]")
        print(f"     📝 {question['content'][:50]}...")
        print(f"     🏷️  {question['series']}/{question['category']}/Diff.{question['difficulty']}")
        
        if analysis['visual_needed']:
            print(f"     🎨 Type: {analysis['visual_type']}")
            print(f"     💡 Recommandation: {analysis['recommendation']}")
            if analysis['matched_keywords']:
                print(f"     🔍 Mots-clés: {', '.join(analysis['matched_keywords'][:3])}")
    
    # Résumé statistique
    print(f"\n📈 RÉSUMÉ STATISTIQUE")
    print("=" * 40)
    print(f"Questions nécessitant des visuels: {needs_visual}/{total_questions} ({needs_visual/total_questions*100:.1f}%)")
    print(f"🔥 Priorité HAUTE:   {high_priority}")
    print(f"⚡ Priorité MOYENNE: {medium_priority}")  
    print(f"💡 Priorité BASSE:   {low_priority}")
    
    print(f"\n🎨 TYPES DE VISUELS NÉCESSAIRES:")
    for vtype, count in sorted(visual_types_count.items(), key=lambda x: x[1], reverse=True):
        print(f"   {vtype.capitalize()}: {count} question(s)")
    
    print(f"\n🚀 RECOMMANDATIONS:")
    print(f"1. Implémenter {high_priority} visuels haute priorité en premier")
    print(f"2. Focus sur les types: {', '.join(list(visual_types_count.keys())[:3])}")
    print(f"3. Questions série C-D-E ont le plus besoin de visuels")
    
    return {
        'total_analyzed': total_questions,
        'needs_visual': needs_visual,
        'priorities': {'high': high_priority, 'medium': medium_priority, 'low': low_priority},
        'visual_types': visual_types_count
    }

if __name__ == "__main__":
    results = main()
    print(f"\n✅ Analyse terminée - {results['needs_visual']}/{results['total_analyzed']} questions nécessitent des visuels")