import { toPng, toJpeg } from 'html-to-image';
import LZString from 'lz-string';
import type { Capsule, ShareMetadata, ShareData } from '../types';
import { storage } from './storage';
import { sortCapsules } from './capsules';

/**
 * Get base URL for sharing based on environment
 */
function getShareBaseUrl(): string {
    return import.meta.env.PUBLIC_VITE_SHARE_BASE_URL;
}

/**
 * Export timeline as image
 * Uses html-to-image instead of html2canvas for better CSS support
 */
export async function exportAsImage(
    elementId: string,
    filename: string = 'timecapsule.png'
): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error('Export element not found');
    }

    try {
        // Clone element to avoid affecting the original
        const clone = element.cloneNode(true) as HTMLElement;

        // Hide any elements that shouldn't be exported
        clone.querySelectorAll('[data-no-export]').forEach(el => {
            (el as HTMLElement).style.display = 'none';
        });

        // Create high-quality image
        const dataUrl = await toPng(element, {
            quality: 1,
            pixelRatio: 2, // 2x resolution
            cacheBust: true,
            backgroundColor: '#ffffff',
        });

        // Download the image
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.click();
    } catch (error) {
        console.error('Failed to export image:', error);

        // Fallback to JPEG if PNG fails
        try {
            console.log('Trying JPEG fallback...');
            const dataUrl = await toJpeg(element, {
                quality: 0.95,
                pixelRatio: 2,
                cacheBust: true,
                backgroundColor: '#ffffff',
            });

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename.replace('.png', '.jpg');
            link.click();
        } catch (fallbackError) {
            console.error('JPEG fallback also failed:', fallbackError);
            throw new Error('Failed to export image. Please try again.');
        }
    }
}

/**
 * Export capsules as JSON
 * Handles two modes: local (with data URLs) and shareable (URLs only)
 */
export function exportAsJSON(
    capsules: Capsule[],
    filename: string = 'timecapsule.json',
    shareableMode: boolean = false,
    metadata?: ShareMetadata
): void {
    try {
        let exportCapsules = capsules;

        if (shareableMode) {
            // For sharing: exclude data URLs (base64 images)
            exportCapsules = capsules.map(capsule => {
                const isDataUrl = capsule.mediaUrl?.startsWith('data:');

                return {
                    ...capsule,
                    mediaUrl: isDataUrl ? undefined : capsule.mediaUrl,
                    mediaType: isDataUrl ? undefined : capsule.mediaType,
                };
            });
        }

        const shareData: ShareData = {
            capsules: exportCapsules,
            ...(metadata && { metadata })
        };

        const jsonString = JSON.stringify(shareData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Failed to export JSON:', error);
        throw new Error('Failed to export JSON file. Please try again.');
    }
}

/**
 * Import JSON file
 */
export function importJSONFile(file: File): Promise<ShareData> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const jsonString = e.target?.result as string;
                const parsed = JSON.parse(jsonString);

                // Handle both old format (array) and new format (ShareData)
                if (Array.isArray(parsed)) {
                    resolve({ capsules: parsed });
                } else {
                    resolve(parsed as ShareData);
                }
            } catch (error) {
                reject(new Error('Invalid JSON file format'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsText(file);
    });
}

/**
 * Trigger file input dialog
 */
export function triggerFileInput(
    accept: string = '.json',
    callback: (file: File) => void
): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;

    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            callback(file);
        }
    };

    input.click();
}

/**
 * Import from URL (for shareable links)
 */
export async function importFromURL(url: string): Promise<ShareData> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const jsonString = await response.text();
        const parsed = JSON.parse(jsonString);

        // Handle both old format (array) and new format (ShareData)
        if (Array.isArray(parsed)) {
            return { capsules: parsed };
        }

        return parsed as ShareData;
    } catch (error) {
        console.error('Failed to import from URL:', error);
        throw new Error('Failed to load timeline from URL. Please check the link.');
    }
}

/**
 * Generate shareable URL with JSON data
 * Returns object with URL and whether it needs external hosting
 */
export function generateShareableURL(
    capsules: Capsule[],
    metadata?: ShareMetadata
): { url: string; needsExternalUrl: boolean; estimatedSize: number } {
    try {
        // Export in shareable mode (no data URLs)
        const shareableCapsules = capsules.map(capsule => {
            const isDataUrl = capsule.mediaUrl?.startsWith('data:');

            return {
                ...capsule,
                mediaUrl: isDataUrl ? undefined : capsule.mediaUrl,
                mediaType: isDataUrl ? undefined : capsule.mediaType,
            };
        });

        const shareData: ShareData = {
            capsules: shareableCapsules,
            ...(metadata && { metadata: { ...metadata, sharedAt: new Date().toISOString() } })
        };

        const jsonString = JSON.stringify(shareData);

        // Compress using LZ-String
        const compressed = LZString.compressToEncodedURIComponent(jsonString);

        // Build URL
        const baseUrl = getShareBaseUrl();
        const shareUrl = `${baseUrl}?data=${compressed}`;

        // Check URL length (browsers have ~2000 char limit, we use 1900 to be safe)
        const estimatedSize = new Blob([jsonString]).size;

        if (shareUrl.length > 1900) {
            return {
                url: '',
                needsExternalUrl: true,
                estimatedSize
            };
        }

        return {
            url: shareUrl,
            needsExternalUrl: false,
            estimatedSize
        };
    } catch (error) {
        console.error('Failed to generate shareable URL:', error);
        throw error;
    }
}

