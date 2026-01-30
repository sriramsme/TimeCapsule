import { useEffect, useState } from "react";
import type { Capsule, ShareMetadata } from "@/types";
import { importFromURLParameter } from "@/utils/export";

/**
 * Dedicated embed viewer for iframe embeds
 * Stripped down version with no navigation, optimized for embedding
 */
export default function EmbedViewer() {
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
            {/* Compact header with metadata */}
            {metadata && (metadata.name || metadata.profilePic) && (
                <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="container mx-auto px-4 py-3 max-w-4xl">
                        <div className="flex items-center gap-3">
                            {metadata.profilePic && (
                                <img
                                    src={metadata.profilePic}
                                    alt={metadata.name || 'Profile'}
                                    className="w-8 h-8 rounded-full object-cover border border-accent-500/20"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                {metadata.name && (
                                    <h2 className="font-semibold text-sm truncate">
                                        {metadata.name}'s Timeline
                                    </h2>
                                )}
                                {metadata.bio && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {metadata.bio}
                                    </p>
                                )}
                            </div>
                            <a
                                href={window.location.href.replace('/embed/', '/share/')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-3 py-1.5 bg-accent-500 hover:bg-accent-600 text-white rounded transition-colors whitespace-nowrap"
                            >
                                View Full
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline content */}
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                <div className="space-y-6">
                    {capsules.map((capsule, index) => (
                        <div
                            key={capsule.id}
                            className="bg-card border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Year */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-8 bg-accent-500 rounded-full" />
                                <div>
                                    <div className="font-display font-bold text-2xl">
                                        {capsule.year}
                                    </div>
                                    {/* {capsule.age !== undefined && (
                                        <div className="text-xs text-muted-foreground">
                                            Age {capsule.age}
                                        </div>
                                    )} */}
                                </div>
                            </div>

                            {/* Title */}
                            {capsule.title && (
                                <h3 className="font-semibold text-lg mb-2">
                                    {capsule.title}
                                </h3>
                            )}

                            {/* Description */}
                            {capsule.description && (
                                <p className="text-muted-foreground mb-3 whitespace-pre-wrap">
                                    {capsule.description}
                                </p>
                            )}

                            {/* Media */}
                            {capsule.mediaUrl && capsule.mediaType === 'image' && (
                                <img
                                    src={capsule.mediaUrl}
                                    alt={capsule.title || `Year ${capsule.year}`}
                                    className="w-full rounded-lg mt-3 object-cover max-h-64"
                                    loading="lazy"
                                />
                            )}

                            {capsule.mediaUrl && capsule.mediaType === 'video' && (
                                <video
                                    src={capsule.mediaUrl}
                                    controls
                                    className="w-full rounded-lg mt-3 max-h-64"
                                    preload="metadata"
                                />
                            )}

                            {/* Tags */}
                            {/* {capsule.tags && capsule.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {capsule.tags.map((tag, i) => (
                                        <span
                                            key={i}
                                            className="text-xs px-2 py-1 bg-accent/10 text-accent-600 dark:text-accent-400 rounded"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )} */}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="text-center py-6 space-y-2">
                    <p className="text-xs text-muted-foreground">
                        {capsules.length} capsule{capsules.length !== 1 ? 's' : ''}
                    </p>
                    <a
                        href="https://timecapsule.srirams.me"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent-600 hover:text-accent-700 dark:text-accent-400"
                    >
                        <span>Powered by TimeCapsule</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    );
}