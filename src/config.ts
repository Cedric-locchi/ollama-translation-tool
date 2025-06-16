import dotenv from 'dotenv';
import { TranslationConfig } from './types.js';

dotenv.config();

export const config: TranslationConfig = {
    ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
    sourceLang: process.env.DEFAULT_SOURCE_LANG || 'fr',
    targetLangs: process.env.DEFAULT_TARGET_LANGS?.split(',') || ['en', 'es', 'de', 'it', 'pt', 'nl'],
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '3'),
    timeout: parseInt(process.env.TRANSLATION_TIMEOUT || '30000'),
    translationsDir: process.env.TRANSLATIONS_DIR || './translations',
    fileName: process.env.FILE_NAME || undefined,
};

export function validateConfig(): void {
    if (!config.ollamaHost) {
        throw new Error('OLLAMA_HOST est requis');
    }

    if (!config.model) {
        throw new Error('OLLAMA_MODEL est requis');
    }

    if (config.maxConcurrentRequests < 1 || config.maxConcurrentRequests > 10) {
        throw new Error('MAX_CONCURRENT_REQUESTS doit être entre 1 et 10');
    }

    if (config.timeout < 5000 || config.timeout > 120000) {
        throw new Error('TRANSLATION_TIMEOUT doit être entre 5000ms et 120000ms');
    }
}
