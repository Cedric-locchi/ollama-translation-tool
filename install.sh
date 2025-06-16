#!/bin/bash

# Script d'installation pour Translation Tools

echo "🚀 Installation de Translation Tools..."

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier que pnpm est installé
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm n'est pas installé. Installation avec npm..."
    npm install -g pnpm
fi

# Build du projet
echo "🔨 Construction du projet..."
pnpm install
pnpm run build:cli

# Rendre le CLI exécutable
chmod +x dist/cli.js

# Installation globale
echo "📦 Installation globale..."
npm link

echo "✅ Installation terminée !"
echo ""
echo "🎯 Commandes disponibles :"
echo "  translate-tool --help    # Aide complète"
echo "  ttool check             # Vérifier la configuration"
echo "  ttool translate -p '*.json' -l 'en,de'  # Traduire des fichiers"
echo ""
echo "📖 Pour plus d'infos : https://github.com/cedric/translation-tools"
