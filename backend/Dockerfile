# Image de base avec Node.js et Python
FROM node:18

# Installer Python et pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Créer un lien symbolique pour python
RUN ln -s /usr/bin/python3 /usr/bin/python

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY requirements.txt ./

# Installer les dépendances Node.js
RUN npm install

# Installer les dépendances Python (contourner la restriction environnement)
RUN python3 -m pip install --no-cache-dir --break-system-packages -r requirements.txt

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 5000

# Commande de démarrage
CMD ["npm", "start"]