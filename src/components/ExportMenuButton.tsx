import { useState } from 'react';
import type { Capsule, ShareMetadata } from '../types';
import {
    exportAsImage,
    exportAsJSON,
    generateShareableURL,
    generateShareableURLWithExternal,
    estimateExportSize
} from '../utils/export';
import Modal from './Modal';
import EmbedCodeGenerator from './EmbedCodeGenerator';

interface ExportMenuButtonProps {
    capsules: Capsule[];
}

type ShareModalStep = 'metadata' | 'too-large' | 'success' | 'embed';

export default function ExportMenuButton({ capsules }: ExportMenuButtonProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareModalStep, setShareModalStep] = useState<ShareModalStep>('metadata');
    const [shareUrl, setShareUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [estimatedSize, setEstimatedSize] = useState(0);

    // Metadata form state
    const [shareName, setShareName] = useState('');
    const [shareProfilePic, setShareProfilePic] = useState('');
    const [shareBio, setShareBio] = useState('');
    const [externalUrl, setExternalUrl] = useState('');

    const handleExportImage = async () => {
        try {
            await exportAsImage('timeline-export', 'my-timecapsule.png');
            setShowMenu(false);
        } catch (error) {
            alert('Failed to export image. Please try again.');
        }
    };

    const handleExportJSON = () => {
        try {
            exportAsJSON(capsules, 'timecapsule-backup.json', false);
            setShowMenu(false);
        } catch (error) {
            alert('Failed to export JSON. Please try again.');
        }
    };

    const handleExportShareableJSON = (metadata?: ShareMetadata) => {
        try {
            exportAsJSON(capsules, 'timecapsule-share.json', true, metadata);

            const sizeInfo = estimateExportSize(capsules);
            if (sizeInfo.dataUrlCount > 0) {
                alert(`Note: ${sizeInfo.dataUrlCount} uploaded image(s) were excluded. Only external URLs are included.`);
            }
        } catch (error) {
            alert('Failed to export shareable JSON. Please try again.');
        }
    };

    const handleStartShare = () => {
        setShowMenu(false);
        setShareModalStep('metadata');
        setShowShareModal(true);
        setShareName('');
        setShareProfilePic('');
        setShareBio('');
        setExternalUrl('');
        setCopied(false);
    };

    const handleGenerateShareLink = () => {
        const metadata: ShareMetadata | undefined =
            (shareName || shareProfilePic || shareBio)
                ? { name: shareName, profilePic: shareProfilePic, bio: shareBio }
                : undefined;

        try {
            const result = generateShareableURL(capsules, metadata);

            if (result.needsExternalUrl) {
                setEstimatedSize(result.estimatedSize);
                setShareModalStep('too-large');
            } else {
                setShareUrl(result.url);
                setShareModalStep('success');
            }
        } catch (error) {
            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert('Failed to generate shareable link.');
            }
        }
    };

    const handleGenerateExternalLink = () => {
        if (!externalUrl.trim()) {
            alert('Please enter a valid URL to your hosted JSON file.');
            return;
        }

        const metadata: ShareMetadata | undefined =
            (shareName || shareProfilePic || shareBio)
                ? { name: shareName, profilePic: shareProfilePic, bio: shareBio }
                : undefined;

        try {
            const url = generateShareableURLWithExternal(externalUrl, metadata);
            setShareUrl(url);
            setShareModalStep('success');
        } catch (error) {
            alert('Failed to generate share link.');
        }
    };

    const handleExportForHosting = () => {
        const metadata: ShareMetadata | undefined =
            (shareName || shareProfilePic || shareBio)
                ? { name: shareName, profilePic: shareProfilePic, bio: shareBio }
                : undefined;

        handleExportShareableJSON(metadata);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShowEmbedCode = () => {
        setShareModalStep('embed');
    };

    const resetShareModal = () => {
        setShowShareModal(false);
        setShareModalStep('metadata');
        setShareUrl('');
        setCopied(false);
        setShareName('');
        setShareProfilePic('');
        setShareBio('');
        setExternalUrl('');
    };

    const sizeInfo = capsules.length > 0 ? estimateExportSize(capsules) : null;

    const getModalTitle = () => {
        switch (shareModalStep) {
            case 'metadata': return 'Customize Your Share';
            case 'too-large': return 'Timeline Too Large';
            case 'success': return 'Share Your Timeline';
            case 'embed': return 'Embed Code';
            default: return 'Share Timeline';
        }
    };

    const renderModalContent = () => {
        switch (shareModalStep) {
            case 'metadata':
                return <MetadataStep
                    shareName={shareName}
                    shareProfilePic={shareProfilePic}
                    shareBio={shareBio}
                    sizeInfo={sizeInfo}
                    onNameChange={setShareName}
                    onProfilePicChange={setShareProfilePic}
                    onBioChange={setShareBio}
                />;

            case 'too-large':
                return <TooLargeStep
                    estimatedSize={estimatedSize}
                    externalUrl={externalUrl}
                    onExternalUrlChange={setExternalUrl}
                />;

            case 'success':
                return <SuccessStep
                    shareUrl={shareUrl}
                    copied={copied}
                    onCopyLink={handleCopyLink}
                />;

            case 'embed':
                return <EmbedCodeGenerator
                    shareUrl={shareUrl}
                    onClose={resetShareModal}
                />;
        }
    };

    const renderModalFooter = () => {
        switch (shareModalStep) {
            case 'metadata':
                return (
                    <div className="flex gap-3">
                        <button
                            onClick={resetShareModal}
                            className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors font-medium text-red-500 outline"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerateShareLink}
                            className="flex-1 px-4 py-3 bg-accent-500 hover:bg-accent-600 text-black rounded-lg transition-colors font-medium outline"
                        >
                            Generate Link
                        </button>
                    </div>
                );

            case 'too-large':
                return (
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <button
                                onClick={handleExportForHosting}
                                className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors font-medium text-sm"
                            >
                                Export JSON First
                            </button>
                            <button
                                onClick={handleGenerateExternalLink}
                                className="flex-1 px-4 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors font-medium"
                                disabled={!externalUrl.trim()}
                            >
                                Generate Link
                            </button>
                        </div>
                        <button
                            onClick={resetShareModal}
                            className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </button>
                    </div>
                );

            case 'success':
                return (
                    <div className="flex gap-3">
                        <button
                            onClick={handleShowEmbedCode}
                            className="flex-1 px-4 py-3 border-2 border-accent-500 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-950 rounded-lg transition-colors font-medium"
                        >
                            Get Embed Code
                        </button>
                        <button
                            onClick={resetShareModal}
                            className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors font-medium"
                        >
                            Done
                        </button>
                    </div>
                );

            case 'embed':
                return null; // EmbedCodeGenerator has its own close button
        }
    };

    return (
        <>
            <div className="relative">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-4 rounded-2xl hover:bg-accent-50 dark:hover:bg-accent-950 transition-colors flex items-center gap-2 border-2 border-dashed border-accent-300 dark:border-accent-700"
                    title="Export Menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                    </svg>
                </button>

                {showMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-64 bg-card border rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                            {/* Export Section */}
                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                                Export
                            </div>

                            <button
                                onClick={handleExportImage}
                                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                                disabled={capsules.length === 0}
                            >
                                <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">Export as Image</div>
                                    <div className="text-xs text-muted-foreground">PNG format</div>
                                </div>
                            </button>

                            <button
                                onClick={handleExportJSON}
                                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                                disabled={capsules.length === 0}
                            >
                                <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">Full Backup (JSON)</div>
                                    <div className="text-xs text-muted-foreground">
                                        {sizeInfo?.withDataUrls || 'Includes uploads'}
                                    </div>
                                </div>
                            </button>

                            {/* Share Section */}
                            <div className="border-t my-1"></div>
                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                                Share
                            </div>

                            <button
                                onClick={handleStartShare}
                                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                                disabled={capsules.length === 0}
                            >
                                <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">Share Timeline</div>
                                    <div className="text-xs text-muted-foreground">Generate link & embed</div>
                                </div>
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Share Modal */}
            <Modal
                isOpen={showShareModal}
                onClose={resetShareModal}
                title={getModalTitle()}
                footer={renderModalFooter()}
                size="lg"
            >
                {renderModalContent()}
            </Modal>
        </>
    );
}

