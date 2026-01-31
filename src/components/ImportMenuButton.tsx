
import { useState } from 'react';
import type { Capsule, Theme, ShareMetadata } from '../types';
import {
    importJSONFile,
    triggerFileInput,
} from '../utils/export';

interface HeaderProps {
    onImport: (capsules: Capsule[], metadata?: ShareMetadata) => void;
}


export default function ImportMenuButton({ onImport }: HeaderProps) {
    const handleImportJSON = () => {
        triggerFileInput('.json', async (file) => {
            try {
                const imported = await importJSONFile(file);
                if (
                    confirm(
                        `This will replace your current timeline with ${imported.capsules.length} capsule(s). Continue?`
                    )
                ) {
                    onImport(imported.capsules, imported.metadata);
                }
            } catch (error) {
                alert('Failed to import file. Please check the file format.');
            }
        });
    };

    return (
        <div className="mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
            <button
                onClick={handleImportJSON}
                className="w-full px-4 py-2 text-left text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
            >
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
                Import from JSON
            </button>
        </div>
    );
}
