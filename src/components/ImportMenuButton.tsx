import { useState } from 'react';
import type { ShareMetadata } from '@/types';
import { importJSONFile, triggerFileInput } from '@/utils/export';
import { validateImportedJSON } from '@/utils/validation';
import { storage } from '@/utils/storage';

interface ImportMenuButtonProps {
    onImportSuccess?: () => void; // Callback to refresh timeline list
}

export default function ImportMenuButton({ onImportSuccess }: ImportMenuButtonProps) {
    const [importing, setImporting] = useState(false);

    const handleImportJSON = async () => {
        triggerFileInput('.json', async (file) => {
            setImporting(true);
            try {
                // Step 1: Read the file
                const imported = await importJSONFile(file);

                // Step 2: Validate the imported data
                const validation = validateImportedJSON(imported);

                if (!validation.valid) {
                    alert(`Import failed: ${validation.error}`);
                    return;
                }

                if (!validation.data) {
                    alert('Import failed: No valid data found');
                    return;
                }

                const { capsules, metadata } = validation.data;

                // Step 3: Show confirmation with details
                const confirmMessage = buildConfirmMessage(
                    capsules.length,
                    metadata,
                    validation.warnings
                );

                if (!confirm(confirmMessage)) {
                    return;
                }

                // Step 4: Create new timeline with imported data
                const timelineId = await saveImportedTimeline(capsules, metadata);

                // Step 5: Show success message
                if (validation.warnings && validation.warnings.length > 0) {
                    alert(
                        `Import successful!\n\n${validation.warnings.join('\n')}\n\nYou'll now be redirected to your imported timeline.`
                    );
                } else {
                    // Just navigate without extra alert for clean imports
                }

                // Step 6: Refresh list and navigate
                if (onImportSuccess) {
                    onImportSuccess();
                }

                // Navigate to the new timeline
                window.location.href = `timeline?id=${timelineId}`;

            } catch (error) {
                console.error('Import error:', error);
                alert(
                    error instanceof Error
                        ? `Import failed: ${error.message}`
                        : 'Failed to import file. Please check the file format and try again.'
                );
            } finally {
                setImporting(false);
            }
        });
    };

    return (
        <div className="w-fit mx-auto items-center justify-center bg-[var(--card)] border-2 border-dashed border-[var(--border)] hover:border-[var(--accent-500)] hover:bg-[var(--accent-50)] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden">
            <button
                onClick={handleImportJSON}
                disabled={importing}
                className="px-4 py-2.5 text-left text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {importing ? (
                    <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Importing...
                    </>
                ) : (
                    <>
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        Import Timeline from JSON
                    </>
                )}
            </button>
        </div>
    );
}

/**
 * Build user-friendly confirmation message
 */
function buildConfirmMessage(
    capsuleCount: number,
    metadata?: ShareMetadata,
    warnings?: string[]
): string {
    let message = `Import timeline with ${capsuleCount} capsule${capsuleCount > 1 ? 's' : ''}?\n\n`;

    if (metadata?.name) {
        message += `Created by: ${metadata.name}\n`;
    }

    if (metadata?.sharedAt) {
        const date = new Date(metadata.sharedAt).toLocaleDateString();
        message += `Shared on: ${date}\n`;
    }

    if (warnings && warnings.length > 0) {
        message += `\n⚠️ Warnings:\n${warnings.join('\n')}\n`;
    }

    message += '\nThis will create a new timeline in your collection.';

    return message;
}

/**
 * Save imported timeline to storage
 */
async function saveImportedTimeline(
    capsules: Capsule[],
    metadata?: ShareMetadata
): Promise<string> {
    // Generate unique ID for new timeline
    const timelineId = crypto.randomUUID().slice(0, 8);

    // Create descriptive timeline name
    let timelineName: string;
    if (metadata?.name) {
        timelineName = `${metadata.name}'s Timeline`;
    } else {
        timelineName = 'Imported Timeline';
    }

    // Add import date to distinguish from original
    const importDate = new Date().toLocaleDateString();
    timelineName += ` (Imported ${importDate})`;

    // Save to storage
    await storage.saveCapsules(capsules, timelineId, timelineName);

    return timelineId;
}

// Type import to avoid errors
import type { Capsule } from '../types';