// Sub-components for each modal step
function MetadataStep({
    shareName,
    shareProfilePic,
    shareBio,
    sizeInfo,
    onNameChange,
    onProfilePicChange,
    onBioChange,
}: {
    shareName: string;
    shareProfilePic: string;
    shareBio: string;
    sizeInfo: any;
    onNameChange: (value: string) => void;
    onProfilePicChange: (value: string) => void;
    onBioChange: (value: string) => void;
}) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Add optional information to personalize your shared timeline
            </p>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Your Name (optional)
                </label>
                <input
                    type="text"
                    value={shareName}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="e.g., John Doe"
                    className="w-full px-4 py-3 bg-background border rounded-lg focus:ring-2 focus:ring-accent-500 focus:outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Profile Picture URL (optional)
                </label>
                <input
                    type="url"
                    value={shareProfilePic}
                    onChange={(e) => onProfilePicChange(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full px-4 py-3 bg-background border rounded-lg focus:ring-2 focus:ring-accent-500 focus:outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Bio (optional)
                </label>
                <textarea
                    value={shareBio}
                    onChange={(e) => onBioChange(e.target.value)}
                    placeholder="Tell others about yourself..."
                    rows={3}
                    className="w-full px-4 py-3 bg-background border rounded-lg focus:ring-2 focus:ring-accent-500 focus:outline-none resize-none"
                />
            </div>

            {sizeInfo && sizeInfo.dataUrlCount > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>
                            {sizeInfo.dataUrlCount} uploaded image(s) will not be included in the share. Only external URLs are shared.
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
}

function TooLargeStep({
    estimatedSize,
    externalUrl,
    onExternalUrlChange,
}: {
    estimatedSize: number;
    externalUrl: string;
    onExternalUrlChange: (value: string) => void;
}) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Your timeline is too large ({(estimatedSize / 1024).toFixed(1)} KB) to share via URL.
                Please host your JSON file publicly and provide the link.
            </p>

            <div className="p-4 bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 rounded-lg space-y-3">
                <p className="text-sm font-medium">Recommended hosting options:</p>
                <ul className="text-sm space-y-2 ml-4 list-disc text-muted-foreground">
                    <li>Google Drive (set sharing to "Anyone with the link")</li>
                    <li>GitHub Gist (create public gist)</li>
                    <li>Dropbox (get public share link)</li>
                    <li>iCloud Drive</li>
                </ul>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    External JSON URL
                </label>
                <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => onExternalUrlChange(e.target.value)}
                    placeholder="https://example.com/timeline.json"
                    className="w-full px-4 py-3 bg-background border rounded-lg focus:ring-2 focus:ring-accent-500 focus:outline-none"
                />
            </div>
        </div>
    );
}

function SuccessStep({
    shareUrl,
    copied,
    onCopyLink,
}: {
    shareUrl: string;
    copied: boolean;
    onCopyLink: () => void;
}) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Share this link with others. They can view and import your timeline.
                <br />
                <span className="text-red-500">Never include sensitive information in your timeline.</span>
            </p>

            <div className="relative">
                <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="w-full px-4 py-3 bg-muted rounded-lg pr-24 font-mono text-sm select-all"
                    onClick={(e) => e.currentTarget.select()}
                />
                <button
                    onClick={onCopyLink}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                    {copied ? '✓ Copied!' : 'Copy'}
                </button>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Your shareable link has been generated successfully!</span>
                </p>
            </div>
        </div>
    );
}