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

    // Send height updates to parent window for auto-resize
    useEffect(() => {
        const sendHeight = () => {
            const height = document.documentElement.scrollHeight;
            window.parent.postMessage(
                { type: 'timecapsule-resize', height },
                '*'
            );
        };

        // Send initial height
        sendHeight();

        // Send height updates when content changes
        const observer = new MutationObserver(sendHeight);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
        });

        // Send height on window resize
        window.addEventListener('resize', sendHeight);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', sendHeight);
        };
    }, [capsules]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading timeline...</p>
                </div>
            </div>
        );
    }

    if (error || capsules.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="text-center space-y-3 max-w-sm">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
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
        <div className="min-h-screen bg-background">
            {/* Header with metadata if available */}
            {metadata && showMetadata && (
                <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                                    <h2 className="font-display font-bold text-lg truncate">
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
                                className="px-4 py-2 text-sm bg-accent-500 hover:bg-accent-600 text-black rounded-lg transition-colors whitespace-nowrap"
                            >
                                Create Your Own
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Simple header if no metadata */}
            {!metadata && showMetadata && (
                <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                                    <span className="text-black text-sm font-bold">TC</span>
                                </div>
                                <div>
                                    <h1 className="font-display font-bold text-lg">Shared Timeline</h1>
                                    <p className="text-xs text-muted-foreground">View only</p>
                                </div>
                            </div>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-4 py-2 text-sm bg-accent-500 hover:bg-accent-600 text-black rounded-lg transition-colors"
                            >
                                Create Your Own
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <main className="container mx-auto px-4 py-12 max-w-4xl">

                <Timeline
                    sharedCapsules={capsules}
                    readOnly
                    defaultLayoutMode={layoutMode}
                />

            </main>

            {/* Footer with capsule count */}
            <div className="py-8 text-center text-sm text-muted-foreground">
                {capsules.length} capsule{capsules.length !== 1 ? 's' : ''} in this timeline
            </div>
        </div>

    )
}