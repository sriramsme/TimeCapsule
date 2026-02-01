import { useState, useEffect } from 'react';
import type { Capsule, LayoutMode, ShareMetadata } from '../types';
import CapsuleCard from './CapsuleCard';
import CapsuleModal from './CapsuleModal';
import TimelineControls from './TImelineControls';
import ExportMenuButton from './ExportMenuButton';
import FloatingActionButton from './FloatingActionButton';
import { useTimeline } from '@/hooks/useTimeline';

interface TimelineProps {
    timelineId?: string;
    timelineName?: string;

    // For shared timelines (read-only, no storage)
    readOnly?: boolean;
    sharedCapsules?: Capsule[];
    defaultLayoutMode?: LayoutMode;

    // Optional metadata header
    showMetadata?: boolean;
    metadata?: ShareMetadata | null;
}

export default function Timeline({
    timelineId: propTimelineId,
    timelineName = 'My Timeline',
    readOnly = false,
    sharedCapsules = [],
    defaultLayoutMode = 'masonry',
    showMetadata = false,
    metadata,
}: TimelineProps) {

    const [timelineId, setTimelineId] = useState<string | undefined>(propTimelineId);
    const [isClient, setIsClient] = useState(false);

    // Get timeline ID from URL on client-side
    useEffect(() => {
        setIsClient(true);

        // If no timelineId was passed as prop, get it from URL
        if (!propTimelineId) {
            const params = new URLSearchParams(window.location.search);
            const urlId = params.get('id');

            console.log('🔗 Getting timeline ID from URL:', urlId);

            if (urlId) {
                setTimelineId(urlId);
            }
        } else {
            console.log('📦 Using timeline ID from props:', propTimelineId);
            setTimelineId(propTimelineId);
        }
    }, [propTimelineId]);

    // Only use storage hook if we have a timelineId (not a shared view)
    const storageEnabled = !readOnly && timelineId !== undefined && timelineId !== '';

    const {
        capsules: storedCapsules,
        loading: storageLoading,
        addCapsule,
        updateCapsule,
        deleteCapsule,
    } = useTimeline(
        timelineId || 'dummy', // Provide dummy value when not used
        timelineName,
        !storageEnabled, // readOnly = true when storage is disabled
        sharedCapsules
    );

    // Use appropriate capsules based on mode
    const capsules = storageEnabled ? storedCapsules : sharedCapsules;
    const loading = storageEnabled ? storageLoading : false;

    // UI state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCapsule, setEditingCapsule] = useState<Capsule | undefined>(undefined);
    const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
        if (defaultLayoutMode) {
            return defaultLayoutMode;
        }
        // Default to vertical on mobile, masonry on desktop
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768 ? 'vertical' : 'masonry';
        }
        return 'masonry';
    });
    const [zoomLevel, setZoomLevel] = useState(50);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleOpenModal = (capsule?: Capsule) => {
        setEditingCapsule(capsule);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCapsule(undefined);
    };

    const handleSave = async (capsule: Capsule) => {
        if (!storageEnabled) return; // Safety check

        try {
            if (editingCapsule) {
                await updateCapsule(capsule);
            } else {
                await addCapsule(capsule);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save capsule:', error);
            alert('Failed to save capsule. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (!editingCapsule || !storageEnabled) return;

        try {
            await deleteCapsule(editingCapsule.id);
            handleCloseModal();
        } catch (error) {
            console.error('Failed to delete capsule:', error);
            alert('Failed to delete capsule. Please try again.');
        }
    };

    // Calculate statistics
    const stats = {
        total: capsules.length,
        yearSpan: capsules.length > 0
            ? Math.max(...capsules.map(c => c.year)) - Math.min(...capsules.map(c => c.year))
            : 0,
        milestones: capsules.filter(c => c.milestone).length,
        withMedia: capsules.filter(c => c.mediaUrl).length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading timeline...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Metadata Header - Optional */}
            {showMetadata && metadata && (
                <TimelineMetadataHeader metadata={metadata} isMobile={isMobile} />
            )}

            {/* Header/Controls Bar */}
            <TimelineHeader
                readOnly={readOnly}
                layoutMode={layoutMode}
                zoomLevel={zoomLevel}
                stats={stats}
                capsules={capsules}
                isMobile={isMobile}
                onAddClick={() => handleOpenModal()}
                onLayoutChange={setLayoutMode}
                onZoomChange={setZoomLevel}
            />

            <div
                className="space-y-12 my-12"
                style={{
                    transform: isMobile ? 'none' : `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s ease-out'
                }}
            >
                <div id="timeline-export" className="space-y-12">
                    {capsules.length === 0 ? (
                        <EmptyState readOnly={readOnly} onAddClick={() => handleOpenModal()} />
                    ) : (
                        <TimelineContent
                            capsules={capsules}
                            layoutMode={layoutMode}
                            readOnly={readOnly}
                            onEdit={handleOpenModal}
                        />
                    )}
                </div>
            </div>

            {/* FAB for mobile - only show in non-readonly mode */}
            {!readOnly && isMobile && (
                <FloatingActionButton
                    onAddClick={() => handleOpenModal()}
                    capsules={capsules}
                />
            )}

            {/* Modal for adding/editing - only show in non-readonly mode */}
            {!readOnly && (
                <CapsuleModal
                    isOpen={isModalOpen}
                    capsule={editingCapsule}
                    existingYears={capsules.map(c => c.year)}
                    onSave={handleSave}
                    onClose={handleCloseModal}
                    onDelete={editingCapsule ? handleDelete : undefined}
                />
            )}

            <MasonryStyles />
        </>
    );
}

// Metadata Header Component
function TimelineMetadataHeader({
    metadata,
    isMobile
}: {
    metadata: ShareMetadata;
    isMobile: boolean;
}) {
    const formattedDate = metadata.sharedAt
        ? new Date(metadata.sharedAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })
        : null;

    if (isMobile) {
        return (
            <div className="px-4 mb-6">
                <div className="p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        {metadata.profilePic && (
                            <img
                                src={metadata.profilePic}
                                alt={metadata.name || 'Profile'}
                                className="w-14 h-14 rounded-full object-cover border-2 border-accent/30 shadow-sm flex-shrink-0"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            {metadata.name && (
                                <h2 className="font-display font-bold text-lg text-foreground truncate">
                                    {metadata.name}'s TimeCapsule
                                </h2>
                            )}
                            {metadata.bio && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {metadata.bio}
                                </p>
                            )}
                            {formattedDate && (
                                <p className="text-xs text-muted-foreground/70 mt-2 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Shared {formattedDate}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Desktop layout - centered and elegant
    return (
        <div className="mb-8">
            <div className="max-w-2xl mx-auto">
                <div className=" rounded-3xl p-6 shadow-lg">
                    <div className="flex items-center gap-5">
                        {metadata.profilePic && (
                            <img
                                src={metadata.profilePic}
                                alt={metadata.name || 'Profile'}
                                className="w-20 h-20 rounded-full object-cover border-3 border-accent/20 shadow-md flex-shrink-0 ring-2 ring-background"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            {metadata.name && (
                                <h1 className="font-display font-bold text-2xl text-foreground mb-1">
                                    {metadata.name}'s TimeCapsule
                                </h1>
                            )}
                            {metadata.bio && (
                                <p className="text-base text-muted-foreground line-clamp-2 leading-relaxed">
                                    {metadata.bio}
                                </p>
                            )}
                            {formattedDate && (
                                <p className="text-sm text-muted-foreground/70 mt-2 flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Shared on {formattedDate}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Timeline Header Component
function TimelineHeader({
    readOnly,
    layoutMode,
    zoomLevel,
    stats,
    capsules,
    isMobile,
    onAddClick,
    onLayoutChange,
    onZoomChange,
}: {
    readOnly: boolean;
    layoutMode: LayoutMode;
    zoomLevel: number;
    stats: any;
    capsules: Capsule[];
    isMobile: boolean;
    onAddClick: () => void;
    onLayoutChange: (mode: LayoutMode) => void;
    onZoomChange: (level: number) => void;
}) {
    if (isMobile) {
        // Mobile layout: Just controls, no add/export buttons
        return (
            <div className="space-y-3 mb-6">
                <div className="px-4">
                    <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-3">
                        <TimelineControls
                            layoutMode={layoutMode}
                            onLayoutChange={onLayoutChange}
                            zoomLevel={zoomLevel}
                            onZoomChange={onZoomChange}
                            stats={stats}
                            isMobile={isMobile}
                        />
                    </div>
                </div>

                {/* Stats Banner - separate on mobile */}
                <div className="px-4">
                    <StatsBanner stats={stats} />
                </div>
            </div>
        );
    }

    // Desktop layout: Add button, controls, export button
    return (
        <div className="flex items-center justify-center gap-4 mb-8">
            {/* Add new capsule button - desktop only */}
            {!readOnly && (
                <button
                    onClick={onAddClick}
                    className="border-2 border-dashed rounded-2xl p-4 hover:border-accent hover:bg-accent-50 transition-all group flex-shrink-0"
                    title="Add a capsule to your timeline"
                    aria-label="Add new capsule"
                >
                    <svg
                        className="w-6 h-6 text-card-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            )}

            {/* Controls - Dynamic Island style */}
            <div className="bg-card/95 backdrop-blur-sm border border-border rounded-full py-3 px-6 shadow-sm">
                <TimelineControls
                    layoutMode={layoutMode}
                    onLayoutChange={onLayoutChange}
                    zoomLevel={zoomLevel}
                    onZoomChange={onZoomChange}
                    stats={stats}
                    isMobile={isMobile}
                />
            </div>

            {/* Export button - desktop only */}
            {!readOnly && (
                <div className="flex-shrink-0">
                    <ExportMenuButton capsules={capsules} />
                </div>
            )}
        </div>
    );
}
function StatsBanner({ stats }: { stats: any }) {
    return (
        <div className="bg-muted/50 dark:bg-muted/30 rounded-xl p-3 flex items-center justify-around text-sm">
            <div className="text-center">
                <div className="font-bold text-lg text-foreground">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Capsules</div>
            </div>

            <div className="w-px h-8 bg-border" />

            <div className="text-center">
                <div className="font-bold text-lg text-foreground">{stats.yearSpan}</div>
                <div className="text-xs text-muted-foreground">Years</div>
            </div>

            {stats.milestones > 0 && (
                <>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center">
                        <div className="font-bold text-lg text-foreground">{stats.milestones} ⭐</div>
                        <div className="text-xs text-muted-foreground">Milestones</div>
                    </div>
                </>
            )}
        </div>
    );
}

function EmptyState({ readOnly, onAddClick }: { readOnly: boolean; onAddClick: () => void }) {
    return (
        <div className="text-center py-16 bg-background text-card-foreground">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-display font-bold mb-2">No capsules yet</h3>
            <p className="text-muted-foreground mb-6">
                {readOnly
                    ? 'This timeline is empty'
                    : 'Start building your timeline by adding your first capsule'}
            </p>
            {!readOnly && (
                <button
                    onClick={onAddClick}
                    className="px-6 py-3 bg-accent text-accent-foreground hover:bg-accent-600 hover:text-accent-foreground rounded-full transition-colors"
                >
                    Add Your First Capsule
                </button>
            )}
        </div>
    );
}


function TimelineContent({
    capsules,
    layoutMode,
    readOnly,
    onEdit,
}: {
    capsules: Capsule[];
    layoutMode: LayoutMode;
    readOnly: boolean;
    onEdit: (capsule: Capsule) => void;
}) {
    switch (layoutMode) {
        case 'masonry':
            return <MasonryLayout capsules={capsules} readOnly={readOnly} onEdit={onEdit} />;
        case 'vertical':
            return <VerticalLayout capsules={capsules} readOnly={readOnly} onEdit={onEdit} />;
        case 'list':
            return <ListView capsules={capsules} readOnly={readOnly} onEdit={onEdit} />;
        default:
            return null;
    }
}
function MasonryLayout({
    capsules,
    readOnly,
    onEdit,
}: {
    capsules: Capsule[];
    readOnly: boolean;
    onEdit: (capsule: Capsule) => void;
}) {
    const sortedCapsules = [...capsules].sort((a, b) => a.year - b.year);

    return (
        <div className="max-w-7xl mx-auto px-4 relative">
            {/* Chronological connectors - subtle dashed lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" style={{ zIndex: 0 }}>
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                    >
                        <polygon
                            points="0 0, 10 3, 0 6"
                            fill="currentColor"
                            className="text-foreground"
                        />
                    </marker>
                </defs>
            </svg>

            <div className="masonry-grid gap-6 relative" style={{ zIndex: 1 }}>
                {sortedCapsules.map((capsule) => (
                    <div key={capsule.id} className="masonry-item">
                        <CapsuleCard
                            capsule={capsule}
                            position="center"
                            onEdit={readOnly ? undefined : () => onEdit(capsule)}
                            layoutMode="masonry"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

function VerticalLayout({
    capsules,
    readOnly,
    onEdit,
}: {
    capsules: Capsule[];
    readOnly: boolean;
    onEdit: (capsule: Capsule) => void;
}) {
    return (
        <div className="relative max-w-4xl mx-auto px-4">
            {/* Timeline spine */}
            <div
                className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
                style={{
                    background:
                        'repeating-linear-gradient(to bottom, rgb(var(--accent-rgb) / 0.4) 0px, rgb(var(--accent-rgb) / 0.4) 8px, transparent 8px, transparent 16px)',
                }}
            />

            <div className="space-y-16 relative">
                {capsules.map((capsule, index) => {
                    const position = index % 3 === 0 ? 'center' : index % 3 === 1 ? 'left' : 'right';

                    return (
                        <div key={capsule.id} className="relative">
                            {/* Connector dot */}
                            {/* <div className="absolute left-1/2 top-12 w-3 h-3 bg-accent rounded-full -translate-x-1/2 z-20 ring-4 ring-background shadow-lg" /> */}

                            {/* Dashed line from spine to card */}
                            <svg
                                className="absolute left-1/2 top-12 w-32 h-2 -translate-x-1/2 pointer-events-none"
                                style={{
                                    transform: position === 'left' ? 'translateX(-50%) scaleX(-1)' : 'translateX(-50%)',
                                }}
                            >
                                <line
                                    x1="0"
                                    y1="0"
                                    x2="128"
                                    y2="0"
                                    stroke="rgb(var(--accent-rgb) / 0.4)"
                                    strokeWidth="2"
                                    strokeDasharray="4 4"
                                />
                            </svg>

                            <CapsuleCard
                                capsule={capsule}
                                position={position}
                                onEdit={readOnly ? undefined : () => onEdit(capsule)}
                                layoutMode="vertical"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ListView({
    capsules,
    readOnly,
    onEdit,
}: {
    capsules: Capsule[];
    readOnly: boolean;
    onEdit: (capsule: Capsule) => void;
}) {
    return (
        <div className="max-w-4xl mx-auto space-y-3 px-4 gap-2">
            {capsules.map((capsule) => (
                <div
                    key={capsule.id}
                    onClick={readOnly ? undefined : () => onEdit(capsule)}
                    className={`bg-card border border-border rounded-xl p-4 flex items-center gap-4 transition-all ${readOnly ? '' : 'cursor-pointer hover:shadow-lg hover:scale-[1.01]'
                        }`}
                    role={readOnly ? undefined : 'button'}
                    tabIndex={readOnly ? undefined : 0}
                    onKeyDown={
                        readOnly
                            ? undefined
                            : (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onEdit(capsule);
                                }
                            }
                    }
                >
                    {/* Thumbnail */}
                    {capsule.mediaUrl ? (
                        <img
                            src={capsule.mediaUrl}
                            alt={capsule.title}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                    ) : (
                        <div className="w-20 h-20 bg-accent-100 dark:bg-accent-900 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                                {capsule.year.toString().slice(-2)}
                            </span>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-accent dark:text-accent-foreground">{capsule.year}</span>
                            {capsule.milestone && (
                                <span className="text-yellow-500" aria-label="Milestone">
                                    ⭐
                                </span>
                            )}
                            {capsule.type === 'future' && (
                                <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                                    Future
                                </span>
                            )}
                        </div>
                        <h3 className="font-semibold mb-1 truncate text-card-foreground">{capsule.title}</h3>
                        {capsule.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{capsule.description}</p>
                        )}
                    </div>

                    {/* Tags */}
                    {capsule.tags && capsule.tags.length > 0 && (
                        <div className="hidden lg:flex gap-1 flex-wrap max-w-xs">
                            {capsule.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-xs px-2 py-1 bg-muted rounded text-card-foreground">
                                    {tag}
                                </span>
                            ))}
                            {capsule.tags.length > 3 && (
                                <span className="text-xs px-2 py-1 text-muted-foreground">+{capsule.tags.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function MasonryStyles() {
    return (
        <style>{`
      .masonry-grid {
        column-count: 1;
        column-gap: 1.5rem;
      }

      @media (min-width: 640px) {
        .masonry-grid {
          column-count: 2;
        }
      }

      @media (min-width: 1024px) {
        .masonry-grid {
          column-count: 3;
        }
      }

      @media (min-width: 1536px) {
        .masonry-grid {
          column-count: 4;
        }
      }

      .masonry-item {
        break-inside: avoid;
        margin-bottom: 1.5rem;
      }

      @keyframes pulse-subtle {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      .animate-pulse-subtle {
        animation: pulse-subtle 3s ease-in-out infinite;
      }
    `}</style>
    );
}
