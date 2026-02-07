// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import { SITE } from './src/config';

// https://astro.build/config
export default defineConfig({
    adapter: cloudflare(),
    base: '/TimeCapsule',
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
