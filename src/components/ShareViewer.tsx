import { useEffect, useState } from "react";
import type { Capsule, ShareMetadata } from "@/types";
import Timeline from "@/components/Timeline";
import { importFromURLParameter } from "@/utils/export";

export default function ShareViewer() {
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

    // Get current URL for oEmbed discovery
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const oembedUrl = currentUrl ? `https://timecapsule.srirams.me/api/oembed?url=${encodeURIComponent(currentUrl)}` : '';

    // Prepare meta information
    const pageTitle = metadata?.name
        ? `${metadata.name}'s TimeCapsule Timeline`
        : 'Shared TimeCapsule Timeline';

    const pageDescription = metadata?.bio
        || `View this timeline with ${capsules.length} life moments`;

    const ogImage = metadata?.profilePic
        || 'https://timecapsule.srirams.me/og-image.png';

    if (loading) {
        return (
            <>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-muted-foreground">Loading shared timeline...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="bg-card border rounded-2xl p-8 max-w-md w-full text-center space-y-4">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-display font-bold">Unable to Load Timeline</h2>
                        <p className="text-muted-foreground">{error}</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-6 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors"
                        >
                            Go to TimeCapsule
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (capsules.length === 0) {
        return (
            <>
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="bg-card border rounded-2xl p-8 max-w-md w-full text-center space-y-4">
                        <div className="w-16 h-16 bg-accent-500/10 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-display font-bold">Empty Timeline</h2>
                        <p className="text-muted-foreground">This shared timeline has no capsules yet.</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-6 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors"
                        >
                            Create Your Own
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {/* SEO and oEmbed Meta Tags */}
            {/* Basic Meta */}
            <title>{pageTitle}</title>
            <meta name="description" content={pageDescription} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={pageDescription} />
            <meta property="og:image" content={ogImage} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={currentUrl} />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={pageDescription} />
            <meta name="twitter:image" content={ogImage} />

            {/* oEmbed Discovery Links */}
            <link
                rel="alternate"
                type="application/json+oembed"
                href={`${oembedUrl}&format=json`}
                title={`${pageTitle} (JSON)`}
            />
            <link
                rel="alternate"
                type="text/xml+oembed"
                href={`${oembedUrl}&format=xml`}
                title={`${pageTitle} (XML)`}
            />

            {/* Canonical URL */}
            <link rel="canonical" href={currentUrl} />


            <div className="min-h-screen bg-background">
                {/* Header with metadata if available */}
                {metadata && (
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
                                    className="px-4 py-2 text-sm bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors whitespace-nowrap"
                                >
                                    Create Your Own
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Simple header if no metadata */}
                {!metadata && (
                    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="container mx-auto px-4 max-w-4xl">
                            <div className="flex h-16 items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                                        <span className="text-white text-sm font-bold">TC</span>
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
                    />

                </main>

                {/* Footer with capsule count */}
                <div className="py-8 text-center text-sm text-muted-foreground">
                    {capsules.length} capsule{capsules.length !== 1 ? 's' : ''} in this timeline
                </div>
            </div>
        </>
    );
}

/**
 * Note: This component requires react-helmet-async
 * 
 * Install it:
 * npm install react-helmet-async
 * 
 * Then wrap your app with HelmetProvider:
 * 
 * import { HelmetProvider } from 'react-helmet-async';
 * 
 * <HelmetProvider>
 *   <App />
 * </HelmetProvider>
 */