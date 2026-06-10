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
        port: 5173,
        proxy: {
            '/api': {
                target: 'https://api-tallam.vocus-dev2.com',
                changeOrigin: true,
                secure: true,
                rewrite: (path) => {
                    // If path already contains /v2/front, don't rewrite
                    if (path.startsWith('/api/v2/front')) {
                        return path;
                    }
                    // Otherwise rewrite /api to /api/v2/front
                    return path.replace(/^\/api/, '/api/v2/front');
                },
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        console.log('proxy error', err);
                    });
                }
            }
        }
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
