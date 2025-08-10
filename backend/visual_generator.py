#!/usr/bin/env python3
"""
🎨 SYSTÈME DE GÉNÉRATION DE VISUELS PROFESSIONNELS TESTIQ
===============================================

Génère des visualisations modernes et interactives pour les questions IQ :
- Matrices 2D/3D avec rotations
- Diagrammes de Venn pour théorie des ensembles  
- Graphiques de progressions mathématiques
- Visualisations de logique booléenne
- Fractals et géométrie complexe

Auteur: TestIQ Advanced Visual System
Version: 1.0
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Circle, FancyBboxPatch, Rectangle, Arrow, Polygon
import numpy as np
import seaborn as sns
from typing import Dict, List, Tuple, Optional
import json
import base64
import io
from dataclasses import dataclass

# Configuration des styles modernes
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

@dataclass
class VisualConfig:
    """Configuration pour les visuels"""
    width: int = 12
    height: int = 8
    dpi: int = 300
    font_size: int = 14
    title_size: int = 18
    bg_color: str = "#f8f9fa"
    accent_color: str = "#007bff"
    success_color: str = "#28a745"
    error_color: str = "#dc3545"
    warning_color: str = "#ffc107"

class VisualGenerator:
    """Générateur de visuels professionnels pour TestIQ"""
    
    def __init__(self, config: VisualConfig = None):
        self.config = config or VisualConfig()
        
    def generate_matrix_rotation_visual(self, question_data: Dict) -> str:
        """
        Génère un visuel professionnel pour les matrices 2x2 avec rotations
        Retourne l'image en base64 pour intégration web
        """
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 7), dpi=self.config.dpi)
        fig.suptitle('🔄 Matrice 2×2 avec Rotation 90° Horaire', 
                     fontsize=self.config.title_size, fontweight='bold')
        
        # === MATRICE ORIGINALE ===
        ax1.set_title('🔲 Matrice avec élément manquant', fontsize=16, pad=20)
        
        # Dessiner la grille de la matrice
        for i in range(3):
            ax1.axhline(i, color='#333', linewidth=2)
            ax1.axvline(i, color='#333', linewidth=2)
        
        # Placement des flèches avec style moderne
        arrows_data = [
            (0.5, 1.5, '↗', self.config.accent_color),  # haut-gauche
            (1.5, 1.5, '↓', self.config.accent_color),  # haut-droite  
            (0.5, 0.5, '↑', self.config.success_color), # bas-gauche
            (1.5, 0.5, '?', self.config.error_color)    # bas-droite (manquant)
        ]
        
        for x, y, symbol, color in arrows_data:
            if symbol == '?':
                # Boîte stylée pour l'élément manquant
                bbox = FancyBboxPatch((x-0.3, y-0.3), 0.6, 0.6, 
                                    boxstyle="round,pad=0.1", 
                                    facecolor=color, alpha=0.3,
                                    edgecolor=color, linewidth=3)
                ax1.add_patch(bbox)
            
            ax1.text(x, y, symbol, ha='center', va='center', 
                    fontsize=28, fontweight='bold', color=color)
        
        # Labels et annotations
        ax1.text(0.5, -0.3, 'A', ha='center', fontsize=12, fontweight='bold')
        ax1.text(1.5, -0.3, 'B', ha='center', fontsize=12, fontweight='bold') 
        ax1.text(0.5, 2.3, 'C', ha='center', fontsize=12, fontweight='bold')
        ax1.text(1.5, 2.3, 'D', ha='center', fontsize=12, fontweight='bold')
        
        ax1.set_xlim(-0.1, 2.1)
        ax1.set_ylim(-0.5, 2.5)
        ax1.set_aspect('equal')
        ax1.axis('off')
        
        # === ANALYSE DE LA TRANSFORMATION ===
        ax2.set_title('🔍 Analyse de la Rotation', fontsize=16, pad=20)
        
        # Cercle pour illustrer la rotation
        circle = Circle((1, 1), 0.8, fill=False, color=self.config.accent_color, linewidth=3)
        ax2.add_patch(circle)
        
        # Flèches de rotation avec animations visuelles
        rotation_steps = [
            (1, 1.8, '↗', 'Nord-Est', 0),
            (1.8, 1, '↓', 'Sud', 90),  
            (1, 0.2, '↑', 'Nord', 180),
            (0.2, 1, '➡', 'Est', 270)
        ]
        
        colors = [self.config.accent_color, self.config.success_color, 
                 self.config.warning_color, self.config.error_color]
        
        for i, (x, y, arrow, direction, angle) in enumerate(rotation_steps):
            # Flèche avec style
            ax2.text(x, y, arrow, ha='center', va='center', 
                    fontsize=24, fontweight='bold', color=colors[i % len(colors)])
            
            # Label de direction
            label_x, label_y = x + 0.3 * np.cos(np.radians(angle + 45)), y + 0.3 * np.sin(np.radians(angle + 45))
            ax2.text(label_x, label_y, direction, ha='center', va='center', 
                    fontsize=10, color=colors[i % len(colors)], fontweight='bold')
        
        # Flèches courbes pour montrer la rotation
        angles = np.linspace(0, 2*np.pi, 100)
        for i in range(4):
            start_angle = i * np.pi/2
            end_angle = (i + 1) * np.pi/2
            arc_angles = np.linspace(start_angle, end_angle, 25)
            arc_x = 1 + 0.6 * np.cos(arc_angles)
            arc_y = 1 + 0.6 * np.sin(arc_angles)
            ax2.plot(arc_x, arc_y, color=colors[i], linewidth=3, alpha=0.7)
            
            # Flèche à la fin de l'arc
            if i < 3:
                arrow_x, arrow_y = arc_x[-1], arc_y[-1]
                dx, dy = arc_x[-1] - arc_x[-2], arc_y[-1] - arc_y[-2]
                ax2.arrow(arrow_x - dx*0.1, arrow_y - dy*0.1, dx*0.1, dy*0.1, 
                         head_width=0.05, head_length=0.05, fc=colors[i], ec=colors[i])
        
        # Texte explicatif central
        ax2.text(1, 1, '90°↻', ha='center', va='center', 
                fontsize=20, fontweight='bold', 
                bbox=dict(boxstyle="round,pad=0.3", facecolor='white', alpha=0.8))
        
        # Solution finale
        ax2.text(1, -0.5, '↑ + 90°↻ = ➡', ha='center', va='center',
                fontsize=16, fontweight='bold', color=self.config.success_color,
                bbox=dict(boxstyle="round,pad=0.5", facecolor=self.config.success_color, 
                         alpha=0.1, edgecolor=self.config.success_color))
        
        ax2.set_xlim(-0.5, 2.5)
        ax2.set_ylim(-0.8, 2.8)
        ax2.set_aspect('equal')
        ax2.axis('off')
        
        # Sauvegarde en base64
        return self._save_to_base64(fig)
    
    def generate_venn_diagram_visual(self, question_data: Dict) -> str:
        """
        Génère un diagramme de Venn professionnel pour l'inclusion-exclusion
        """
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8), dpi=self.config.dpi)
        fig.suptitle('🔢 Principe d\'Inclusion-Exclusion', 
                     fontsize=self.config.title_size, fontweight='bold')
        
        # === DIAGRAMME DE VENN ===
        ax1.set_title('📊 Ensembles A et B', fontsize=16, pad=20)
        
        # Cercles avec transparence moderne
        circle_a = Circle((0.3, 0.5), 0.3, alpha=0.6, color=self.config.accent_color, label='Ensemble A')
        circle_b = Circle((0.7, 0.5), 0.3, alpha=0.6, color=self.config.success_color, label='Ensemble B')
        
        ax1.add_patch(circle_a)
        ax1.add_patch(circle_b)
        
        # Labels avec style moderne
        ax1.text(0.15, 0.5, 'A\n|A|=3', ha='center', va='center', 
                fontsize=14, fontweight='bold', color='white',
                bbox=dict(boxstyle="round,pad=0.3", facecolor=self.config.accent_color))
        
        ax1.text(0.85, 0.5, 'B\n|B|=4', ha='center', va='center', 
                fontsize=14, fontweight='bold', color='white',
                bbox=dict(boxstyle="round,pad=0.3", facecolor=self.config.success_color))
        
        ax1.text(0.5, 0.5, 'A∩B\n|A∩B|=1', ha='center', va='center', 
                fontsize=12, fontweight='bold', color='white',
                bbox=dict(boxstyle="round,pad=0.2", facecolor=self.config.warning_color))
        
        # Zone d'union avec contour
        union_patch = patches.PathPatch(
            patches.Path.make_compound_path(
                patches.Path(circle_a.get_path().vertices),
                patches.Path(circle_b.get_path().vertices)
            ), alpha=0.2, facecolor=self.config.error_color, 
            edgecolor=self.config.error_color, linewidth=3
        )
        ax1.add_patch(union_patch)
        
        ax1.text(0.5, 0.1, '|A∪B| = ?', ha='center', va='center', 
                fontsize=16, fontweight='bold', color=self.config.error_color)
        
        ax1.set_xlim(-0.1, 1.1)
        ax1.set_ylim(0, 1)
        ax1.set_aspect('equal')
        ax1.axis('off')
        
        # === CALCUL STEP-BY-STEP ===
        ax2.set_title('🧮 Calcul Inclusion-Exclusion', fontsize=16, pad=20)
        
        # Étapes de calcul avec visualisation
        steps = [
            "1️⃣ Formule: |A∪B| = |A| + |B| - |A∩B|",
            "2️⃣ Substitution: |A∪B| = 3 + 4 - 1", 
            "3️⃣ Calcul: |A∪B| = 7 - 1",
            "4️⃣ Résultat: |A∪B| = 6"
        ]
        
        colors = [self.config.accent_color, self.config.success_color, 
                 self.config.warning_color, self.config.error_color]
        
        for i, (step, color) in enumerate(zip(steps, colors)):
            y_pos = 0.8 - i * 0.15
            
            # Boîte stylée pour chaque étape
            bbox = FancyBboxPatch((0.05, y_pos - 0.05), 0.9, 0.1,
                                boxstyle="round,pad=0.02", 
                                facecolor=color, alpha=0.1,
                                edgecolor=color, linewidth=2)
            ax2.add_patch(bbox)
            
            ax2.text(0.5, y_pos, step, ha='center', va='center',
                    fontsize=14, fontweight='bold', color=color)
        
        # Résultat final en surbrillance
        final_bbox = FancyBboxPatch((0.2, 0.05), 0.6, 0.15,
                                  boxstyle="round,pad=0.03", 
                                  facecolor=self.config.success_color, alpha=0.3,
                                  edgecolor=self.config.success_color, linewidth=3)
        ax2.add_patch(final_bbox)
        
        ax2.text(0.5, 0.125, '✅ RÉPONSE: 6 éléments', ha='center', va='center',
                fontsize=16, fontweight='bold', color=self.config.success_color)
        
        ax2.set_xlim(0, 1)
        ax2.set_ylim(0, 1)
        ax2.axis('off')
        
        return self._save_to_base64(fig)
    
    def generate_sequence_visual(self, sequence_type: str, data: List) -> str:
        """Génère des visuels pour les suites numériques"""
        fig, ax = plt.subplots(figsize=(12, 6), dpi=self.config.dpi)
        
        if sequence_type == "fibonacci":
            return self._generate_fibonacci_visual(ax, data)
        elif sequence_type == "arithmetic":
            return self._generate_arithmetic_visual(ax, data)
        elif sequence_type == "geometric":
            return self._generate_geometric_visual(ax, data)
        else:
            return self._generate_generic_sequence_visual(ax, data)
    
    def generate_spatial_transformation_visual(self, question_data: Dict) -> str:
        """Génère des visuels pour transformations spatiales et géométriques"""
        content = question_data.get('content', '').lower()
        
        # Détecter si c'est une transformation 4D
        if '4d' in content or '4 dimension' in content:
            return self._generate_4d_transformation_visual()
        else:
            return self._generate_3d_transformation_visual()
    
    def _generate_4d_transformation_visual(self) -> str:
        """Génère un visuel spécialisé pour les transformations 4D"""
        fig = plt.figure(figsize=(18, 10), dpi=self.config.dpi)
        fig.suptitle('🌌 Transformation 4D : Hypercube → Projection 3D → Projection 2D', 
                     fontsize=self.config.title_size, fontweight='bold', y=0.95)
        
        # Créer une grille de 3 sous-graphiques
        ax1 = plt.subplot(131)
        ax2 = plt.subplot(132)  
        ax3 = plt.subplot(133)
        
        # === HYPERCUBE 4D (représentation conceptuelle) ===
        ax1.set_title('📐 Hypercube 4D (Tesseract)\nConceptuel', fontsize=14, pad=20)
        
        # Simuler un hypercube avec deux cubes connectés
        # Cube 1 (dimension w=0)
        cube1_vertices = np.array([
            [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],  # face z=0
            [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]   # face z=1
        ]) * 0.8
        
        # Cube 2 (dimension w=1) - décalé
        cube2_vertices = cube1_vertices + np.array([0.5, 0.5, 0.3])
        
        # Projection 3D simple
        def project_4d_to_3d(vertices, w_offset=0):
            # Simuler projection 4D->3D avec perspective
            w_factor = 0.7 + w_offset * 0.3
            return vertices * w_factor
        
        proj1 = project_4d_to_3d(cube1_vertices, 0)
        proj2 = project_4d_to_3d(cube2_vertices, 1)
        
        # Dessiner les cubes avec transparence
        self._draw_cube_wireframe(ax1, proj1, self.config.accent_color, alpha=0.7, linewidth=2)
        self._draw_cube_wireframe(ax1, proj2, self.config.success_color, alpha=0.7, linewidth=2)
        
        # Connexions entre cubes (arêtes 4D)
        for i in range(8):
            ax1.plot([proj1[i, 0], proj2[i, 0]], 
                    [proj1[i, 1], proj2[i, 1]], 
                    color=self.config.warning_color, alpha=0.5, linewidth=1, linestyle='--')
        
        ax1.text(0.5, -0.3, '2 cubes 3D\nconnectés = Hypercube 4D', 
                ha='center', va='center', fontsize=12, fontweight='bold',
                bbox=dict(boxstyle="round,pad=0.3", facecolor=self.config.accent_color, alpha=0.2))
        
        ax1.set_xlim(-0.5, 2)
        ax1.set_ylim(-0.5, 2)
        ax1.axis('off')
        
        # === ROTATION 4D ===
        ax2.set_title('🔄 Rotation 4D\n(axes xy, zw)', fontsize=14, pad=20)
        
        # Montrer la rotation avec matrices
        angles = np.linspace(0, np.pi/2, 4)
        colors = [self.config.accent_color, self.config.success_color, 
                 self.config.warning_color, self.config.error_color]
        
        for i, (angle, color) in enumerate(zip(angles, colors)):
            # Rotation 4D simulée
            cos_a, sin_a = np.cos(angle), np.sin(angle)
            
            # Matrice de rotation 4D (plan xy-zw)
            rotation_factor = np.array([
                [cos_a, -sin_a, 0],
                [sin_a, cos_a, 0], 
                [0, 0, 1]
            ])
            
            rotated_vertices = (proj1 @ rotation_factor.T) + [i*0.3, 0, 0]
            
            # Dessiner étapes de rotation
            self._draw_cube_wireframe(ax2, rotated_vertices, color, alpha=0.8, linewidth=2)
            
            # Label de l'étape
            ax2.text(i*0.3 + 0.4, -0.4, f'{int(np.degrees(angle))}°', 
                    ha='center', va='center', fontsize=10, fontweight='bold', color=color)
        
        # Flèches de progression
        for i in range(3):
            ax2.annotate('', xy=((i+1)*0.3 - 0.1, 0.5), xytext=(i*0.3 + 0.5, 0.5),
                        arrowprops=dict(arrowstyle='->', lw=2, color='gray'))
        
        ax2.text(0.6, -0.8, 'Rotation progressive dans l\'hyperespace', 
                ha='center', va='center', fontsize=12, fontweight='bold',
                bbox=dict(boxstyle="round,pad=0.3", facecolor=self.config.success_color, alpha=0.2))
        
        ax2.set_xlim(-0.2, 1.4)
        ax2.set_ylim(-1, 1.5)
        ax2.axis('off')
        
        # === PROJECTION FINALE 2D ===
        ax3.set_title('📱 Projection 2D finale\n(ce qu\'on voit)', fontsize=14, pad=20)
        
        # Projection finale avec perspective
        final_vertices = rotated_vertices[:, :2]  # Prendre seulement x,y
        
        # Dessiner la projection 2D avec détails
        self._draw_2d_projection(ax3, final_vertices, self.config.error_color)
        
        # Ajouter annotations sur les sommets
        for i, vertex in enumerate(final_vertices[:4]):  # Face avant
            ax3.scatter(vertex[0], vertex[1], s=60, c=self.config.error_color, alpha=0.8, zorder=5)
            ax3.text(vertex[0]+0.05, vertex[1]+0.05, f'V{i+1}', 
                    fontsize=10, fontweight='bold', color=self.config.error_color)
        
        # Explication
        ax3.text(0.4, -0.6, 'Résultat final :\nProjection 2D de la rotation 4D', 
                ha='center', va='center', fontsize=12, fontweight='bold',
                bbox=dict(boxstyle="round,pad=0.3", facecolor=self.config.error_color, alpha=0.2))
        
        ax3.set_xlim(-0.3, 1.1)
        ax3.set_ylim(-0.8, 1.1)
        ax3.set_aspect('equal')
        ax3.axis('off')
        
        # Note explicative en bas
        fig.text(0.5, 0.02, 
                '💡 En 4D, on peut faire tourner un objet selon 6 axes différents (xy, xz, xw, yz, yw, zw)', 
                ha='center', va='bottom', fontsize=12, fontweight='bold',
                bbox=dict(boxstyle="round,pad=0.5", facecolor='#f0f8ff', alpha=0.8))
        
        plt.tight_layout()
        return self._save_to_base64(fig)
    
    def _generate_3d_transformation_visual(self) -> str:
        """Génère un visuel pour les transformations 3D classiques"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8), dpi=self.config.dpi)
        fig.suptitle('🌐 Transformation Spatiale 3D', 
                     fontsize=self.config.title_size, fontweight='bold')
        
        # === OBJET ORIGINAL ===
        ax1.set_title('📦 Objet Original', fontsize=16, pad=20)
        
        # Dessiner un cube 3D en perspective
        # Points du cube
        vertices = np.array([
            [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],  # face inférieure
            [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]   # face supérieure
        ])
        
        # Projection en perspective
        def project_3d(vertices, angle_x=30, angle_y=45):
            angle_x, angle_y = np.radians(angle_x), np.radians(angle_y)
            
            # Matrices de rotation
            Rx = np.array([[1, 0, 0],
                          [0, np.cos(angle_x), -np.sin(angle_x)],
                          [0, np.sin(angle_x), np.cos(angle_x)]])
            
            Ry = np.array([[np.cos(angle_y), 0, np.sin(angle_y)],
                          [0, 1, 0],
                          [-np.sin(angle_y), 0, np.cos(angle_y)]])
            
            # Rotation et projection
            rotated = vertices @ Rx @ Ry
            return rotated[:, :2]  # Projection 2D (x,y)
        
        proj_vertices = project_3d(vertices)
        
        # Dessiner les arêtes du cube
        edges = [
            (0, 1), (1, 2), (2, 3), (3, 0),  # face inférieure
            (4, 5), (5, 6), (6, 7), (7, 4),  # face supérieure  
            (0, 4), (1, 5), (2, 6), (3, 7)   # arêtes verticales
        ]
        
        for edge in edges:
            start, end = edge
            ax1.plot([proj_vertices[start, 0], proj_vertices[end, 0]],
                    [proj_vertices[start, 1], proj_vertices[end, 1]],
                    color=self.config.accent_color, linewidth=2)
        
        # Points de vertices
        ax1.scatter(proj_vertices[:, 0], proj_vertices[:, 1], 
                   color=self.config.success_color, s=60, zorder=5)
        
        ax1.set_aspect('equal')
        ax1.axis('off')
        ax1.set_xlim(-0.5, 1.5)
        ax1.set_ylim(-0.5, 1.5)
        
        # === TRANSFORMATION ===
        ax2.set_title('🔄 Après Transformation', fontsize=16, pad=20)
        
        # Appliquer une transformation (rotation + mise à l'échelle)
        transformed_vertices = project_3d(vertices, angle_x=60, angle_y=120) * 1.2
        
        for edge in edges:
            start, end = edge
            ax2.plot([transformed_vertices[start, 0], transformed_vertices[end, 0]],
                    [transformed_vertices[start, 1], transformed_vertices[end, 1]],
                    color=self.config.warning_color, linewidth=2)
        
        ax2.scatter(transformed_vertices[:, 0], transformed_vertices[:, 1], 
                   color=self.config.error_color, s=60, zorder=5)
        
        # Flèches de transformation
        for i in range(len(proj_vertices)):
            ax2.annotate('', xy=transformed_vertices[i], xytext=proj_vertices[i],
                        arrowprops=dict(arrowstyle='->', color='gray', alpha=0.5))
        
        ax2.set_aspect('equal')
        ax2.axis('off')
        ax2.set_xlim(-0.5, 1.5)
        ax2.set_ylim(-0.5, 1.5)
        
        return self._save_to_base64(fig)
    
    def generate_pattern_completion_visual(self, question_data: Dict) -> str:
        """Génère des visuels pour complétion de motifs"""
        fig, ax = plt.subplots(figsize=(14, 8), dpi=self.config.dpi)
        fig.suptitle('🎨 Complétion de Motif Visuel', 
                     fontsize=self.config.title_size, fontweight='bold')
        
        # Créer une grille de motifs 3x3 avec un élément manquant
        grid_size = 3
        cell_size = 2
        
        # Patterns possibles
        patterns = ['●', '○', '◐', '◑', '◒', '◓', '▲', '△']
        colors = [self.config.accent_color, self.config.success_color, 
                 self.config.warning_color, self.config.error_color]
        
        for row in range(grid_size):
            for col in range(grid_size):
                x = col * cell_size
                y = (grid_size - 1 - row) * cell_size
                
                # Case manquante (centre)
                if row == 1 and col == 1:
                    # Boîte de question
                    question_box = FancyBboxPatch((x, y), cell_size-0.1, cell_size-0.1,
                                                boxstyle="round,pad=0.1", 
                                                facecolor=self.config.error_color, alpha=0.3,
                                                edgecolor=self.config.error_color, linewidth=3)
                    ax.add_patch(question_box)
                    
                    ax.text(x + cell_size/2, y + cell_size/2, '?', 
                           ha='center', va='center', fontsize=36, 
                           fontweight='bold', color=self.config.error_color)
                else:
                    # Motif selon une logique (alternance, progression, etc.)
                    pattern_idx = (row + col) % len(patterns)
                    color_idx = (row * grid_size + col) % len(colors)
                    
                    # Boîte colorée
                    pattern_box = FancyBboxPatch((x, y), cell_size-0.1, cell_size-0.1,
                                               boxstyle="round,pad=0.05", 
                                               facecolor=colors[color_idx], alpha=0.2,
                                               edgecolor=colors[color_idx], linewidth=2)
                    ax.add_patch(pattern_box)
                    
                    ax.text(x + cell_size/2, y + cell_size/2, patterns[pattern_idx], 
                           ha='center', va='center', fontsize=24, 
                           fontweight='bold', color=colors[color_idx])
        
        # Grille
        for i in range(grid_size + 1):
            ax.axhline(i * cell_size, color='gray', linewidth=1, alpha=0.5)
            ax.axvline(i * cell_size, color='gray', linewidth=1, alpha=0.5)
        
        # Instructions
        ax.text(grid_size * cell_size / 2, -0.5, 
               'Analysez le motif et trouvez l\'élément manquant', 
               ha='center', va='center', fontsize=14, fontweight='bold',
               bbox=dict(boxstyle="round,pad=0.3", facecolor='white', alpha=0.8))
        
        ax.set_xlim(-0.5, grid_size * cell_size + 0.5)
        ax.set_ylim(-1, grid_size * cell_size + 0.5)
        ax.set_aspect('equal')
        ax.axis('off')
        
        return self._save_to_base64(fig)
    
    def generate_logic_diagram_visual(self, question_data: Dict) -> str:
        """Génère des diagrammes logiques pour raisonnement"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8), dpi=self.config.dpi)
        fig.suptitle('🧠 Diagramme de Raisonnement Logique', 
                     fontsize=self.config.title_size, fontweight='bold')
        
        # === PRÉMISSES ===
        ax1.set_title('📝 Prémisses', fontsize=16, pad=20)
        
        # Dessiner des boîtes logiques
        premises = ['Si A > B', 'Et B > C', 'Alors A ? C']
        colors = [self.config.accent_color, self.config.success_color, self.config.warning_color]
        
        for i, (premise, color) in enumerate(zip(premises, colors)):
            y_pos = 2 - i * 0.8
            
            box = FancyBboxPatch((0.1, y_pos - 0.3), 3.8, 0.6,
                               boxstyle="round,pad=0.1", 
                               facecolor=color, alpha=0.2,
                               edgecolor=color, linewidth=2)
            ax1.add_patch(box)
            
            ax1.text(2, y_pos, premise, ha='center', va='center',
                    fontsize=14, fontweight='bold', color=color)
            
            if i < len(premises) - 1:
                # Flèche vers le bas
                ax1.arrow(2, y_pos - 0.4, 0, -0.2, head_width=0.1, head_length=0.05,
                         fc=color, ec=color)
        
        ax1.set_xlim(0, 4)
        ax1.set_ylim(-0.5, 2.5)
        ax1.axis('off')
        
        # === CONCLUSION ===  
        ax2.set_title('💡 Déduction Logique', fontsize=16, pad=20)
        
        # Diagramme de transitivité
        positions = {'A': (1, 2), 'B': (2, 1), 'C': (3, 0)}
        
        # Dessiner les nœuds
        for node, (x, y) in positions.items():
            circle = Circle((x, y), 0.3, facecolor=self.config.accent_color, 
                          alpha=0.7, edgecolor='white', linewidth=3)
            ax2.add_patch(circle)
            ax2.text(x, y, node, ha='center', va='center', 
                    fontsize=16, fontweight='bold', color='white')
        
        # Dessiner les relations
        # A > B
        ax2.annotate('', xy=positions['B'], xytext=positions['A'],
                    arrowprops=dict(arrowstyle='->', lw=3, color=self.config.success_color))
        ax2.text(1.5, 1.7, 'A > B', ha='center', va='center', fontsize=12, 
                bbox=dict(boxstyle="round,pad=0.2", facecolor='white', alpha=0.8))
        
        # B > C
        ax2.annotate('', xy=positions['C'], xytext=positions['B'],
                    arrowprops=dict(arrowstyle='->', lw=3, color=self.config.success_color))
        ax2.text(2.5, 0.7, 'B > C', ha='center', va='center', fontsize=12,
                bbox=dict(boxstyle="round,pad=0.2", facecolor='white', alpha=0.8))
        
        # A > C (conclusion)
        ax2.annotate('', xy=positions['C'], xytext=positions['A'],
                    arrowprops=dict(arrowstyle='->', lw=4, color=self.config.error_color))
        ax2.text(2, 1.2, 'A > C\n(Transitivité)', ha='center', va='center', fontsize=14, 
                fontweight='bold', color=self.config.error_color,
                bbox=dict(boxstyle="round,pad=0.3", facecolor=self.config.error_color, 
                         alpha=0.1, edgecolor=self.config.error_color))
        
        ax2.set_xlim(0.5, 3.5)
        ax2.set_ylim(-0.5, 2.5)
        ax2.set_aspect('equal')
        ax2.axis('off')
        
        return self._save_to_base64(fig)
    
    def _generate_fibonacci_visual(self, ax, data):
        """Visualisation spéciale pour Fibonacci avec spirale dorée"""
        ax.set_title('🌀 Suite de Fibonacci avec Spirale Dorée', fontsize=16, pad=20)
        
        # Dessiner les carrés de Fibonacci
        sizes = data[:6]  # Premiers termes
        colors = plt.cm.viridis(np.linspace(0, 1, len(sizes)))
        
        x, y = 0, 0
        for i, (size, color) in enumerate(zip(sizes, colors)):
            rect = Rectangle((x, y), size, size, facecolor=color, alpha=0.7, 
                           edgecolor='black', linewidth=2)
            ax.add_patch(rect)
            
            # Label du nombre
            ax.text(x + size/2, y + size/2, str(size), ha='center', va='center',
                   fontsize=12, fontweight='bold', color='white')
            
            # Positionnement pour le prochain carré (spirale)
            if i % 4 == 0:
                x += size
            elif i % 4 == 1:
                y += size
            elif i % 4 == 2:
                x -= size
            else:
                y -= size
        
        # Spirale dorée approximative
        t = np.linspace(0, 2*np.pi, 100)
        golden_ratio = (1 + np.sqrt(5)) / 2
        r = golden_ratio ** (t / (np.pi/2))
        spiral_x = r * np.cos(t)
        spiral_y = r * np.sin(t)
        
        ax.plot(spiral_x, spiral_y, color='gold', linewidth=3, alpha=0.8, label='Spirale dorée')
        ax.legend()
        
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        
        return self._save_to_base64(plt.gcf())
    
    def _generate_arithmetic_visual(self, ax, data):
        """Visualisation pour suite arithmétique"""
        ax.set_title('📈 Suite Arithmétique', fontsize=16, pad=20)
        
        x = range(len(data))
        ax.plot(x, data, marker='o', linewidth=3, markersize=8, 
               color=self.config.accent_color, label='Suite')
        
        # Différence constante
        diff = data[1] - data[0] if len(data) > 1 else 0
        
        for i in range(len(data)-1):
            mid_x = (x[i] + x[i+1]) / 2
            mid_y = (data[i] + data[i+1]) / 2
            ax.annotate(f'+{diff}', xy=(mid_x, mid_y), xytext=(0, 20), 
                       textcoords='offset points', ha='center', va='center',
                       bbox=dict(boxstyle='round,pad=0.3', facecolor=self.config.success_color, alpha=0.3),
                       fontweight='bold', color=self.config.success_color)
        
        ax.grid(True, alpha=0.3)
        ax.legend()
        ax.set_xlabel('Position')
        ax.set_ylabel('Valeur')
        
        return self._save_to_base64(plt.gcf())
    
    def _generate_geometric_visual(self, ax, data):
        """Visualisation pour suite géométrique"""
        ax.set_title('📊 Suite Géométrique', fontsize=16, pad=20)
        
        x = range(len(data))
        ax.semilogy(x, data, marker='s', linewidth=3, markersize=8, 
                   color=self.config.warning_color, label='Suite')
        
        ax.grid(True, alpha=0.3)
        ax.legend()
        ax.set_xlabel('Position')
        ax.set_ylabel('Valeur (log)')
        
        return self._save_to_base64(plt.gcf())
    
    def _generate_generic_sequence_visual(self, ax, data):
        """Visualisation générique pour suites"""
        ax.set_title('🔢 Suite Numérique', fontsize=16, pad=20)
        
        x = range(len(data))
        ax.plot(x, data, marker='D', linewidth=2, markersize=6, 
               color=self.config.error_color, label='Suite')
        
        ax.grid(True, alpha=0.3)
        ax.legend()
        ax.set_xlabel('Position')
        ax.set_ylabel('Valeur')
        
        return self._save_to_base64(plt.gcf())
    
    def _draw_cube_wireframe(self, ax, vertices, color, alpha=0.7, linewidth=2):
        """Dessine un cube en fil de fer"""
        # Arêtes d'un cube
        edges = [
            (0, 1), (1, 2), (2, 3), (3, 0),  # face inférieure
            (4, 5), (5, 6), (6, 7), (7, 4),  # face supérieure  
            (0, 4), (1, 5), (2, 6), (3, 7)   # arêtes verticales
        ]
        
        for edge in edges:
            start, end = edge
            ax.plot([vertices[start, 0], vertices[end, 0]],
                   [vertices[start, 1], vertices[end, 1]],
                   color=color, alpha=alpha, linewidth=linewidth)
    
    def _draw_2d_projection(self, ax, vertices, color):
        """Dessine une projection 2D avec polygone"""
        # Ordre pour dessiner le polygone (face avant d'un cube projeté)
        face_order = [0, 1, 2, 3, 0]  # Fermer le polygone
        
        # Coordonnées du polygone
        polygon_x = [vertices[i, 0] for i in face_order]
        polygon_y = [vertices[i, 1] for i in face_order]
        
        # Dessiner le contour
        ax.plot(polygon_x, polygon_y, color=color, linewidth=3, alpha=0.8)
        
        # Remplir légèrement
        ax.fill(polygon_x, polygon_y, color=color, alpha=0.1)
    
    def _save_to_base64(self, fig) -> str:
        """Convertit la figure matplotlib en base64 pour intégration web"""
        buffer = io.BytesIO()
        fig.savefig(buffer, format='png', bbox_inches='tight', 
                   facecolor=self.config.bg_color, dpi=self.config.dpi)
        buffer.seek(0)
        
        # Encodage base64
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close(fig)
        
        return f"data:image/png;base64,{img_base64}"

# === FONCTIONS D'INTERFACE ===

def generate_visual_for_question(question_id: str, question_data: Dict) -> str:
    """
    Point d'entrée principal pour générer un visuel selon le type de question
    """
    generator = VisualGenerator()
    
    # Détection automatique du type de visuel nécessaire
    content = question_data.get('content', '').lower()
    category = question_data.get('category', '')
    
    # === MATRICES ET ROTATIONS ===
    if 'matrice' in content and 'rotation' in content:
        return generator.generate_matrix_rotation_visual(question_data)
    
    # === ENSEMBLES ET DIAGRAMMES DE VENN ===
    elif ('inclusion-exclusion' in content or 'ensemble' in content or 
          '∪' in content or '∩' in content or 'venn' in content):
        return generator.generate_venn_diagram_visual(question_data)
    
    # === SUITES NUMÉRIQUES ===
    elif 'fibonacci' in content:
        return generator.generate_sequence_visual('fibonacci', [1,1,2,3,5,8,13])
    elif any(keyword in content for keyword in ['progression', 'suite', 'séquence']):
        return generator.generate_sequence_visual('arithmetic', [2,4,6,8,10,12])
    
    # === TRANSFORMATIONS SPATIALES ===
    elif any(keyword in content for keyword in ['transformation', '3d', '4d', 'géométrique', 'spatial']):
        return generator.generate_spatial_transformation_visual(question_data)
    
    # === COMPLÉTION DE MOTIFS ===
    elif any(keyword in content for keyword in ['motif', 'pattern', 'complétez', 'manque']):
        return generator.generate_pattern_completion_visual(question_data)
    
    # === RAISONNEMENT LOGIQUE ===
    elif any(keyword in content for keyword in ['logique', 'si.*alors', 'déduction', 'raisonnement']):
        return generator.generate_logic_diagram_visual(question_data)
    
    # === PAR CATÉGORIE ===
    elif category == 'spatial':
        if 'matrice' in content or 'rotation' in content:
            return generator.generate_matrix_rotation_visual(question_data)
        elif 'transformation' in content:
            return generator.generate_spatial_transformation_visual(question_data)
        else:
            return generator.generate_pattern_completion_visual(question_data)
    
    elif category == 'logique':
        if 'ensemble' in content or '∪' in content:
            return generator.generate_venn_diagram_visual(question_data)
        else:
            return generator.generate_logic_diagram_visual(question_data)
    
    elif category == 'numerique':
        return generator.generate_sequence_visual('arithmetic', [1,2,3,4,5,6])
    
    else:
        # Pas de visuel nécessaire
        return ""

if __name__ == "__main__":
    # Tests des visuels
    print("🎨 Test du générateur de visuels TestIQ...")
    
    # Test matrice rotation
    matrix_data = {
        'content': 'Matrice 2x2 avec rotation: trouvez l\'élément manquant',
        'category': 'spatial'
    }
    
    visual_b64 = generate_visual_for_question('Q14', matrix_data)
    print(f"✅ Visuel matrice généré: {len(visual_b64)} caractères")
    
    # Test inclusion-exclusion
    venn_data = {
        'content': 'Principe inclusion-exclusion ensembles A et B',
        'category': 'logique'
    }
    
    visual_b64_venn = generate_visual_for_question('Q45', venn_data)
    print(f"✅ Visuel Venn généré: {len(visual_b64_venn)} caractères")
    
    print("🚀 Générateur de visuels TestIQ prêt !")