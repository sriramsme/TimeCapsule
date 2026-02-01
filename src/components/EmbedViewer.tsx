import { useEffect, useState, } from "react";
import type { Capsule, LayoutMode, ShareMetadata } from "@/types";
import { importFromURLParameter } from "@/utils/export";
import Timeline from "./Timeline";

/**
 * Dedicated embed viewer for iframe embeds
 * Stripped down version with no navigation, optimized for embedding
 */
export default function EmbedViewer() {
    const [capsules, setCapsules] = useState<Capsule[]>([]);
    const [metadata, setMetadata] = useState<ShareMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('masonry');
    const [showMetadata, setShowMetadata] = useState(false);

    // Extract URL parameters on mount
    useEffect(() => {
        const url = window.location.href;
        const searchParams = new URL(url).searchParams;

        const layout = (searchParams.get("layout") as LayoutMode) || "masonry";
        const showMeta = searchParams.get("showMetadata") === "true";

        console.log('🔗 EmbedViewer params:', { layout, showMeta });

        setLayoutMode(layout);
        setShowMetadata(showMeta);
    }, []);

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
        let mutationObserver: MutationObserver | null = null;
        let lastSentHeight = 0;
        let timeoutId: any = null;

        const sendHeight = () => {
            const mainContent = document.querySelector('main');
            if (!mainContent) return;

            // Get the actual rendered height of main + any offset from top
            const rect = mainContent.getBoundingClientRect();
            const height = Math.ceil(rect.bottom + window.scrollY);

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
        let lastObservedSize = { width: 0, height: 0 };

        resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;

                // Only trigger if size actually changed
                if (Math.abs(width - lastObservedSize.width) > 1 ||
                    Math.abs(height - lastObservedSize.height) > 1) {
                    lastObservedSize = { width, height };
                    debouncedSend();
                }
            }
        });

        // Only observe the main content container, not the whole body
        const mainContent = document.querySelector('main');
        if (mainContent) {
            resizeObserver.observe(mainContent);

            // MutationObserver catches layout switches (masonry/vertical/list)
            // which restructure the DOM but may not reliably trigger ResizeObserver.
            // Safe from infinite loops: parent resizing the iframe doesn't add/remove
            // nodes inside <main>, so this won't re-fire after a height update.
            mutationObserver = new MutationObserver((mutations) => {
                debouncedSend();
            });
            mutationObserver.observe(mainContent, {
                childList: true,
                subtree: true,
            });
        } else {
            console.warn('[EmbedViewer] <main> element not found!');
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
            if (mutationObserver) {
                mutationObserver.disconnect();
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
            {/* Timeline */}
            <main className="container mx-auto max-w-4xl pb-8">
                <Timeline
                    sharedCapsules={capsules}
                    readOnly
                    defaultLayoutMode={layoutMode}
                    showMetadata={showMetadata}
                    metadata={metadata}
                />
            </main>
        </div>
    );
}