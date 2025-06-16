export { OllamaTranslator } from './translator.js';
export { FileProcessor } from './file-processor.js';
export { config, validateConfig } from './config.js';
export * from './types.js';

export async function quickTranslate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const { OllamaTranslator } = await import('./translator.js');
    const translator = new OllamaTranslator();
    const result = await translator.translate({
        text,
        sourceLang,
        targetLang,
    });
    return result.translatedText;
}

export async function translateFiles(pattern: string, targetLangs: string[]): Promise<void> {
    const { FileProcessor } = await import('./file-processor.js');
    const processor = new FileProcessor();
    await processor.processFiles(pattern, targetLangs);
}
