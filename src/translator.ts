import { Ollama } from 'ollama';
import { TranslationRequest, TranslationResponse } from './types.js';
import { config } from './config.js';

export class OllamaTranslator {
    private ollama: Ollama;

    constructor() {
        this.ollama = new Ollama({ host: config.ollamaHost });
    }

    async isAvailable(): Promise<boolean> {
        try {
            const models = await this.ollama.list();
            return models.models.some(model => model.name === config.model);
        } catch (error) {
            console.error('Erreur de connexion à Ollama:', error);
            return false;
        }
    }

    async translate(request: TranslationRequest): Promise<TranslationResponse> {
        const prompt = this.buildTranslationPrompt(request);

        try {
            const response = await this.ollama.generate({
                model: config.model,
                prompt,
                stream: false,
                options: {
                    temperature: 0.1,
                    top_p: 0.9,
                },
            });

            const translatedText = this.extractTranslation(response.response);

            return {
                translatedText,
                sourceLang: request.sourceLang,
                targetLang: request.targetLang,
                model: config.model,
            };
        } catch (error) {
            throw new Error(`Erreur de traduction: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    }

    private buildTranslationPrompt(request: TranslationRequest): string {
        const context = request.context ? `\n\nContexte: ${request.context}` : '';

        const languageNames: Record<string, string> = {
            fr: 'français',
            en: 'anglais',
            es: 'espagnol',
            de: 'allemand',
            it: 'italien',
            pt: 'portugais',
            nl: 'néerlandais',
        };

        const sourceLangName = languageNames[request.sourceLang] || request.sourceLang;
        const targetLangName = languageNames[request.targetLang] || request.targetLang;

        return `Tu es un traducteur professionnel expert. Traduis EXACTEMENT le texte suivant du ${sourceLangName} vers le ${targetLangName}.

RÈGLES STRICTES:
- Tu DOIS traduire vers le ${targetLangName} uniquement
- Ne retourne QUE la traduction, rien d'autre
- Pas d'explication, pas de commentaire
- Conserve les variables/placeholders comme {variable} ou {{variable}}
- Respecte le style et le ton${context}

Texte en ${sourceLangName}: "${request.text}"

Traduction en ${targetLangName}:`;
    }

    private extractTranslation(response: string): string {
        const cleaned = response
            .trim()
            .replace(/^(Traduction|Translation):\s*/i, '')
            .replace(/^["']|["']$/g, '')
            .trim();

        return cleaned || response.trim();
    }

    async translateBatch(requests: TranslationRequest[]): Promise<TranslationResponse[]> {
        const results: TranslationResponse[] = [];
        const chunks = this.chunkArray(requests, config.maxConcurrentRequests);

        for (const chunk of chunks) {
            const chunkPromises = chunk.map(request => this.translate(request));
            const chunkResults = await Promise.allSettled(chunkPromises);

            for (const result of chunkResults) {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    console.error('Erreur de traduction:', result.reason);
                    results.push({
                        translatedText: '',
                        sourceLang: '',
                        targetLang: '',
                        model: config.model,
                    });
                }
            }
        }

        return results;
    }

    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}
