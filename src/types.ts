export interface TranslationConfig {
    ollamaHost: string;
    model: string;
    sourceLang: string;
    targetLangs: string[];
    maxConcurrentRequests: number;
    timeout: number;
    translationsDir: string;
    outputDir: string;
    outputFileName: string;
}

export interface TranslationRequest {
    text: string;
    sourceLang: string;
    targetLang: string;
    context?: string;
}

export interface TranslationResponse {
    translatedText: string;
    sourceLang: string;
    targetLang: string;
    model: string;
    confidence?: number;
}

export interface FileTranslation {
    filePath: string;
    content: Record<string, any>;
    translations: Record<string, Record<string, any>>;
}

export interface TranslationStats {
    totalFiles: number;
    totalKeys: number;
    translatedKeys: number;
    languages: string[];
    duration: number;
}
