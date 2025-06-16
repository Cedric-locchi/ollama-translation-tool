import { promises as fs } from 'fs';
import { glob } from 'glob';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { OllamaTranslator } from './translator.js';
import { FileTranslation, TranslationRequest, TranslationStats } from './types.js';
import { config } from './config.js';
import path from 'path';

export class FileProcessor {
    private translator: OllamaTranslator;

    constructor() {
        this.translator = new OllamaTranslator();
    }

    async processFiles(pattern: string, targetLangs: string[]): Promise<TranslationStats> {
        const startTime = Date.now();
        const files = await glob(pattern);

        if (files.length === 0) {
            throw new Error(`Aucun fichier trouvé avec le pattern: ${pattern}`);
        }

        console.log(`Traitement de ${files.length} fichier(s)...`);

        const fileTranslations: FileTranslation[] = [];
        let totalKeys = 0;
        let translatedKeys = 0;

        for (const filePath of files) {
            const fileTranslation = await this.processFile(filePath, targetLangs);
            fileTranslations.push(fileTranslation);

            const keyCount = this.countKeys(fileTranslation.content);
            totalKeys += keyCount;
            translatedKeys += keyCount * targetLangs.length;
        }

        // Save translated files
        await this.saveTranslations(fileTranslations, targetLangs);

        return {
            totalFiles: files.length,
            totalKeys,
            translatedKeys,
            languages: [config.sourceLang, ...targetLangs],
            duration: Date.now() - startTime,
        };
    }

    private async processFile(filePath: string, targetLangs: string[]): Promise<FileTranslation> {
        const content = await this.loadFile(filePath);
        const translations: Record<string, Record<string, any>> = {};

        for (const targetLang of targetLangs) {
            console.log(`Traduction de ${filePath} vers ${targetLang}...`);
            translations[targetLang] = await this.translateObject(content, targetLang);
        }

        return {
            filePath,
            content,
            translations,
        };
    }

    private async loadFile(filePath: string): Promise<Record<string, any>> {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const ext = path.extname(filePath).toLowerCase();

        switch (ext) {
            case '.json':
                return JSON.parse(fileContent) as Record<string, any>;
            case '.yaml':
            case '.yml':
                return parseYaml(fileContent) as Record<string, any>;
            default:
                throw new Error(`Format de fichier non supporté: ${ext}`);
        }
    }

    private async translateObject(
        obj: Record<string, any>,
        targetLang: string
    ): Promise<Record<string, any>> {
        const result: Record<string, any> = {};
        const requests: { key: string; request: TranslationRequest }[] = [];

        // Collect all strings to translate
        this.collectTranslationRequests(obj, '', requests, targetLang);

        // Batch translation
        const responses = await this.translator.translateBatch(requests.map(item => item.request));

        // Reconstruct object with translations
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i];
            const response = responses[i];
            if (request && response) {
                this.setNestedValue(result, request.key, response.translatedText || '');
            }
        }

        return result;
    }

    private collectTranslationRequests(
        obj: any,
        prefix: string,
        requests: { key: string; request: TranslationRequest }[],
        targetLang: string
    ): void {
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (typeof value === 'string' && value.trim()) {
                requests.push({
                    key: fullKey,
                    request: {
                        text: value,
                        sourceLang: config.sourceLang,
                        targetLang,
                        context: `Clé: ${fullKey}`,
                    },
                });
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                this.collectTranslationRequests(value, fullKey, requests, targetLang);
            }
            // Arrays and other types are ignored for now
        }
    }

    private setNestedValue(obj: Record<string, any>, path: string, value: string): void {
        const keys = path.split('.');
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!key) continue;

            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key] as Record<string, any>;
        }

        const lastKey = keys[keys.length - 1];
        if (lastKey) {
            current[lastKey] = value;
        }
    }

    private async saveTranslations(
        fileTranslations: FileTranslation[],
        targetLangs: string[]
    ): Promise<void> {
        await fs.mkdir(config.outputDir, { recursive: true });

        for (const fileTranslation of fileTranslations) {
            const fileName = path.basename(
                fileTranslation.filePath,
                path.extname(fileTranslation.filePath)
            );
            const ext = path.extname(fileTranslation.filePath);

            for (const lang of targetLangs) {
                const outputPath = path.join(config.outputDir, config.outputFileName);

                let content: string;
                if (ext === '.json') {
                    content = JSON.stringify(fileTranslation.translations[lang], null, 2);
                } else {
                    content = stringifyYaml(fileTranslation.translations[lang]);
                }

                await fs.writeFile(outputPath, content, 'utf-8');
                console.log(`Sauvegardé: ${outputPath}`);
            }
        }
    }

    private countKeys(obj: any, count = 0): number {
        for (const value of Object.values(obj)) {
            if (typeof value === 'string') {
                count++;
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                count = this.countKeys(value, count);
            }
        }
        return count;
    }
}
