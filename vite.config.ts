import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    plugins: [tailwindcss(), react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    base: '/',
    server: {
        host: true,
        port: 5173
    },
    build: {
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    query: ['@tanstack/react-query'],
                    form: ['react-hook-form', '@hookform/resolvers', 'yup']
                }
            }
        },
        chunkSizeWarningLimit: 1000
    }
});
