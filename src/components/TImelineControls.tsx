import { useState } from 'react';

interface TimelineControlsProps {
    layoutMode: 'masonry' | 'vertical' | 'list';
    onLayoutChange: (mode: 'masonry' | 'vertical' | 'list') => void;
    zoomLevel: number;
    onZoomChange: (level: number) => void;
    stats: {
        total: number;
        yearSpan: number;
        milestones: number;
        withMedia: number;
    };
    isMobile: boolean;
}

export default function TimelineControls({
    layoutMode,
    onLayoutChange,
    zoomLevel,
    onZoomChange,
    stats,
    isMobile,
}: TimelineControlsProps) {
    const zoomLevels = [50, 75, 100, 125, 150];

    const handleZoomIn = () => {
        const currentIndex = zoomLevels.indexOf(zoomLevel);
        if (currentIndex < zoomLevels.length - 1) {
            onZoomChange(zoomLevels[currentIndex + 1]);
        }
    };

    const handleZoomOut = () => {
        const currentIndex = zoomLevels.indexOf(zoomLevel);
        if (currentIndex > 0) {
            onZoomChange(zoomLevels[currentIndex - 1]);
        }
    };

    const handleZoomReset = () => {
        onZoomChange(100);
    };

    if (isMobile) {
        // Mobile: Compact layout - just layout switcher
        return (
            <div className="flex items-center justify-center gap-2">
                <LayoutSwitcher
                    layoutMode={layoutMode}
                    onLayoutChange={onLayoutChange}
                    isMobile={isMobile}
                />
            </div>
        );
    }

    // Desktop: Full controls with stats and zoom
    return (
        <div className="flex items-center justify-between gap-16">
            {/* Left: Layout Mode Switcher */}
            <LayoutSwitcher
                layoutMode={layoutMode}
                onLayoutChange={onLayoutChange}
                isMobile={isMobile}
            />

            {/* Center: Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                    <span className="font-medium text-foreground">{stats.total}</span>
                    capsules
                </span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="flex items-center gap-1">
                    <span className="font-medium text-foreground">{stats.yearSpan}</span>
                    years
                </span>
                {stats.milestones > 0 && (
                    <>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="flex items-center gap-1">
                            <span className="font-medium text-foreground">{stats.milestones}</span>
                            ⭐
                        </span>
                    </>
                )}
            </div>

            {/* Right: Zoom Controls */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    <button
                        onClick={handleZoomOut}
                        disabled={zoomLevel === zoomLevels[0]}
                        className="p-1.5 rounded hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Zoom Out"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                        </svg>
                    </button>

                    <button
                        onClick={handleZoomReset}
                        className="px-3 py-1.5 text-xs font-medium hover:bg-background rounded transition-colors min-w-[3rem]"
                        title="Reset Zoom"
                    >
                        {zoomLevel}%
                    </button>

                    <button
                        onClick={handleZoomIn}
                        disabled={zoomLevel === zoomLevels[zoomLevels.length - 1]}
                        className="p-1.5 rounded hover:bg-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Zoom In"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Extracted layout switcher component
function LayoutSwitcher({
    layoutMode,
    onLayoutChange,
    isMobile,
}: {
    layoutMode: 'masonry' | 'vertical' | 'list';
    onLayoutChange: (mode: 'masonry' | 'vertical' | 'list') => void;
    isMobile: boolean;
}) {
    return (
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
                onClick={() => onLayoutChange('masonry')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${layoutMode === 'masonry'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                    }`}
                title="Masonry Grid - Best for browsing"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>

            </button>

            <button
                onClick={() => onLayoutChange('vertical')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${layoutMode === 'vertical'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                    }`}
                title="Vertical Timeline - Best for storytelling"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0-16l-4 4m4-4l4 4" />
                </svg>

            </button>

            <button
                onClick={() => onLayoutChange('list')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${layoutMode === 'list'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                    }`}
                title="Compact List - Best for quick reference"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>

            </button>
        </div>
    );
}