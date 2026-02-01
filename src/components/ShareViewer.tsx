import { useEffect, useState } from "react";
import type { Capsule, ShareMetadata } from "@/types";
import Timeline from "@/components/Timeline";
import { importFromURLParameter } from "@/utils/export";
import type { LayoutMode } from "@/types";

interface ShareViewerProps {
    layoutMode?: LayoutMode;
    showMetadata?: boolean;
}

export default function ShareViewer({ layoutMode, showMetadata = true }: ShareViewerProps) {
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
                    setError("No shared timeline found in URL");
                }
            } catch (err) {
                setError("Failed to load shared timeline");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading shared timeline...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                        <svg
                            className="w-8 h-8 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-display font-bold text-card-foreground">
                        Unable to Load Timeline
                    </h2>
                    <p className="text-muted-foreground">{error}</p>
                    <button
                        onClick={() => (window.location.href = '/')}
                        className="px-6 py-2 bg-accent text-accent-foreground hover:bg-accent-600 hover:text-accent-foreground rounded-lg transition-colors"
                    >
                        Go to TimeCapsule
                    </button>
                </div>
            </div>
        );
    }

    if (capsules.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                        <svg
                            className="w-8 h-8 text-accent-500"
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
                    <h2 className="text-xl font-display font-bold text-card-foreground">
                        Empty Timeline
                    </h2>
                    <p className="text-muted-foreground">
                        This shared timeline has no capsules yet.
                    </p>
                    <button
                        onClick={() => (window.location.href = '/')}
                        className="px-6 py-2 bg-accent text-accent-foreground hover:bg-accent-600 hover:text-accent-foreground rounded-lg transition-colors"
                    >
                        Create Your Own
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Timeline */}
            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <Timeline
                    sharedCapsules={capsules}
                    readOnly
                    defaultLayoutMode={layoutMode}
                    showMetadata={showMetadata}
                    metadata={metadata}
                />
            </main>

            {/* Footer */}
            <div className="py-8 text-center text-sm text-muted-foreground">
                {capsules.length} capsule{capsules.length !== 1 ? 's' : ''} in this timeline
            </div>
        </div>
    )
};
