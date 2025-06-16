import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OllamaTranslator } from '../src/translator.js';
import { config } from '../src/config.js';
import type { TranslationRequest } from '../src/types.js';

// Create mock functions outside of the mock
const mockList = vi.fn();
const mockGenerate = vi.fn();

// Mock Ollama
vi.mock('ollama', () => ({
    Ollama: vi.fn().mockImplementation(() => ({
        list: mockList,
        generate: mockGenerate,
    })),
}));

describe('OllamaTranslator', () => {
    let translator: OllamaTranslator;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        mockList.mockReset();
        mockGenerate.mockReset();

        // Create translator instance
        translator = new OllamaTranslator();
    });

    describe('isAvailable', () => {
        it('should return true when model is available', async () => {
            // Mock successful model list
            mockList.mockResolvedValue({
                models: [{ name: config.model }, { name: 'other-model' }],
            });

            const result = await translator.isAvailable();

            expect(result).toBe(true);
            expect(mockList).toHaveBeenCalledOnce();
        });

        it('should return false when model is not available', async () => {
            // Mock model list without our model
            mockList.mockResolvedValue({
                models: [{ name: 'other-model-1' }, { name: 'other-model-2' }],
            });

            const result = await translator.isAvailable();

            expect(result).toBe(false);
        });

        it('should return false when Ollama connection fails', async () => {
            // Mock connection error
            mockList.mockRejectedValue(new Error('Connection failed'));

            const result = await translator.isAvailable();

            expect(result).toBe(false);
        });
    });

    describe('translate', () => {
        const mockRequest: TranslationRequest = {
            text: 'Hello world',
            sourceLang: 'en',
            targetLang: 'fr',
        };

        it('should translate text successfully', async () => {
            // Mock successful translation
            mockGenerate.mockResolvedValue({
                response: 'Bonjour le monde',
            });

            const result = await translator.translate(mockRequest);

            expect(result).toEqual({
                translatedText: 'Bonjour le monde',
                sourceLang: 'en',
                targetLang: 'fr',
                model: config.model,
            });

            expect(mockGenerate).toHaveBeenCalledWith({
                model: config.model,
                prompt: expect.stringContaining('Hello world'),
                stream: false,
                options: {
                    temperature: 0.1,
                    top_p: 0.9,
                },
            });
        });

        it('should include context in prompt when provided', async () => {
            mockGenerate.mockResolvedValue({
                response: 'Bonjour le monde',
            });

            const requestWithContext = {
                ...mockRequest,
                context: 'UI greeting message',
            };

            await translator.translate(requestWithContext);

            const generateCall = mockGenerate.mock.calls[0][0];
            expect(generateCall.prompt).toContain('UI greeting message');
        });

        it('should clean translation response', async () => {
            // Mock response with prefixes/suffixes
            mockGenerate.mockResolvedValue({
                response: 'Traduction: "Bonjour le monde"',
            });

            const result = await translator.translate(mockRequest);

            expect(result.translatedText).toBe('Bonjour le monde');
        });

        it('should handle translation errors', async () => {
            // Mock translation error
            mockGenerate.mockRejectedValue(new Error('Translation failed'));

            await expect(translator.translate(mockRequest)).rejects.toThrow(
                'Erreur de traduction: Translation failed'
            );
        });

        it('should build correct prompt with language names', async () => {
            mockGenerate.mockResolvedValue({
                response: 'Hallo Welt',
            });

            const germanRequest: TranslationRequest = {
                text: 'Hello world',
                sourceLang: 'en',
                targetLang: 'de',
            };

            await translator.translate(germanRequest);

            const generateCall = mockGenerate.mock.calls[0][0];
            expect(generateCall.prompt).toContain('anglais');
            expect(generateCall.prompt).toContain('allemand');
            expect(generateCall.prompt).toContain('Hello world');
        });
    });

    describe('translateBatch', () => {
        const mockRequests: TranslationRequest[] = [
            { text: 'Hello', sourceLang: 'en', targetLang: 'fr' },
            { text: 'World', sourceLang: 'en', targetLang: 'fr' },
            { text: 'Test', sourceLang: 'en', targetLang: 'fr' },
        ];

        it('should translate multiple requests successfully', async () => {
            // Mock successful translations
            mockGenerate
                .mockResolvedValueOnce({ response: 'Bonjour' })
                .mockResolvedValueOnce({ response: 'Monde' })
                .mockResolvedValueOnce({ response: 'Test' });

            const results = await translator.translateBatch(mockRequests);

            expect(results).toHaveLength(3);
            expect(results[0].translatedText).toBe('Bonjour');
            expect(results[1].translatedText).toBe('Monde');
            expect(results[2].translatedText).toBe('Test');
        });

        it('should handle batch translation with errors', async () => {
            // Mock mixed success/failure
            mockGenerate
                .mockResolvedValueOnce({ response: 'Bonjour' })
                .mockRejectedValueOnce(new Error('Translation failed'))
                .mockResolvedValueOnce({ response: 'Test' });

            const results = await translator.translateBatch(mockRequests);

            expect(results).toHaveLength(3);
            expect(results[0].translatedText).toBe('Bonjour');
            expect(results[1].translatedText).toBe(''); // Error case
            expect(results[2].translatedText).toBe('Test');
        });

        it('should respect concurrency limits', async () => {
            // Create more requests than the concurrency limit
            const manyRequests = Array.from({ length: 10 }, (_, i) => ({
                text: `Text ${i}`,
                sourceLang: 'en',
                targetLang: 'fr',
            }));

            // Mock responses
            mockGenerate.mockResolvedValue({ response: 'Translated' });

            await translator.translateBatch(manyRequests);

            // Should have been called for all requests
            expect(mockGenerate).toHaveBeenCalledTimes(10);
        });
    });

    describe('extractTranslation', () => {
        it('should extract clean translation from various response formats', () => {
            const testCases = [
                { input: 'Bonjour le monde', expected: 'Bonjour le monde' },
                { input: 'Traduction: Bonjour le monde', expected: 'Bonjour le monde' },
                { input: 'Translation: Bonjour le monde', expected: 'Bonjour le monde' },
                { input: '"Bonjour le monde"', expected: 'Bonjour le monde' },
                { input: "'Bonjour le monde'", expected: 'Bonjour le monde' },
                { input: '  Bonjour le monde  ', expected: 'Bonjour le monde' },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = (translator as any).extractTranslation(input);
                expect(result).toBe(expected);
            });
        });
    });

    describe('chunkArray', () => {
        it('should split array into correct chunks', () => {
            const array = [1, 2, 3, 4, 5, 6, 7];
            const chunks = (translator as any).chunkArray(array, 3);

            expect(chunks).toHaveLength(3);
            expect(chunks[0]).toEqual([1, 2, 3]);
            expect(chunks[1]).toEqual([4, 5, 6]);
            expect(chunks[2]).toEqual([7]);
        });

        it('should handle empty arrays', () => {
            const chunks = (translator as any).chunkArray([], 3);
            expect(chunks).toHaveLength(0);
        });

        it('should handle chunk size larger than array', () => {
            const array = [1, 2];
            const chunks = (translator as any).chunkArray(array, 5);

            expect(chunks).toHaveLength(1);
            expect(chunks[0]).toEqual([1, 2]);
        });
    });

    describe('buildTranslationPrompt', () => {
        it('should build correct prompt structure', () => {
            const request: TranslationRequest = {
                text: 'Hello world',
                sourceLang: 'en',
                targetLang: 'fr',
                context: 'Test context',
            };

            const prompt = (translator as any).buildTranslationPrompt(request);

            expect(prompt).toContain('anglais');
            expect(prompt).toContain('français');
            expect(prompt).toContain('Hello world');
            expect(prompt).toContain('Test context');
            expect(prompt).toContain('RÈGLES STRICTES');
        });

        it('should work without context', () => {
            const request: TranslationRequest = {
                text: 'Hello world',
                sourceLang: 'en',
                targetLang: 'fr',
            };

            const prompt = (translator as any).buildTranslationPrompt(request);

            expect(prompt).toContain('anglais');
            expect(prompt).toContain('français');
            expect(prompt).toContain('Hello world');
            expect(prompt).not.toContain('Contexte:');
        });

        it('should handle unknown language codes', () => {
            const request: TranslationRequest = {
                text: 'Hello world',
                sourceLang: 'xx',
                targetLang: 'yy',
            };

            const prompt = (translator as any).buildTranslationPrompt(request);

            expect(prompt).toContain('xx');
            expect(prompt).toContain('yy');
            expect(prompt).toContain('Hello world');
        });
    });
});
