# Translation Tools

[![Node.js CI](https://github.com/Cedric-locchi/ollama-translation-tool/actions/workflows/github-workflow.yml/badge.svg)](https://github.com/Cedric-locchi/ollama-translation-tool/actions/workflows/github-workflow.yml)

A set of TypeScript/Node.js tools for automated file translation using Ollama local models.

## Features

- 🔄 **Batch Translation**: Translate JSON/YAML files efficiently
- 🏠 **Local Models**: Use Ollama for privacy-focused translation
- 📁 **File Processing**: Support for JSON and YAML formats
- 🎯 **Glob Patterns**: Translate multiple files with pattern matching
- 🛡️ **Type Safe**: Full TypeScript support with strict types
- ⚡ **Performance**: Optimized for large volume translations
- 🎨 **CLI Interface**: Beautiful command-line interface with colored output

## Installation

````bash
# Install dependencies
pnpm install

# Build the project
pnpm run build


## Prerequisites

- Node.js 18+
- [Ollama](https://ollama.ai/) running locally
- A compatible translation model (recommended: llama3.1:8b)

## Quick Start

1. **Start Ollama** (if not already running):
```bash
ollama serve
````

2. **Pull a translation model**:

```bash
ollama pull llama3.1:8b
```

3. **Configure environment** (optional):

```bash
export OLLAMA_HOST=localhost:11434
export OLLAMA_MODEL=llama3.1:8b
```

4. **Translate files**:

```bash
# Translate a single file
ttool translate src/locales/en.json --to fr --output src/locales/fr.json

# Translate multiple files with glob pattern
ttool translate "src/locales/*.json" --to es --output-dir src/locales/

# Quick text translation test
ttool test "Hello world" --to fr
```

## CLI Commands

### `translate`

Translate files with glob patterns support.

```bash
ttool translate <input> --to <language> [options]

Options:
  -t, --to <lang>        Target language (required)
  -o, --output <file>    Output file path
  -d, --output-dir <dir> Output directory for multiple files
  -m, --model <model>    Ollama model to use
  -b, --batch-size <n>   Batch size for translation (default: 10)
  --dry-run              Show what would be translated without doing it
```

### `check`

Verify configuration and Ollama connection.

```bash
ttool check [options]

Options:
  -m, --model <model>    Test specific model
  -v, --verbose          Show detailed information
```

### `test`

Quick test of text translation.

```bash
ttool test <text> --to <language> [options]

Options:
  -t, --to <lang>        Target language (required)
  -m, --model <model>    Ollama model to use
```

## Configuration

### Environment Variables

```bash
# Ollama configuration
OLLAMA_HOST=localhost:11434          # Ollama server host
OLLAMA_MODEL=llama3.1:8b            # Default model for translation

# Translation settings
TRANSLATION_BATCH_SIZE=10            # Number of texts to translate in one batch
TRANSLATION_CONCURRENCY=3            # Max concurrent requests to Ollama
TRANSLATION_TEMPERATURE=0.1          # Model temperature for consistency
```

### Configuration File

Create a `.env` file in your project root:

```env
OLLAMA_HOST=localhost:11434
OLLAMA_MODEL=llama3.1:8b
TRANSLATION_BATCH_SIZE=10
TRANSLATION_CONCURRENCY=3
TRANSLATION_TEMPERATURE=0.1
```

## File Formats

### JSON Translation

```json
// Input: en.json
{
  "welcome": "Welcome to our app",
  "buttons": {
    "save": "Save",
    "cancel": "Cancel"
  }
}

// Output: fr.json (after translation)
{
  "welcome": "Bienvenue dans notre application",
  "buttons": {
    "save": "Enregistrer",
    "cancel": "Annuler"
  }
}
```

### YAML Translation

```yaml
# Input: en.yaml
welcome: Welcome to our app
buttons:
  save: Save
  cancel: Cancel

# Output: fr.yaml (after translation)
welcome: Bienvenue dans notre application
buttons:
  save: Enregistrer
  cancel: Annuler
```

## Development

### Project Structure

```
src/
├── types.ts           # TypeScript interfaces and types
├── config.ts          # Configuration and environment variables
├── translator.ts      # Translation service with Ollama API
├── file-processor.ts  # JSON/YAML file processing
├── cli.ts            # CLI interface with Brocli
└── index.ts          # Entry point and public API
```

### Scripts

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

# Run specific test file
pnpm test translator.test.ts
```

## API Usage

You can also use the tools programmatically:

```typescript
import { Translator, FileProcessor } from '@cedric/translation-tools';

// Initialize translator
const translator = new Translator({
    host: 'localhost:11434',
    model: 'llama3.1:8b',
    temperature: 0.1,
});

// Translate text
const result = await translator.translate('Hello world', 'fr');
console.log(result); // "Bonjour le monde"

// Process files
const processor = new FileProcessor(translator);
await processor.translateFile('src/locales/en.json', 'fr', 'src/locales/fr.json');
```

## Supported Models

- **llama3.1:8b** (recommended) - Best balance of quality and speed
- **llama3.1:70b** - Higher quality, slower
- **llama2** - Good performance
- **mistral** - Alternative option
- Any Ollama-compatible translation model

## Performance Tips

1. **Batch Size**: Adjust `TRANSLATION_BATCH_SIZE` based on your model and hardware
2. **Concurrency**: Increase `TRANSLATION_CONCURRENCY` for faster processing (monitor resource usage)
3. **Model Choice**: Use llama3.1:8b for best speed/quality balance
4. **Temperature**: Keep low (0.1) for consistent translations

## Troubleshooting

### Common Issues

**Connection Error**:

```bash
# Check if Ollama is running
ollama list

# Start Ollama if needed
ollama serve
```

**Model Not Found**:

```bash
# Pull the model
ollama pull llama3.1:8b
```

**Memory Issues**:

- Reduce batch size
- Lower concurrency
- Use a smaller model

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
