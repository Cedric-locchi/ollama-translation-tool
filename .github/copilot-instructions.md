<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Copilot Instructions for Translation Tools

This project is a set of TypeScript/Node.js tools for automated file translation with Ollama.

## Project Architecture

- **src/types.ts** : TypeScript definitions for interfaces and types
- **src/config.ts** : Configuration and environment variables
- **src/translator.ts** : Translation service with Ollama API
- **src/file-processor.ts** : Processing and conversion of JSON/YAML files
- **src/cli.ts** : CLI interface with Commander.js
- **src/index.ts** : Entry point and public API

## Code Conventions

1. **Use strict TypeScript** with tsconfig.json options
2. **ES module imports** with `.js` extension for compatibility
3. **Error handling** with try/catch and explicit messages
4. **Configuration via environment variables** with dotenv
5. **Colored logging** with chalk and ora for CLI UX

## Specific Patterns

- **Batch translation** : Group requests to optimize performance
- **Context preservation** : Maintain nested object structure
- **Concurrency management** : Limit simultaneous requests to Ollama
- **Safe types** : Use interfaces defined in types.ts

## Ollama Integration

- **Configurable host** via OLLAMA_HOST (default: localhost:11434)
- **Supported models** : Priority to llama3.1:8b for quality/speed
- **Optimized prompts** : Low temperature (0.1) for consistency
- **Fallback errors** : Handle timeouts and network errors

## CLI Commands

- `translate` : File translation with glob patterns
- `check` : Configuration verification and Ollama connection
- `test` : Quick test of text translation

Always prioritize type safety and performance for large volume translations.
