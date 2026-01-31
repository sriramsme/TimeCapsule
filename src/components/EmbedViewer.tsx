import { useEffect, useState } from "react";
import type { Capsule, LayoutMode, ShareMetadata } from "@/types";
import { importFromURLParameter } from "@/utils/export";
import Timeline from "./Timeline";

interface EmbedViewerProps {
    layoutMode?: LayoutMode;
    showMetadata?: boolean;
}

/**
 * Dedicated embed viewer for iframe embeds
 * Stripped down version with no navigation, optimized for embedding
 */
export default function EmbedViewer({ layoutMode, showMetadata }: EmbedViewerProps) {
    const [capsules, setCapsules] = useState<Capsule[]>([]);
    const [metadata, setMetadata] = useState<ShareMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const imported = await importFromURLParameter();
                if (imported) {
                    setCapsules(imported.capsules);
                    setMetadata(imported.metadata || null);
                } else {
                    setError("No timeline found");
                }
            } catch (err) {
                setError("Failed to load timeline");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Handle height changes and send to parent
    useEffect(() => {
        let resizeObserver: ResizeObserver | null = null;
        let lastSentHeight = 0;
        let timeoutId: any = null;

        const sendHeight = () => {
            // Use scrollHeight for actual content height
            const height = document.documentElement.scrollHeight;

            // Only send if height changed significantly (prevents feedback loop)
            if (Math.abs(height - lastSentHeight) > 5) {
                lastSentHeight = height;
                window.parent.postMessage(
                    { type: "timecapsule-resize", height },
                    "*"
                );
            }
        };

        // Debounced send function
        const debouncedSend = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                requestAnimationFrame(sendHeight);
            }, 150);
        };

        // Initial send after content loads
        const initialSend = setTimeout(sendHeight, 300);

        // Use ResizeObserver to detect content changes
        resizeObserver = new ResizeObserver(() => {
            debouncedSend();
        });

        // Only observe the main content container, not the whole body
        const mainContent = document.querySelector('main');
        if (mainContent) {
            resizeObserver.observe(mainContent);
        }

        // Send on image loads
        const handleImageLoad = () => {
            setTimeout(sendHeight, 100);
        };

        const images = document.querySelectorAll("img");
        images.forEach((img) => {
            if (!img.complete) {
                img.addEventListener("load", handleImageLoad, { once: true });
            }
        });

        return () => {
            clearTimeout(initialSend);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [capsules]);

    // Handle theme sync from parent
    useEffect(() => {
        const handleThemeMessage = (event: MessageEvent) => {
            if (event.data?.type === 'timecapsule-theme') {
                const html = document.documentElement;
                if (event.data.theme === 'dark') {
                    html.setAttribute('data-theme', 'dark');
                } else {
                    html.setAttribute('data-theme', 'light');
                }
            }
        };

        window.addEventListener('message', handleThemeMessage);

        // Request initial theme from parent
        window.parent.postMessage({ type: 'timecapsule-request-theme' }, '*');

        return () => window.removeEventListener('message', handleThemeMessage);
    }, []);

    if (loading) {
        return (
            <div className="min-h-[200px] flex items-center justify-center bg-background p-4">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">
                        Loading timeline...
                    </p>
                </div>
            </div>
        );
    }

    if (error || capsules.length === 0) {
        return (
            <div className="min-h-[200px] flex items-center justify-center bg-background p-4">
                <div className="text-center space-y-3 max-w-sm">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto border border-border">
                        <svg
                            className="w-6 h-6 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                        </svg>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        {error || "Timeline not available"}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background text-foreground mt-4 scrollbar-hidden">
            {/* Header with metadata */}
            {metadata && showMetadata && (
                <div className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container mx-auto px-4 max-w-4xl py-4">
                        <div className="flex items-center gap-4">
                            {metadata.profilePic && (
                                <img
                                    src={metadata.profilePic}
                                    alt={metadata.name || 'Profile'}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-accent-500"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            )}

                            <div className="flex-1 min-w-0">
                                {metadata.name && (
                                    <h2 className="font-display font-bold text-lg truncate text-foreground">
                                        {metadata.name}'s Timeline
                                    </h2>
                                )}

                                {metadata.bio && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {metadata.bio}
                                    </p>
                                )}

                                {metadata.sharedAt && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Shared {new Date(metadata.sharedAt).toLocaleDateString()}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-4 py-2 text-sm rounded-lg whitespace-nowrap
                                       bg-accent-500 text-primary-foreground
                                       hover:bg-accent-600 transition-colors"
                            >
                                Create Your Own
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Simple header if no metadata */}
            {!metadata && showMetadata && (
                <div className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center
                                            bg-gradient-to-br from-accent-500 to-accent-600">
                                    <span className="text-primary-foreground text-sm font-bold">
                                        TC
                                    </span>
                                </div>

                                <div>
                                    <h1 className="font-display font-bold text-lg text-foreground">
                                        Shared Timeline
                                    </h1>
                                    <p className="text-xs text-muted-foreground">
                                        View only
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-4 py-2 text-sm rounded-lg
                                       bg-accent-500 text-primary-foreground
                                       hover:bg-accent-600 transition-colors"
                            >
                                Create Your Own
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <main className="container mx-auto max-w-4xl pb-8">
                <Timeline
                    sharedCapsules={capsules}
                    readOnly
                    defaultLayoutMode={layoutMode}
                />
            </main>
        </div>
    );
}