#!/usr/bin/env node
import { command, run, string, boolean, positional } from '@drizzle-team/brocli';
import chalk from 'chalk';
import ora from 'ora';
import { validateConfig, config } from './config.js';
import { FileProcessor } from './file-processor.js';
import { OllamaTranslator } from './translator.js';

// Translate command
const translateCommand = command({
    name: 'translate',
    desc: 'Traduit des fichiers de traduction avec Ollama',
    options: {
        pattern: string('pattern')
            .alias('p')
            .required()
            .desc('Pattern des fichiers à traduire (ex: "./translations/*.json")'),
        file: string('file')
            .alias('f')
            .desc('Nom du fichier de sortie')
            .default(config.outputFileName),
        langs: string('langs')
            .alias('l')
            .desc('Langues cibles séparées par des virgules')
            .default(config.targetLangs.join(',')),
        source: string('source').alias('s').desc('Langue source').default(config.sourceLang),
        output: string('output').alias('o').desc('Répertoire de sortie').default(config.outputDir),
    },
    handler: async options => {
        const spinner = ora('Initialisation...').start();

        try {
            // Configuration validation
            validateConfig();

            // Update config with command options
            config.outputDir = options.output;
            config.outputFileName = options.file;

            // Display current configuration
            console.log(chalk.cyan('\n🔧 Configuration actuelle:'));
            console.log(`   Répertoire de sortie: ${config.outputDir}`);
            console.log(`   Fichier de sortie: ${config.outputFileName}`);

            // Ollama connection check
            spinner.text = 'Vérification de la connexion Ollama...';
            const translator = new OllamaTranslator();
            const isAvailable = await translator.isAvailable();

            if (!isAvailable) {
                spinner.fail(
                    chalk.red("Ollama n'est pas disponible ou le modèle n'est pas installé")
                );
                console.log(chalk.yellow(`Modèle requis: ${config.model}`));
                console.log(
                    chalk.yellow('Vérifiez que Ollama est démarré et que le modèle est téléchargé.')
                );
                process.exit(1);
            }

            spinner.succeed(chalk.green('Connexion Ollama OK'));

            // File processing
            const targetLangs = options.langs.split(',').map(lang => lang.trim());
            const processor = new FileProcessor();

            spinner.start('Traitement des fichiers...');
            const stats = await processor.processFiles(options.pattern, targetLangs);

            spinner.succeed(chalk.green('Traduction terminée !'));

            // Statistics display
            console.log(chalk.cyan('\n📊 Statistiques:'));
            console.log(`   Fichiers traités: ${stats.totalFiles}`);
            console.log(`   Clés traduites: ${stats.totalKeys}`);
            console.log(`   Langues: ${stats.languages.join(', ')}`);
            console.log(`   Durée: ${Math.round(stats.duration / 1000)}s`);
            console.log(chalk.green(`\n✅ Fichiers sauvegardés dans: ${config.outputDir}`));
        } catch (error) {
            spinner.fail(chalk.red('Erreur lors de la traduction'));
            console.error(chalk.red(error instanceof Error ? error.message : 'Erreur inconnue'));
            process.exit(1);
        }
    },
});

// Check command
const checkCommand = command({
    name: 'check',
    desc: 'Vérifie la configuration et la connexion Ollama',
    options: {},
    handler: async () => {
        const spinner = ora('Vérification de la configuration...').start();

        try {
            validateConfig();
            spinner.succeed(chalk.green('Configuration valide'));

            spinner.start('Test de connexion Ollama...');
            const translator = new OllamaTranslator();
            const isAvailable = await translator.isAvailable();

            if (isAvailable) {
                spinner.succeed(chalk.green(`Ollama connecté avec le modèle ${config.model}`));
            } else {
                spinner.fail(chalk.red('Impossible de se connecter à Ollama'));
                console.log(
                    chalk.yellow('Vérifiez que Ollama est démarré et que le modèle est téléchargé.')
                );
            }

            console.log(chalk.cyan('\n🔧 Configuration actuelle:'));
            console.log(`   Host Ollama: ${config.ollamaHost}`);
            console.log(`   Modèle: ${config.model}`);
            console.log(`   Langue source: ${config.sourceLang}`);
            console.log(`   Langues cibles: ${config.targetLangs.join(', ')}`);
            console.log(`   Répertoire de sortie: ${config.outputDir}`);
        } catch (error) {
            spinner.fail(chalk.red('Erreur de configuration'));
            console.error(chalk.red(error instanceof Error ? error.message : 'Erreur inconnue'));
            process.exit(1);
        }
    },
});

// Test command
const testCommand = command({
    name: 'test',
    desc: "Test rapide de traduction d'un texte",
    options: {
        text: string('text').alias('t').required().desc('Texte à traduire'),
        from: string('from').alias('f').desc('Langue source').default(config.sourceLang),
        to: string('to').desc('Langue cible').default('en'),
    },
    handler: async options => {
        const spinner = ora('Test de traduction...').start();

        try {
            validateConfig();

            const translator = new OllamaTranslator();
            const isAvailable = await translator.isAvailable();

            if (!isAvailable) {
                spinner.fail(chalk.red('Ollama non disponible'));
                process.exit(1);
            }

            const result = await translator.translate({
                text: options.text,
                sourceLang: options.from,
                targetLang: options.to,
            });

            spinner.succeed(chalk.green('Traduction réussie'));

            console.log(chalk.cyan('\n📝 Résultat:'));
            console.log(`   Texte original (${options.from}): "${options.text}"`);
            console.log(`   Traduction (${options.to}): "${result.translatedText}"`);
            console.log(`   Modèle utilisé: ${result.model}`);
        } catch (error) {
            spinner.fail(chalk.red('Erreur de traduction'));
            console.error(chalk.red(error instanceof Error ? error.message : 'Erreur inconnue'));
            process.exit(1);
        }
    },
});

// Error handling
process.on('unhandledRejection', reason => {
    console.error(chalk.red('Erreur non gérée:'), reason);
    process.exit(1);
});

// Run CLI
run([translateCommand, checkCommand, testCommand], {
    name: 'translation-tools',
    description: 'Outils de traduction automatisée avec Ollama',
    version: '1.0.0',
});