/**
 * Generate shareable URL with external JSON URL
 */
export function generateShareableURLWithExternal(
    externalUrl: string,
    metadata?: ShareMetadata
): string {
    const baseUrl = getShareBaseUrl();
    const params = new URLSearchParams();
    params.set('url', externalUrl);

    if (metadata) {
        params.set('meta', LZString.compressToEncodedURIComponent(JSON.stringify(metadata)));
    }

    return `${baseUrl}?${params.toString()}`;
}

/**
 * Import from URL parameter
 */
export async function importFromURLParameter(): Promise<ShareData | null> {
    try {
        const params = new URLSearchParams(window.location.search);

        // Check for inline data parameter
        if (params.has('data')) {
            return importFromURLParameterData(params.get('data')!);
        }

        // Check for external URL parameter
        if (params.has('url')) {
            const shareData = await importFromURLParameterUrl(params.get('url')!);

            // Check for separate metadata
            if (params.has('meta')) {
                try {
                    const metaString = LZString.decompressFromEncodedURIComponent(params.get('meta')!);
                    if (metaString) {
                        const metadata = JSON.parse(metaString);
                        return {
                            ...shareData,
                            metadata
                        };
                    }
                } catch (e) {
                    console.warn('Failed to parse metadata:', e);
                }
            }

            return shareData;
        }

        // Legacy support for old 'import' parameter
        if (params.has('import')) {
            return importFromURLParameterLegacy(params.get('import')!);
        }

        return null;
    } catch (error) {
        console.error('Failed to import from URL parameter:', error);
        return null;
    }
}

async function importFromURLParameterData(dataParam: string): Promise<ShareData | null> {
    try {
        if (!dataParam) return null;

        // Decompress using LZ-String
        const jsonString = LZString.decompressFromEncodedURIComponent(dataParam);

        if (!jsonString) {
            throw new Error('Failed to decompress data');
        }

        const parsed = JSON.parse(jsonString);

        // Handle both old format (array) and new format (ShareData)
        const shareData: ShareData = Array.isArray(parsed)
            ? { capsules: parsed }
            : parsed;

        // Clear the URL parameter after import
        const url = new URL(window.location.href);
        url.searchParams.delete('data');
        window.history.replaceState({}, '', url.toString());

        return {
            ...shareData,
            capsules: sortCapsules(shareData.capsules)
        };
    } catch (error) {
        console.error('Failed to import from inline data:', error);
        return null;
    }
}

async function importFromURLParameterUrl(urlParam: string): Promise<ShareData> {
    try {
        const response = await fetch(urlParam);

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const jsonString = await response.text();
        const parsed = JSON.parse(jsonString);

        // Handle both old format (array) and new format (ShareData)
        const shareData: ShareData = Array.isArray(parsed)
            ? { capsules: parsed }
            : parsed;

        return {
            ...shareData,
            capsules: sortCapsules(shareData.capsules)
        };
    } catch (error) {
        console.error('Failed to import from external URL:', error);
        throw new Error('Failed to load timeline from URL. Please check the link.');
    }
}

// Legacy support for old compression method
async function importFromURLParameterLegacy(importData: string): Promise<ShareData | null> {
    try {
        if (!importData) return null;

        const decoded = decodeURIComponent(importData);
        const jsonString = atob(decoded);
        const parsed = JSON.parse(jsonString);

        // Clear the URL parameter after import
        const url = new URL(window.location.href);
        url.searchParams.delete('import');
        window.history.replaceState({}, '', url.toString());

        return {
            capsules: sortCapsules(Array.isArray(parsed) ? parsed : parsed.capsules)
        };
    } catch (error) {
        console.error('Failed to import from legacy URL parameter:', error);
        return null;
    }
}

/**
 * Get file size estimate for export
 */
export function estimateExportSize(capsules: Capsule[]): {
    jsonSize: string;
    withDataUrls: string;
    dataUrlCount: number;
} {
    const jsonString = storage.exportJSON(capsules);
    const jsonSize = new Blob([jsonString]).size;

    const dataUrlCount = capsules.filter(c => c.mediaUrl?.startsWith('data:')).length;

    // Estimate without data URLs
    const shareableCapsules = capsules.map(c => ({
        ...c,
        mediaUrl: c.mediaUrl?.startsWith('data:') ? undefined : c.mediaUrl,
        mediaType: c.mediaUrl?.startsWith('data:') ? undefined : c.mediaType,
    }));
    const shareableSize = new Blob([JSON.stringify(shareableCapsules)]).size;

    return {
        jsonSize: formatBytes(shareableSize),
        withDataUrls: formatBytes(jsonSize),
        dataUrlCount,
    };
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}