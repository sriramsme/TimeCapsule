import { useState } from 'react';
import type { Capsule } from '../types';
import ExportMenuButton from './ExportMenuButton';

interface FloatingActionButtonProps {
    onAddClick: () => void;
    capsules: Capsule[];
}

export default function FloatingActionButton({
    onAddClick,
    capsules,
}: FloatingActionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleAdd = () => {
        setIsOpen(false);
        onAddClick();
    };

    const handleExportClick = () => {
        setShowExportMenu(true);
        setIsOpen(false);
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* FAB Container */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                {/* Speed Dial Menu - appears above main FAB */}
                {isOpen && (
                    <div className="flex flex-col items-end gap-3 animate-fade-in">
                        {/* Export Action */}
                        <button
                            onClick={handleExportClick}
                            className="group flex items-center gap-3 bg-background border-2 rounded-full pl-4 pr-5 py-3 shadow-lg hover:shadow-xl transition-all"
                        >
                            <span className="text-sm font-medium whitespace-nowrap">
                                Export Timeline
                            </span>
                            <div className="w-10 h-10 rounded-full bg-accent-100 dark:bg-accent-900 flex items-center justify-center group-hover:bg-accent-200 dark:group-hover:bg-accent-800 transition-colors">
                                <svg className="w-5 h-5 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </div>
                        </button>

                        {/* Add Capsule Action */}
                        <button
                            onClick={handleAdd}
                            className="group flex items-center gap-3 bg-background border-2 rounded-full pl-4 pr-5 py-3 shadow-lg hover:shadow-xl transition-all"
                        >
                            <span className="text-sm font-medium whitespace-nowrap">
                                Add Capsule
                            </span>
                            <div className="w-10 h-10 rounded-full bg-accent-100 dark:bg-accent-900 flex items-center justify-center group-hover:bg-accent-200 dark:group-hover:bg-accent-800 transition-colors">
                                <svg className="w-5 h-5 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                        </button>
                    </div>
                )}

                {/* Main FAB */}
                <button
                    onClick={handleToggle}
                    className={`w-14 h-14 rounded-full bg-accent-500 text-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center ${isOpen ? 'rotate-45' : ''
                        }`}
                    aria-label={isOpen ? 'Close menu' : 'Open menu'}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {/* Export Menu Modal - positioned over FAB area */}
            {showExportMenu && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-background rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
                        <button
                            onClick={() => setShowExportMenu(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors"
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="text-lg font-bold mb-4">Export Timeline</h3>

                        <ExportMenuMobile
                            capsules={capsules}
                            onClose={() => setShowExportMenu(false)}
                        />
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
            `}</style>
        </>
    );
}

// Mobile-optimized export menu
function ExportMenuMobile({
    capsules,
    onClose
}: {
    capsules: Capsule[];
    onClose: () => void;
}) {
    const handleExportJSON = () => {
        const dataStr = JSON.stringify(capsules, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `timeline-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        onClose();
    };

    const handleExportImage = async () => {
        try {
            const element = document.getElementById('timeline-export');
            if (!element) return;

            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(element, {
                backgroundColor: null,
                scale: 2,
            });

            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `timeline-${new Date().toISOString().split('T')[0]}.png`;
                    link.click();
                    URL.revokeObjectURL(url);
                }
            });
            onClose();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: 'My Timeline',
            text: `Check out my timeline with ${capsules.length} capsules!`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                onClose();
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
                onClose();
            }
        } catch (error) {
            console.error('Share failed:', error);
        }
    };

    return (
        <div className="space-y-2">
            <button
                onClick={handleExportImage}
                className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors text-left"
            >
                <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <div className="font-medium">Export as Image</div>
                    <div className="text-xs text-muted-foreground">Save as PNG</div>
                </div>
            </button>

            <button
                onClick={handleExportJSON}
                className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors text-left"
            >
                <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div>
                    <div className="font-medium">Export Data</div>
                    <div className="text-xs text-muted-foreground">Download as JSON</div>
                </div>
            </button>

            <button
                onClick={handleShare}
                className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors text-left"
            >
                <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                </div>
                <div>
                    <div className="font-medium">Share Timeline</div>
                    <div className="text-xs text-muted-foreground">Share link</div>
                </div>
            </button>
        </div>
    );
}