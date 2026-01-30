// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    integrations: [
        react(),
    ],
    vite: {
        resolve: {
            alias: {
                "@": "/src",
            },
        },
        plugins: [tailwindcss()],
        optimizeDeps: {
            exclude: ["@resvg/resvg-js"],
        },
    },
    site: "https://timecapsule.srirams.me",
    trailingSlash: "never",
});
