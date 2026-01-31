import { useState, useEffect } from 'react';
import type { Capsule, LinkPreview } from '../types';
import { detectMediaType, fetchLinkPreview, getYouTubeThumbnail, getVimeoThumbnail } from '../utils/capsules';
import Modal from './Modal';

interface CapsuleModalProps {
    isOpen: boolean;
    capsule?: Capsule;
    existingYears: number[];
    onSave: (capsule: Capsule) => void;
    onClose: () => void;
    onDelete?: () => void;
}

export default function CapsuleModal({
    isOpen,
    capsule,
    existingYears,
    onSave,
    onClose,
    onDelete,
}: CapsuleModalProps) {
    const isEditing = !!capsule;
    const currentYear = new Date().getFullYear();

    const [formData, setFormData] = useState<Partial<Capsule>>({
        year: capsule?.year || currentYear,
        title: capsule?.title || '',
        description: capsule?.description || '',
        mediaUrl: capsule?.mediaUrl || '',
        milestone: capsule?.milestone || false,
        colorSeed: capsule?.colorSeed || Math.random(),
    });

    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | 'link' | undefined>(capsule?.mediaType);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState(false);
    const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);

    // Reset form when modal opens/closes or capsule changes
    useEffect(() => {
        if (isOpen) {
            if (capsule) {
                setFormData({
                    year: capsule.year,
                    title: capsule.title,
                    description: capsule.description,
                    mediaUrl: capsule.mediaUrl,
                    milestone: capsule.milestone,
                    colorSeed: capsule.colorSeed,
                });
                setMediaPreview(capsule.mediaUrl || null);
                setMediaType(capsule.mediaType);
            } else {
                setFormData({
                    year: currentYear,
                    title: '',
                    description: '',
                    mediaUrl: '',
                    milestone: false,
                    colorSeed: Math.random(),
                });
                setMediaPreview(null);
                setMediaType(undefined);
            }
            setPreviewError(false);
            setLinkPreview(null);
        }
    }, [isOpen, capsule, currentYear]);

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 5MB to be safe with localStorage)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setMediaPreview(dataUrl);
            setFormData({ ...formData, mediaUrl: dataUrl });
            setLinkPreview(null);

            if (file.type.startsWith('image/')) {
                setMediaType('image');
            } else if (file.type.startsWith('video/')) {
                setMediaType('video');
            }
        };
        reader.readAsDataURL(file);
    };

    // Enhanced URL handler with smart preview fetching
    const handleUrlChange = async (url: string) => {
        setFormData({ ...formData, mediaUrl: url });
        setPreviewError(false);
        setLinkPreview(null);

        if (!url.trim()) {
            setMediaPreview(null);
            setMediaType(undefined);
            setIsLoadingPreview(false);
            return;
        }

        // Detect media type
        const detected = detectMediaType(url);
        setMediaType(detected);
        setIsLoadingPreview(true);

        try {
            // Handle different media types
            if (detected === 'image') {
                // Direct image URL
                setMediaPreview(url);
                setIsLoadingPreview(false);
            } else if (detected === 'video') {
                // Check for YouTube
                if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    const thumbnail = getYouTubeThumbnail(url);
                    setMediaPreview(thumbnail);
                    setIsLoadingPreview(false);
                }
                // Check for Vimeo
                else if (url.includes('vimeo.com')) {
                    const thumbnail = await getVimeoThumbnail(url);
                    setMediaPreview(thumbnail);
                    setIsLoadingPreview(false);
                }
                // Other video URLs
                else {
                    setMediaPreview(url);
                    setIsLoadingPreview(false);
                }
            } else {
                // Generic link - fetch preview via Microlink
                const preview = await fetchLinkPreview(url);

                if (preview && preview.image) {
                    setLinkPreview(preview);
                    setMediaPreview(preview.image);

                    // Auto-fill title if empty
                    if (!formData.title && preview.title) {
                        setFormData(prev => ({ ...prev, title: preview.title }));
                    }
                } else {
                    setMediaPreview(null);
                }

                setIsLoadingPreview(false);
            }
        } catch (error) {
            console.error('Preview fetch error:', error);
            setMediaPreview(null);
            setIsLoadingPreview(false);
        }
    };

    const handleSave = () => {
        // Validation
        if (!formData.year || formData.year < 1900 || formData.year > 2200) {
            alert('Please enter a valid year between 1900 and 2200');
            return;
        }

        if (!formData.title?.trim()) {
            alert('Please enter a title');
            return;
        }

        if (!isEditing && existingYears.includes(formData.year)) {
            alert('A capsule for this year already exists');
            return;
        }

        const isFuture = formData.year > currentYear;
        const now = Date.now();

        const savedCapsule: Capsule = {
            id: capsule?.id || `${now}-${Math.random().toString(36).substr(2, 9)}`,
            year: formData.year,
            title: formData.title.trim(),
            description: formData.description?.trim(),
            mediaUrl: formData.mediaUrl?.trim(),
            mediaType: formData.mediaUrl ? mediaType : undefined,
            milestone: formData.milestone,
            type: isFuture ? 'future' : 'past',
            createdAt: capsule?.createdAt || now,
            updatedAt: now,
            colorSeed: formData.colorSeed || Math.random(),
        };

        onSave(savedCapsule);
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this capsule?')) {
            onDelete?.();
        }
    };

    const footer = (
        <div className="flex items-center gap-3">
            <button
                onClick={handleSave}
                className="flex-1 bg-accent-500 hover:bg-accent-600 text-black px-6 py-3 rounded-lg font-medium transition-colors"
            >
                {isEditing ? 'Save Changes' : 'Add Capsule'}
            </button>
            <button
                onClick={onClose}
                className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors"
            >
                Cancel
            </button>
            {isEditing && onDelete && (
                <button
                    onClick={handleDelete}
                    className="ml-auto text-red-600 hover:bg-red-50 dark:hover:bg-red-950 px-4 py-3 rounded-lg transition-colors"
                >
                    Delete
                </button>
            )}
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Edit Capsule' : 'Add Capsule'}
            footer={footer}
            size="lg"
        >
            <div className="space-y-6">
                {/* Year Input */}
                <div>
                    <label className="block text-sm font-medium mb-2">Year *</label>
                    <input
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                        min="1900"
                        max="2200"
                        disabled={isEditing}
                    />
                    {formData.year && formData.year > currentYear && (
                        <p className="text-xs text-accent-600 mt-2 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            This will be marked as a future aspiration
                        </p>
                    )}
                </div>

                {/* Title Input */}
                <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                        placeholder="A meaningful title for this year..."
                        maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        {formData.title?.length || 0}/100 characters
                    </p>
                </div>

                {/* Description Input */}
                <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 min-h-[120px] resize-none"
                        placeholder="Share your story, memories, or aspirations..."
                        maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        {formData.description?.length || 0}/1000 characters
                    </p>
                </div>

                {/* Media Upload/URL */}
                <div>
                    <label className="block text-sm font-medium mb-2">Media (optional)</label>

                    {/* URL Input */}
                    <div className="relative mb-3">
                        <input
                            type="url"
                            value={formData.mediaUrl}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            className="w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 whitespace-nowrap overflow-x-auto"
                            placeholder="Paste any URL (auto-detects images, videos, links)"
                        />
                        {mediaType && !isLoadingPreview && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 bg-accent-100 dark:bg-accent-900 text-accent-600 dark:text-accent-400 rounded-full capitalize">
                                {mediaType}
                            </span>
                        )}
                    </div>

                    <div className="text-sm text-muted-foreground mb-2">or</div>

                    {/* Upload Button */}
                    <label className="block cursor-pointer">
                        <div className="px-4 py-3 bg-muted hover:bg-muted/80 border-2 border-dashed rounded-lg text-center transition-colors">
                            <div className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span className="font-medium">Upload File</span>
                            </div>
                            <span className="text-xs text-muted-foreground block mt-1">
                                Max 5MB (not recommended for sharing)
                            </span>
                        </div>
                        <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>

                    {/* Loading State */}
                    {isLoadingPreview && (
                        <div className="mt-4 p-4 border rounded-lg flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-muted-foreground">Fetching preview...</span>
                        </div>
                    )}

                    {/* Media Preview */}
                    {!isLoadingPreview && mediaPreview && (
                        <div className="mt-4 rounded-lg overflow-hidden border">
                            {/* Link Preview Card */}
                            {linkPreview && (
                                <div className="p-4 bg-muted/50">
                                    <div className="flex gap-3">
                                        <img
                                            src={linkPreview.image}
                                            alt="Preview"
                                            className="w-24 h-24 object-cover rounded flex-shrink-0"
                                            onError={() => setPreviewError(true)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm line-clamp-2 mb-1">
                                                {linkPreview.title || 'Untitled'}
                                            </h4>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                {linkPreview.description || ''}
                                            </p>
                                            <p className="text-xs text-accent-600 truncate">
                                                {new URL(linkPreview.url).hostname}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Image Preview */}
                            {!linkPreview && mediaType === 'image' && (
                                <img
                                    src={mediaPreview}
                                    alt="Preview"
                                    className="w-full max-h-64 object-cover"
                                    onError={() => setPreviewError(true)}
                                />
                            )}

                            {/* Video Preview */}
                            {!linkPreview && mediaType === 'video' && (
                                <div className="relative">
                                    <img src={mediaPreview} alt="Video preview" className="w-full" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                                            <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewError && (
                                <div className="p-4 text-center text-sm text-muted-foreground bg-muted">
                                    Could not load preview. URL will be saved anyway.
                                </div>
                            )}
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                        Supports images, videos, YouTube, and link previews. Uploaded files won't be included in shared timelines.
                    </p>
                </div>

                {/* Milestone Checkbox */}
                <div>
                    <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <input
                            type="checkbox"
                            checked={formData.milestone || false}
                            onChange={(e) => setFormData({ ...formData, milestone: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-300 text-accent-500 focus:ring-accent-500 cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Mark as milestone</span>
                            <span className="text-lg">⭐</span>
                        </div>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1 ml-11">
                        Highlight this year as a major life event
                    </p>
                </div>
            </div>
        </Modal>
    );
}