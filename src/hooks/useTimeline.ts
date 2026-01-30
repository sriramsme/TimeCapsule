import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/utils/storage';
import type { Capsule } from '@/types';

/**
 * Custom hook for managing timeline data with IndexedDB persistence
 * 
 * @param timelineId - Unique identifier for this timeline
 * @param timelineName - Display name for the timeline
 * @param readOnly - If true, skip loading from storage and don't save
 * @param sharedCapsules - Initial capsules for read-only/shared timelines
 */
export function useTimeline(
    timelineId: string,
    timelineName: string = 'My Timeline',
    readOnly: boolean = false,
    sharedCapsules: Capsule[] = []
) {
    const [capsules, setCapsules] = useState<Capsule[]>(sharedCapsules);
    const [loading, setLoading] = useState(!readOnly);
    const [error, setError] = useState<string | null>(null);

    // Load capsules from IndexedDB
    useEffect(() => {
        if (readOnly) {
            setCapsules(sharedCapsules);
            return;
        }

        let mounted = true;

        async function loadData() {
            try {
                setLoading(true);
                setError(null);

                const loadedCapsules = await storage.loadCapsules(timelineId);

                if (mounted) {
                    setCapsules(loadedCapsules);
                }
            } catch (err) {
                console.error('Failed to load capsules:', err);
                if (mounted) {
                    setError('Failed to load timeline data');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadData();

        return () => {
            mounted = false;
        };
    }, [timelineId, readOnly]);

    // Persist capsules to IndexedDB
    const persistCapsules = useCallback(
        async (newCapsules: Capsule[]) => {
            if (readOnly) return;

            try {
                await storage.saveCapsules(newCapsules, timelineId, timelineName);
            } catch (err) {
                console.error('Failed to save capsules:', err);
                throw new Error('Failed to save timeline. Please try again.');
            }
        },
        [timelineId, timelineName, readOnly]
    );

    // Add a new capsule
    const addCapsule = useCallback(
        async (capsule: Capsule) => {
            const newCapsules = [...capsules, capsule].sort((a, b) => a.year - b.year);
            setCapsules(newCapsules);
            await persistCapsules(newCapsules);
        },
        [capsules, persistCapsules]
    );

    // Update an existing capsule
    const updateCapsule = useCallback(
        async (updatedCapsule: Capsule) => {
            const newCapsules = capsules
                .map(c => c.id === updatedCapsule.id ? updatedCapsule : c)
                .sort((a, b) => a.year - b.year);
            setCapsules(newCapsules);
            await persistCapsules(newCapsules);
        },
        [capsules, persistCapsules]
    );

    // Delete a capsule
    const deleteCapsule = useCallback(
        async (capsuleId: string) => {
            const newCapsules = capsules.filter(c => c.id !== capsuleId);
            setCapsules(newCapsules);
            await persistCapsules(newCapsules);
        },
        [capsules, persistCapsules]
    );

    // Bulk update (useful for import/sort operations)
    const setCapsulesBulk = useCallback(
        async (newCapsules: Capsule[]) => {
            const sorted = [...newCapsules].sort((a, b) => a.year - b.year);
            setCapsules(sorted);
            await persistCapsules(sorted);
        },
        [persistCapsules]
    );

    // Clear all capsules
    const clearAllCapsules = useCallback(
        async () => {
            setCapsules([]);
            await persistCapsules([]);
        },
        [persistCapsules]
    );

    return {
        capsules,
        loading,
        error,
        addCapsule,
        updateCapsule,
        deleteCapsule,
        setCapsulesBulk,
        clearAllCapsules,
    };
}