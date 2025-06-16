import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'TranslationTools',
            fileName: 'index',
            formats: ['es', 'cjs'],
        },
        rollupOptions: {
            external: [
                'ollama',
                'commander',
                'chalk',
                'ora',
                'glob',
                'yaml',
                'dotenv',
                'fs',
                'path',
            ],
        },
        target: 'node18',
        outDir: 'dist',
        minify: false,
        sourcemap: true,
    },
    esbuild: {
        platform: 'node',
        format: 'esm',
        target: 'node18',
    },
});
