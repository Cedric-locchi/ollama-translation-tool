import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        ssr: true,
        target: 'node18',
        outDir: 'dist',
        rollupOptions: {
            input: resolve(__dirname, 'src/cli.ts'),
            output: {
                entryFileNames: 'cli.js',
                format: 'es',
                banner: '#!/usr/bin/env node',
            },
            external: ['ollama', 'commander', 'chalk', 'ora', 'glob', 'yaml', 'dotenv'],
        },
        minify: false,
        sourcemap: false,
        emptyOutDir: false,
    },
});
