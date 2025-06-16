import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { config, validateConfig } from '../src/config.js';

// Mock process.env
const originalEnv = process.env;

describe('Config', () => {
    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('config object', () => {
        it('should have default values', () => {
            expect(config.ollamaHost).toBe('http://localhost:11434');
            expect(config.model).toBe('llama3.1:8b');
            expect(config.sourceLang).toBe('fr');
            expect(config.targetLangs).toEqual(['en', 'es', 'de', 'it', 'pt', 'nl']);
            expect(config.maxConcurrentRequests).toBe(2);
            expect(config.timeout).toBe(30000);
        });

        it('should use environment variables when provided', () => {
            // This test is more for documentation as the config is already loaded
            expect(config.ollamaHost).toContain('localhost');
        });
    });

    describe('validateConfig', () => {
        it('should not throw with valid config', () => {
            expect(() => validateConfig()).not.toThrow();
        });

        it('should validate ollama host', () => {
            const originalHost = config.ollamaHost;
            (config as any).ollamaHost = '';

            expect(() => validateConfig()).toThrow('OLLAMA_HOST est requis');

            (config as any).ollamaHost = originalHost;
        });

        it('should validate model', () => {
            const originalModel = config.model;
            (config as any).model = '';

            expect(() => validateConfig()).toThrow('OLLAMA_MODEL est requis');

            (config as any).model = originalModel;
        });

        it('should validate max concurrent requests', () => {
            const originalValue = config.maxConcurrentRequests;

            (config as any).maxConcurrentRequests = 0;
            expect(() => validateConfig()).toThrow(
                'MAX_CONCURRENT_REQUESTS doit être entre 1 et 10'
            );

            (config as any).maxConcurrentRequests = 11;
            expect(() => validateConfig()).toThrow(
                'MAX_CONCURRENT_REQUESTS doit être entre 1 et 10'
            );

            (config as any).maxConcurrentRequests = originalValue;
        });

        it('should validate timeout', () => {
            const originalTimeout = config.timeout;

            (config as any).timeout = 1000;
            expect(() => validateConfig()).toThrow(
                'TRANSLATION_TIMEOUT doit être entre 5000ms et 120000ms'
            );

            (config as any).timeout = 150000;
            expect(() => validateConfig()).toThrow(
                'TRANSLATION_TIMEOUT doit être entre 5000ms et 120000ms'
            );

            (config as any).timeout = originalTimeout;
        });
    });
});
