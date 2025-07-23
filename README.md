# Translation Tools

[![Node.js CI](https://github.com/Cedric-locchi/ollama-translation-tool/actions/workflows/github-workflow.yml/badge.svg)](https://github.com/Cedric-locchi/ollama-translation-tool/actions/workflows/github-workflow.yml)

A powerful TypeScript/Node.js CLI tool for automated file translation using Ollama local models.

## Features

- 🔄 **Batch Translation**: Translate JSON/YAML files efficiently with glob patterns
- 🏠 **Local Models**: Use Ollama for privacy-focused translation
- 📁 **File Processing**: Support for JSON and YAML formats
- 🎯 **Pattern Matching**: Process multiple files with glob patterns
- 🛡️ **Type Safe**: Full TypeScript support with strict types
- ⚡ **Performance**: Optimized for large volume translations
- 🎨 **CLI Interface**: Beautiful command-line interface with colored output and spinners

## Installation

```bash
# Clone and install
git clone https://github.com/Cedric-locchi/ollama-translation-tool.git
cd ollama-translation-tool
pnpm install

# Build the project
pnpm build

# Install CLI globally
pnpm install:cli
```

Or install globally via npm:

```bash
npm install -g @cedric/translation-tools
```

## Prerequisites

- **Node.js 18+**
- **[Ollama](https://ollama.ai/)** running locally
- **Translation model** (recommended: `llama3.1:8b`)

## Quick Start

### 1. Setup Ollama

```bash
# Start Ollama (if not already running)
ollama serve

# Pull the recommended model
ollama pull llama3.1:8b
```

### 2. Basic Usage

```bash
# Translate files using glob pattern
ttool translate -p "./translations/*.json" -l "en,es,de"

# Test a quick translation
ttool test -t "Bonjour le monde" --to en

# Check configuration and connection
ttool check
```

## CLI Commands

### `translate` - Translate Files

Translate files matching a glob pattern to target languages.

```bash
ttool translate [options]

Options:
  -p, --pattern <pattern>    File pattern to translate (ex: "./translations/*.json") [required]
  -l, --langs <langs>        Target languages separated by commas (default: "en,es,de,it,pt,nl")
  -s, --source <source>      Source language (default: "fr")
  -f, --file <file>          Output filename
```

**Examples:**

```bash
# Translate all JSON files in translations/ to English and Spanish
ttool translate -p "./translations/*.json" -l "en,es"

# Translate with custom source language
ttool translate -p "./locales/*.yaml" -s "en" -l "fr,de,it"

# Translate with custom output filename
ttool translate -p "./i18n/fr.json" -l "en" -f "messages"
```

### `check` - Verify Configuration

Check your configuration and Ollama connection.

```bash
ttool check
```

This command will:

- Validate your configuration
- Test Ollama connection
- Verify the model is available
- Display current settings

### `test` - Quick Translation Test

Test translation with a simple text string.

```bash
ttool test [options]

Options:
  -t, --text <text>     Texte à traduire [required]
  -f, --from <from>     Langue source (default: "fr")
  --to <to>             Langue cible (default: "en")
```

**Examples:**

```bash
# Quick French to English translation
ttool test -t "Bonjour le monde" --to en

# Translate from English to French
ttool test -t "Hello world" -f en --to fr

# Multiple word translation
ttool test -t "Comment allez-vous ?" --to en
```

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Translation Settings
DEFAULT_SOURCE_LANG=fr
DEFAULT_TARGET_LANGS=en,es,de,it,pt,nl
MAX_CONCURRENT_REQUESTS=3
TRANSLATION_TIMEOUT=30000

# File Settings
TRANSLATIONS_DIR=./translations
OUTPUT_DIR=./output
OUTPUT_FILE_NAME=translations
```

### Default Configuration

If no `.env` file is provided, these defaults are used:

- **Ollama Host**: `http://localhost:11434`
- **Model**: `llama3.1:8b`
- **Source Language**: `fr`
- **Target Languages**: `en,es,de,it,pt,nl`
- **Max Concurrent Requests**: `3`
- **Timeout**: `30000ms`

## File Formats

### JSON Files

```json
// Input: fr.json
{
  "welcome": "Bienvenue dans notre application",
  "navigation": {
    "home": "Accueil",
    "about": "À propos",
    "contact": "Contact"
  },
  "buttons": {
    "save": "Enregistrer",
    "cancel": "Annuler"
  }
}

// Output: en.json (automatically generated)
{
  "welcome": "Welcome to our application",
  "navigation": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  },
  "buttons": {
    "save": "Save",
    "cancel": "Cancel"
  }
}
```

### YAML Files

```yaml
# Input: fr.yaml
welcome: Bienvenue dans notre application
navigation:
  home: Accueil
  about: À propos
  contact: Contact
buttons:
  save: Enregistrer
  cancel: Annuler

# Output: en.yaml (automatically generated)
welcome: Welcome to our application
navigation:
  home: Home
  about: About
  contact: Contact
buttons:
  save: Save
  cancel: Cancel
```

## Development

### Project Structure

```
src/
├── cli.ts              # CLI interface with Brocli
├── config.ts           # Configuration and environment variables
├── translator.ts       # Ollama translation service
├── file-processor.ts   # JSON/YAML file processing
├── types.ts            # TypeScript interfaces and types
└── index.ts            # Entry point and public API
```

### Available Scripts

```bash
# Development
pnpm dev              # Watch mode with tsx
pnpm start            # Start the CLI (node dist/cli.js)
pnpm build            # Build the project with Vite
pnpm build:cli        # Build CLI specifically with config

# Translation
pnpm translate        # Run CLI directly with tsx (development)

# Quality
pnpm test             # Run tests with Vitest
pnpm test:watch       # Watch mode for tests
pnpm type-check       # TypeScript type checking
pnpm lint             # ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm format           # Format with Prettier

# Utils
pnpm clean            # Clean dist folder
pnpm install:cli      # Install CLI globally via install.sh
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test
pnpm test file-processor.test.ts
```

## Programmatic Usage

You can also use the translation tools in your Node.js applications:

```typescript
import { OllamaTranslator, FileProcessor, quickTranslate } from '@cedric/translation-tools';

// Quick translation
const result = await quickTranslate('Bonjour', 'fr', 'en');
console.log(result); // "Hello"

// Advanced usage
const translator = new OllamaTranslator();
const translation = await translator.translate({
    text: 'Comment allez-vous ?',
    sourceLang: 'fr',
    targetLang: 'en',
});

// Process files
const processor = new FileProcessor();
await processor.processFiles('./translations/*.json', ['en', 'es']);
```

## Supported Models

Works with any Ollama-compatible translation model:

- **llama3.1:8b** ⭐ (recommended) - Best balance of quality and speed
- **llama3.1:70b** - Higher quality, slower
- **llama2:7b** - Good performance
- **mistral:7b** - Alternative option
- **codellama:7b** - Code-aware translations

## Troubleshooting

### Common Issues

**❌ "Ollama n'est pas disponible"**

```bash
# Check if Ollama is running
ollama list

# Start Ollama if needed
ollama serve
```

**❌ "Le modèle n'est pas installé"**

```bash
# Pull the required model
ollama pull llama3.1:8b

# Check available models
ollama list
```

**❌ "Aucun fichier trouvé"**

```bash
# Check your pattern syntax
ttool translate -p "./translations/**/*.json" -l "en"

# Use absolute path if needed
ttool translate -p "/full/path/to/translations/*.json" -l "en"
```

**❌ Memory Issues**

- Reduce `MAX_CONCURRENT_REQUESTS` in your `.env`
- Use a smaller model like `llama2:7b`
- Process fewer files at once

### Performance Tips

1. **Concurrent Requests**: Adjust `MAX_CONCURRENT_REQUESTS` (1-5 recommended)
2. **Model Choice**: Use `llama3.1:8b` for best speed/quality balance
3. **Batch Size**: Process large files in smaller batches
4. **Hardware**: More RAM = higher concurrency possible

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [Ollama](https://ollama.ai/) - Local LLM runtime
- [Brocli](https://github.com/drizzle-team/brocli) - CLI framework from drizzle-team
- [i18next](https://www.i18next.com/) - Internationalization framework
