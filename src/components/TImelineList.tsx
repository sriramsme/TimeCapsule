import { useState, useEffect } from 'react';
import { storage, type TimelineMetadata } from '@/utils/storage';

export default function TimelineList() {
    const [timelines, setTimelines] = useState<TimelineMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        loadTimelines();
    }, []);

    async function loadTimelines() {
        try {
            const allTimelines = await storage.getAllTimelines();
            setTimelines(allTimelines);
        } catch (error) {
            console.error('Failed to load timelines:', error);
        } finally {
            setLoading(false);
        }
    }

    async function createNewTimeline() {
        const name = prompt('Enter a name for your timeline:', 'My Timeline');

        if (name && name.trim()) {
            try {
                const id = crypto.randomUUID().slice(0, 8);
                // Create empty timeline
                await storage.saveCapsules([], id, name.trim());
                // Navigate to new timeline
                window.location.href = `/timeline?id=${id}`;
            } catch (error) {
                console.error('Failed to create timeline:', error);
                alert('Failed to create timeline. Please try again.');
            }
        }
    }

    async function handleDelete(timelineId: string, timelineName: string, event: React.MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        if (confirm(`Delete "${timelineName}"?\n\nThis will permanently remove all capsules in this timeline. This action cannot be undone.`)) {
            try {
                setDeleting(timelineId);
                await storage.deleteTimeline(timelineId);
                await loadTimelines();
            } catch (error) {
                console.error('Failed to delete timeline:', error);
                alert('Failed to delete timeline. Please try again.');
            } finally {
                setDeleting(null);
            }
        }
    }

    async function handleRename(timelineId: string, currentName: string, event: React.MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        const newName = prompt('Enter new timeline name:', currentName);

        if (newName && newName.trim() && newName !== currentName) {
            try {
                await storage.renameTimeline(timelineId, newName.trim());
                await loadTimelines();
            } catch (error) {
                console.error('Failed to rename timeline:', error);
                alert('Failed to rename timeline. Please try again.');
            }
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="space-y-4 text-center">
                    <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 border-4 border-accent-200 dark:border-accent-900 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-accent-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-muted-foreground animate-pulse">Loading your timelines...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Create New Timeline Card */}
            <button
                onClick={createNewTimeline}
                className="w-full group relative overflow-hidden rounded-2xl border-2 border-dashed border-accent-300 dark:border-accent-700 hover:border-accent-500 transition-all p-8 sm:p-12 bg-gradient-to-br from-accent-50/50 to-transparent dark:from-accent-950/50 hover:shadow-lg hover:shadow-accent-500/10"
            >
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-accent-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <div className="space-y-2 text-center">
                        <h3 className="text-xl sm:text-2xl font-bold">Create New Timeline</h3>
                        <p className="text-muted-foreground">Start capturing your life's journey</p>
                    </div>
                </div>

                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent-500/0 via-accent-500/5 to-accent-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>

            {/* Timeline Grid */}
            {timelines.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                    <div className="text-6xl sm:text-7xl mb-4">📦</div>
                    <h3 className="text-2xl font-bold">No timelines yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Create your first timeline above to start documenting your life's memorable moments
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {timelines.map((timeline) => (
                        <a
                            key={timeline.id}
                            href={`/timeline?id=${timeline.id}`}
                            className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-accent-500/10 transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Card Content */}
                            <div className="p-6 space-y-4">
                                {/* Header */}
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold truncate group-hover:text-accent-500 transition-colors">
                                        {timeline.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        <span>{timeline.capsuleCount} capsule{timeline.capsuleCount !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex gap-4 text-sm">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>
                                            {new Date(timeline.updatedAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: new Date(timeline.updatedAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                            })}
                                        </span>
                                    </div>
                                    {timeline.lastCapsuleDate && (
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>
                                                Latest: {new Date(timeline.lastCapsuleDate).getFullYear()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={(e) => handleRename(timeline.id, timeline.name, e)}
                                        className="flex-1 px-3 py-2 text-sm bg-muted hover:bg-accent-500 hover:text-white rounded-lg transition-colors"
                                        title="Rename timeline"
                                    >
                                        Rename
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(timeline.id, timeline.name, e)}
                                        disabled={deleting === timeline.id}
                                        className="px-3 py-2 text-sm border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Delete timeline"
                                    >
                                        {deleting === timeline.id ? (
                                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Hover gradient effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-accent-500/0 to-accent-500/0 group-hover:from-accent-500/5 group-hover:to-accent-500/10 transition-all duration-300 pointer-events-none"></div>

                            {/* Corner accent */}
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}