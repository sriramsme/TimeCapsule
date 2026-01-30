import type { Capsule, Theme, TimelineData } from '../types';

const VERSION = 1;
const DB_NAME = 'TimeCapsuleDB';
const DB_VERSION = 1;
const TIMELINES_STORE = 'timelines';
const SETTINGS_STORE = 'settings';

// Timeline metadata for listing
export interface TimelineMetadata {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    capsuleCount: number;
    lastCapsuleDate?: string;
}

// Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create timelines store with indexes
            if (!db.objectStoreNames.contains(TIMELINES_STORE)) {
                const timelineStore = db.createObjectStore(TIMELINES_STORE, { keyPath: 'id' });
                timelineStore.createIndex('name', 'name', { unique: false });
                timelineStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            }

            // Create settings store
            if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
            }
        };
    });
}

// Helper to perform store operations
async function performStoreOperation<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = operation(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export const storage = {
    /**
     * Save a timeline with its capsules
     */
    async saveCapsules(capsules: Capsule[], timelineId: string, timelineName?: string): Promise<void> {
        try {
            const now = Date.now();

            const timelineData: TimelineData & TimelineMetadata = {
                id: timelineId,
                name: timelineName || timelineId,
                capsules,
                version: VERSION,
                createdAt: now,
                updatedAt: now,
                capsuleCount: capsules.length
            };

            // Check if timeline exists to preserve createdAt
            try {
                const existing = await this.loadTimeline(timelineId);
                if (existing) {
                    timelineData.createdAt = existing.createdAt || now;
                }
            } catch {
                // Timeline doesn't exist, use current timestamp
            }

            await performStoreOperation(
                TIMELINES_STORE,
                'readwrite',
                (store) => store.put(timelineData)
            );
        } catch (error) {
            console.error('Failed to save to IndexedDB:', error);
            throw new Error('Failed to save your timeline. Please try again.');
        }
    },

    /**
     * Load capsules from a specific timeline
     */
    async loadCapsules(timelineId: string): Promise<Capsule[]> {
        try {
            const timeline = await this.loadTimeline(timelineId);
            return timeline?.capsules || [];
        } catch (error) {
            console.error('Failed to load from IndexedDB:', error);
            return [];
        }
    },

    /**
     * Load full timeline data
     */
    async loadTimeline(timelineId: string): Promise<(TimelineData & TimelineMetadata) | null> {
        try {
            const data = await performStoreOperation<(TimelineData & TimelineMetadata) | undefined>(
                TIMELINES_STORE,
                'readonly',
                (store) => store.get(timelineId)
            );

            if (!data) return null;

            if (data.version !== VERSION) {
                console.warn('Data version mismatch, using current version');
            }

            return data;
        } catch (error) {
            console.error('Failed to load timeline from IndexedDB:', error);
            return null;
        }
    },

    /**
     * Get all timeline metadata (for home page listing)
     */
    async getAllTimelines(): Promise<TimelineMetadata[]> {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(TIMELINES_STORE, 'readonly');
                const store = transaction.objectStore(TIMELINES_STORE);
                const index = store.index('updatedAt');
                const request = index.openCursor(null, 'prev'); // Most recent first

                const timelines: TimelineMetadata[] = [];

                request.onsuccess = () => {
                    const cursor = request.result;
                    if (cursor) {
                        const data = cursor.value as TimelineData & TimelineMetadata;
                        timelines.push({
                            id: data.id,
                            name: data.name,
                            createdAt: data.createdAt,
                            updatedAt: data.updatedAt,
                            capsuleCount: data.capsuleCount,
                            lastCapsuleDate: data.lastCapsuleDate,
                        });
                        cursor.continue();
                    } else {
                        resolve(timelines);
                    }
                };

                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to load timelines from IndexedDB:', error);
            return [];
        }
    },

    /**
     * Delete a specific timeline
     */
    async deleteTimeline(timelineId: string): Promise<void> {
        try {
            await performStoreOperation(
                TIMELINES_STORE,
                'readwrite',
                (store) => store.delete(timelineId)
            );
        } catch (error) {
            console.error('Failed to delete timeline:', error);
            throw new Error('Failed to delete timeline. Please try again.');
        }
    },

    /**
     * Rename a timeline
     */
    async renameTimeline(timelineId: string, newName: string): Promise<void> {
        try {
            const timeline = await this.loadTimeline(timelineId);
            if (!timeline) {
                throw new Error('Timeline not found');
            }

            timeline.name = newName;
            timeline.updatedAt = Date.now();

            await performStoreOperation(
                TIMELINES_STORE,
                'readwrite',
                (store) => store.put(timeline)
            );
        } catch (error) {
            console.error('Failed to rename timeline:', error);
            throw new Error('Failed to rename timeline. Please try again.');
        }
    },

    /**
     * Save theme preference
     */
    async saveTheme(theme: Theme): Promise<void> {
        try {
            await performStoreOperation(
                SETTINGS_STORE,
                'readwrite',
                (store) => store.put({ key: 'theme', value: theme })
            );
        } catch (error) {
            console.error('Failed to save theme to IndexedDB:', error);
            throw new Error('Failed to save your theme. Please try again.');
        }
    },

    /**
     * Load theme preference
     */
    async loadTheme(): Promise<Theme> {
        try {
            const result = await performStoreOperation<{ key: string; value: Theme } | undefined>(
                SETTINGS_STORE,
                'readonly',
                (store) => store.get('theme')
            );
            return result?.value || 'minimal';
        } catch (error) {
            console.error('Failed to load theme from IndexedDB:', error);
            return 'minimal';
        }
    },

    /**
     * Export a timeline to JSON
     */
    exportJSON(capsules: Capsule[], timelineName?: string): string {
        const data: TimelineData & { name?: string } = {
            capsules,
            version: VERSION,
            name: timelineName,
        };
        return JSON.stringify(data, null, 2);
    },

    /**
     * Import timeline from JSON
     */
    importJSON(jsonString: string): { capsules: Capsule[]; name?: string } {
        try {
            const data = JSON.parse(jsonString) as TimelineData & { name?: string };
            return {
                capsules: data.capsules || [],
                name: data.name,
            };
        } catch (error) {
            console.error('Failed to parse JSON:', error);
            throw new Error('Invalid JSON file. Please check the file format.');
        }
    },

    /**
     * Clear all data (use with caution!)
     */
    async clearAllData(): Promise<void> {
        try {
            const db = await openDB();
            const transaction = db.transaction([TIMELINES_STORE, SETTINGS_STORE], 'readwrite');

            await Promise.all([
                new Promise((resolve, reject) => {
                    const request = transaction.objectStore(TIMELINES_STORE).clear();
                    request.onsuccess = () => resolve(undefined);
                    request.onerror = () => reject(request.error);
                }),
                new Promise((resolve, reject) => {
                    const request = transaction.objectStore(SETTINGS_STORE).clear();
                    request.onsuccess = () => resolve(undefined);
                    request.onerror = () => reject(request.error);
                }),
            ]);
        } catch (error) {
            console.error('Failed to clear data:', error);
            throw new Error('Failed to clear data. Please try again.');
        }
    },
};