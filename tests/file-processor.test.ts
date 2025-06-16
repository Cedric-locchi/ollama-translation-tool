import { describe, it, expect, beforeEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { FileProcessor } from '../src/file-processor.js';
import { OllamaTranslator } from '../src/translator.js';
import { config } from '../src/config.js';
import type { TranslationResponse } from '../src/types.js';

// Mock dependencies
vi.mock('fs', () => ({
    promises: {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        mkdir: vi.fn(),
    },
}));

vi.mock('glob', () => ({
    glob: vi.fn(),
}));

// Create mock for translator
const mockTranslateBatch = vi.fn();
vi.mock('../src/translator.js', () => ({
    OllamaTranslator: vi.fn().mockImplementation(() => ({
        translateBatch: mockTranslateBatch,
    })),
}));

describe('FileProcessor', () => {
    let fileProcessor: FileProcessor;
    let mockFs: any;
    let mockGlob: any;

    beforeEach(async () => {
        vi.clearAllMocks();

        // Setup mocks
        mockFs = vi.mocked(fs);
        const globModule = await import('glob');
        mockGlob = vi.mocked(globModule.glob);

        // Reset translator mock
        mockTranslateBatch.mockReset();

        fileProcessor = new FileProcessor();
    });

    describe('processFiles', () => {
        it('should process JSON files successfully', async () => {
            const testJsonContent = JSON.stringify({
                app: { title: 'Test App' },
                nav: { home: 'Home' },
            });

            // Mock file discovery
            mockGlob.mockResolvedValue(['test.json']);

            // Mock file reading
            mockFs.readFile.mockResolvedValue(testJsonContent);

            // Mock translation responses
            const mockTranslations: TranslationResponse[] = [
                {
                    translatedText: 'Application Test',
                    sourceLang: 'en',
                    targetLang: 'fr',
                    model: 'test',
                },
                { translatedText: 'Accueil', sourceLang: 'en', targetLang: 'fr', model: 'test' },
            ];
            mockTranslateBatch.mockResolvedValue(mockTranslations);

            // Mock file writing
            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.writeFile.mockResolvedValue(undefined);

            const stats = await fileProcessor.processFiles('*.json', ['fr']);

            expect(stats.totalFiles).toBe(1);
            expect(stats.totalKeys).toBe(2);
            expect(stats.languages).toEqual([config.sourceLang, 'fr']);
            expect(mockFs.writeFile).toHaveBeenCalled();
        });

        it('should process YAML files successfully', async () => {
            const testYamlContent = `app:
  title: Test App
nav:
  home: Home`;

            mockGlob.mockResolvedValue(['test.yaml']);
            mockFs.readFile.mockResolvedValue(testYamlContent);

            const mockTranslations: TranslationResponse[] = [
                {
                    translatedText: 'Application Test',
                    sourceLang: 'en',
                    targetLang: 'fr',
                    model: 'test',
                },
                { translatedText: 'Accueil', sourceLang: 'en', targetLang: 'fr', model: 'test' },
            ];
            mockTranslateBatch.mockResolvedValue(mockTranslations);

            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.writeFile.mockResolvedValue(undefined);

            const stats = await fileProcessor.processFiles('*.yaml', ['fr']);

            expect(stats.totalFiles).toBe(1);
            expect(stats.totalKeys).toBe(2);
            expect(mockFs.writeFile).toHaveBeenCalled();
        });

        it('should handle multiple target languages', async () => {
            const testContent = JSON.stringify({ message: 'Hello' });

            mockGlob.mockResolvedValue(['test.json']);
            mockFs.readFile.mockResolvedValue(testContent);

            // Mock translations for multiple languages
            mockTranslateBatch
                .mockResolvedValueOnce([
                    {
                        translatedText: 'Bonjour',
                        sourceLang: 'en',
                        targetLang: 'fr',
                        model: 'test',
                    },
                ])
                .mockResolvedValueOnce([
                    { translatedText: 'Hola', sourceLang: 'en', targetLang: 'es', model: 'test' },
                ]);

            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.writeFile.mockResolvedValue(undefined);

            const stats = await fileProcessor.processFiles('*.json', ['fr', 'es']);

            expect(stats.totalFiles).toBe(1);
            expect(stats.languages).toEqual([config.sourceLang, 'fr', 'es']);
            expect(mockFs.writeFile).toHaveBeenCalledTimes(2); // One file per language
        });

        it('should throw error when no files found', async () => {
            mockGlob.mockResolvedValue([]);

            await expect(fileProcessor.processFiles('*.json', ['fr'])).rejects.toThrow(
                'Aucun fichier trouvé avec le pattern: *.json'
            );
        });

        it('should handle unsupported file formats', async () => {
            mockGlob.mockResolvedValue(['test.txt']);
            mockFs.readFile.mockResolvedValue('some content');

            await expect(fileProcessor.processFiles('*.txt', ['fr'])).rejects.toThrow(
                'Format de fichier non supporté: .txt'
            );
        });
    });

    describe('loadFile', () => {
        it('should load and parse JSON files', async () => {
            const testData = { message: 'Hello' };
            mockFs.readFile.mockResolvedValue(JSON.stringify(testData));

            const result = await (fileProcessor as any).loadFile('test.json');

            expect(result).toEqual(testData);
            expect(mockFs.readFile).toHaveBeenCalledWith('test.json', 'utf-8');
        });

        it('should load and parse YAML files', async () => {
            const yamlContent = `message: Hello
app:
  name: Test`;
            mockFs.readFile.mockResolvedValue(yamlContent);

            const result = await (fileProcessor as any).loadFile('test.yaml');

            expect(result).toBeTypeOf('object');
            expect(result.message).toBe('Hello');
            expect(result.app.name).toBe('Test');
            expect(mockFs.readFile).toHaveBeenCalledWith('test.yaml', 'utf-8');
        });

        it('should handle .yml extension', async () => {
            const yamlContent = `message: Hello`;
            mockFs.readFile.mockResolvedValue(yamlContent);

            const result = await (fileProcessor as any).loadFile('test.yml');

            expect(result).toEqual({ message: 'Hello' });
        });

        it('should handle invalid JSON', async () => {
            mockFs.readFile.mockResolvedValue('invalid json {');

            await expect((fileProcessor as any).loadFile('test.json')).rejects.toThrow();
        });

        it('should throw error for unsupported file extensions', async () => {
            mockFs.readFile.mockResolvedValue('some content');

            await expect((fileProcessor as any).loadFile('test.txt')).rejects.toThrow(
                'Format de fichier non supporté: .txt'
            );
        });
    });

    describe('translateObject', () => {
        beforeEach(() => {
            mockTranslateBatch.mockResolvedValue([
                { translatedText: 'Bonjour', sourceLang: 'en', targetLang: 'fr', model: 'test' },
                { translatedText: 'Accueil', sourceLang: 'en', targetLang: 'fr', model: 'test' },
            ]);
        });

        it('should translate simple object', async () => {
            const input = {
                greeting: 'Hello',
                nav: 'Home',
            };

            const result = await (fileProcessor as any).translateObject(input, 'fr');

            expect(result).toEqual({
                greeting: 'Bonjour',
                nav: 'Accueil',
            });
        });

        it('should translate nested objects', async () => {
            const input = {
                app: {
                    title: 'Hello',
                    nav: { home: 'Home' },
                },
            };

            const result = await (fileProcessor as any).translateObject(input, 'fr');

            expect(result.app.title).toBe('Bonjour');
            expect(result.app.nav.home).toBe('Accueil');
        });

        it('should skip empty strings', async () => {
            const input = {
                greeting: 'Hello',
                empty: '',
                whitespace: '   ',
            };

            // Should only translate non-empty strings
            mockTranslateBatch.mockResolvedValue([
                { translatedText: 'Bonjour', sourceLang: 'en', targetLang: 'fr', model: 'test' },
            ]);

            const result = await (fileProcessor as any).translateObject(input, 'fr');

            expect(result.greeting).toBe('Bonjour');
            expect(mockTranslateBatch).toHaveBeenCalledWith([
                expect.objectContaining({ text: 'Hello' }),
            ]);
        });

        it('should ignore non-string values', async () => {
            const input = {
                text: 'Hello',
                number: 42,
                boolean: true,
                nullValue: null,
                array: ['item1', 'item2'],
                object: { nested: 'value' },
            };

            mockTranslateBatch.mockResolvedValue([
                { translatedText: 'Bonjour', sourceLang: 'en', targetLang: 'fr', model: 'test' },
                { translatedText: 'valeur', sourceLang: 'en', targetLang: 'fr', model: 'test' },
            ]);

            const result = await (fileProcessor as any).translateObject(input, 'fr');

            expect(result.text).toBe('Bonjour');
            expect(result.object.nested).toBe('valeur');
            // Should have called translateBatch with 2 string values: 'Hello' and 'value'
            expect(mockTranslateBatch).toHaveBeenCalledWith([
                expect.objectContaining({ text: 'Hello' }),
                expect.objectContaining({ text: 'value' }),
            ]);
        });
    });

    describe('collectTranslationRequests', () => {
        it('should collect translation requests correctly', () => {
            const input = {
                simple: 'Hello',
                nested: {
                    deep: 'World',
                    deeper: {
                        value: 'Test',
                    },
                },
            };

            const requests: any[] = [];
            (fileProcessor as any).collectTranslationRequests(input, '', requests, 'fr');

            expect(requests).toHaveLength(3);
            expect(requests[0]).toMatchObject({
                key: 'simple',
                request: expect.objectContaining({
                    text: 'Hello',
                    targetLang: 'fr',
                    context: 'Clé: simple',
                }),
            });
            expect(requests[1]).toMatchObject({
                key: 'nested.deep',
                request: expect.objectContaining({
                    text: 'World',
                    context: 'Clé: nested.deep',
                }),
            });
            expect(requests[2]).toMatchObject({
                key: 'nested.deeper.value',
                request: expect.objectContaining({
                    text: 'Test',
                    context: 'Clé: nested.deeper.value',
                }),
            });
        });
    });

    describe('setNestedValue', () => {
        it('should set nested values correctly', () => {
            const obj = {};
            (fileProcessor as any).setNestedValue(obj, 'app.nav.home', 'Accueil');

            expect(obj).toEqual({
                app: {
                    nav: {
                        home: 'Accueil',
                    },
                },
            });
        });

        it('should set simple values', () => {
            const obj = {};
            (fileProcessor as any).setNestedValue(obj, 'greeting', 'Bonjour');

            expect(obj).toEqual({
                greeting: 'Bonjour',
            });
        });

        it('should handle existing nested objects', () => {
            const obj = {
                app: {
                    existing: 'value',
                },
            };
            (fileProcessor as any).setNestedValue(obj, 'app.nav.home', 'Accueil');

            expect(obj).toEqual({
                app: {
                    existing: 'value',
                    nav: {
                        home: 'Accueil',
                    },
                },
            });
        });
    });

    describe('countKeys', () => {
        it('should count string keys correctly', () => {
            const obj = {
                simple: 'Hello',
                nested: {
                    deep: 'World',
                    number: 42,
                    boolean: true,
                },
                array: ['item1', 'item2'],
            };

            const count = (fileProcessor as any).countKeys(obj);
            expect(count).toBe(2); // Only 'simple' and 'nested.deep' are strings
        });

        it('should count deeply nested strings', () => {
            const obj = {
                level1: {
                    level2: {
                        level3: {
                            text: 'Hello',
                        },
                        otherText: 'World',
                    },
                },
                topLevel: 'Test',
            };

            const count = (fileProcessor as any).countKeys(obj);
            expect(count).toBe(3); // 'level1.level2.level3.text', 'level1.level2.otherText', 'topLevel'
        });

        it('should return 0 for empty objects', () => {
            const count = (fileProcessor as any).countKeys({});
            expect(count).toBe(0);
        });
    });

    describe('saveTranslations', () => {
        it('should save JSON translations correctly', async () => {
            const fileTranslations = [
                {
                    filePath: 'test.json',
                    content: { message: 'Hello' },
                    translations: {
                        fr: { message: 'Bonjour' },
                        es: { message: 'Hola' },
                    },
                },
            ];

            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.writeFile.mockResolvedValue(undefined);

            await (fileProcessor as any).saveTranslations(fileTranslations, ['fr', 'es']);

            expect(mockFs.mkdir).toHaveBeenCalledWith('es', { recursive: true });
            expect(mockFs.writeFile).toHaveBeenCalledTimes(2);

            // Check JSON formatting
            const jsonCall = mockFs.writeFile.mock.calls.find((call: any) =>
                call[1].includes('"message": "Bonjour"')
            );
            expect(jsonCall).toBeDefined();
        });

        it('should save YAML translations correctly', async () => {
            const fileTranslations = [
                {
                    filePath: 'test.yaml',
                    content: { message: 'Hello' },
                    translations: {
                        fr: { message: 'Bonjour' },
                    },
                },
            ];

            mockFs.mkdir.mockResolvedValue(undefined);
            mockFs.writeFile.mockResolvedValue(undefined);

            await (fileProcessor as any).saveTranslations(fileTranslations, ['fr']);

            expect(mockFs.writeFile).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('message: Bonjour'),
                'utf-8'
            );
        });
    });
});
