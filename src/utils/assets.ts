// src/utils/assets.ts
export const asset = (path: string) => {
    const base = import.meta.env.BASE_URL;
    return `${base}/${path.replace(/^\//, '')}`; // Also strips leading / if accidentally included
};