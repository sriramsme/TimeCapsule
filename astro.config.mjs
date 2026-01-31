// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { SITE } from './src/config';

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
    site: SITE.website,
    trailingSlash: "never",
});
