import { useState } from 'react';
import type { Capsule } from '../types';
import { getColorFromSeed } from '../utils/capsules';

interface CapsuleCardProps {
    capsule: Capsule;
    onEdit?: () => void;
    position: 'left' | 'right' | 'center';
    layoutMode?: 'masonry' | 'vertical' | 'list';
}

export default function CapsuleCard({ capsule, onEdit, position, layoutMode = 'masonry' }: CapsuleCardProps) {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    const isFuture = capsule.type === 'future';
    const hasMedia = capsule.mediaUrl && !imageError;
    const colorGradient = getColorFromSeed(capsule.colorSeed || 0.5);

    const alignmentClass = position === 'left'
        ? 'mr-auto'
        : position === 'right'
            ? 'ml-auto'
            : 'mx-auto';

    // Determine width class based on layout mode
    const getWidthClass = () => {
        if (layoutMode === 'vertical') return 'max-w-lg';
        if (layoutMode === 'masonry') return 'w-full';
        return 'w-full';
    };

    // Handle image load to get dimensions
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setImageLoaded(true);
    };

    // Calculate dynamic height based on aspect ratio for masonry
    const getMediaHeight = () => {
        if (!imageDimensions || layoutMode === 'vertical') return 'h-64';

        const aspectRatio = imageDimensions.width / imageDimensions.height;

        // Masonry mode: use natural aspect ratio more
        if (aspectRatio > 2) return 'h-40';  // Very wide
        if (aspectRatio > 1.5) return 'h-48'; // Landscape
        if (aspectRatio > 1.2) return 'h-56'; // Wide
        if (aspectRatio > 0.9) return 'h-64'; // Square-ish
        if (aspectRatio > 0.7) return 'h-72'; // Portrait
        if (aspectRatio > 0.5) return 'h-80'; // Tall
        return 'h-96'; // Very tall
    };

    const mediaHeightClass = hasMedia && capsule.mediaType === 'image'
        ? getMediaHeight()
        : 'h-56';

    return (
        <div
            className={`${getWidthClass()} ${alignmentClass} group`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`bg-card text-card-foreground rounded-2xl overflow-hidden transition-all duration-300
                ${onEdit ? 'cursor-pointer hover:shadow-2xl hover:scale-[1.02]' : ''}
                ${isFuture ? 'ring-2 ring-dashed ring-accent-300' : 'shadow-lg'}
                ${capsule.milestone && !isFuture ? 'ring-2 ring-accent-500/40' : ''}
            `}
                onClick={onEdit}
            >
                {/* Media or Color Banner */}
                <div
                    className={`relative w-full border-b border-border ${mediaHeightClass} overflow-hidden`}
                >
                    {hasMedia ? (
                        <>
                            {/* Image */}
                            {capsule.mediaType === 'image' && (
                                <>
                                    <img
                                        src={capsule.mediaUrl}
                                        alt={capsule.title}
                                        className={`w-full h-full object-cover transition-all duration-500
                                        ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                                        ${isHovered ? 'scale-105 brightness-110' : 'scale-100'}
                                    `}
                                        onLoad={handleImageLoad}
                                        onError={() => setImageError(true)}
                                    />
                                    {!imageLoaded && (
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-br ${colorGradient} animate-pulse`}
                                        />
                                    )}
                                </>
                            )}

                            {/* Video */}
                            {capsule.mediaType === 'video' && (
                                <>
                                    {capsule.mediaUrl?.includes('youtube') ||
                                        capsule.mediaUrl?.includes('youtu.be') ? (
                                        <div className="relative w-full h-full">
                                            <img
                                                src={(() => {
                                                    const match =
                                                        capsule.mediaUrl.match(
                                                            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/
                                                        );
                                                    return match
                                                        ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
                                                        : capsule.mediaUrl;
                                                })()}
                                                alt={capsule.title}
                                                className={`w-full h-full object-cover transition-all duration-300
                                                ${isHovered ? 'scale-105' : 'scale-100'}
                                            `}
                                                onLoad={() => setImageLoaded(true)}
                                                onError={() => setImageError(true)}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-foreground/30">
                                                <div
                                                    className={`w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg transition-transform
                                                    ${isHovered ? 'scale-110' : 'scale-100'}
                                                `}
                                                >
                                                    <svg
                                                        className="w-8 h-8 ml-1 text-primary-foreground"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <video
                                            src={capsule.mediaUrl}
                                            className="w-full h-full object-cover"
                                            onLoadedMetadata={() => setImageLoaded(true)}
                                            onError={() => setImageError(true)}
                                        />
                                    )}
                                </>
                            )}

                            {/* Link */}
                            {capsule.mediaType === 'link' && (
                                <div
                                    className={`w-full h-full bg-gradient-to-br ${colorGradient} flex flex-col items-center justify-center p-6`}
                                >
                                    <svg
                                        className="w-16 h-16 text-foreground mb-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                        />
                                    </svg>
                                    <p className="text-foreground text-sm text-center break-all px-4">
                                        {new URL(capsule.mediaUrl || '').hostname}
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        /* No media */
                        <div
                            className={`w-full h-full bg-gradient-to-br ${colorGradient} flex items-center justify-center relative overflow-hidden`}
                        >
                            <div className="absolute inset-0 opacity-10">
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundImage:
                                            'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                        backgroundSize: '32px 32px',
                                    }}
                                />
                            </div>
                            <span className="text-7xl font-display font-bold relative z-10 text-foreground">
                                {capsule.year}
                            </span>
                        </div>
                    )}

                    {/* Year Badge */}
                    <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full font-display font-bold shadow-lg border border-border">
                        {capsule.year}
                    </div>

                    {/* Badges */}
                    <div className="absolute top-4 right-4 flex gap-2">
                        {isFuture && (
                            <span className="px-2 py-1 bg-accent-500/90 text-primary-foreground text-xs rounded-full shadow">
                                Future
                            </span>
                        )}
                        {capsule.milestone && (
                            <span className="px-2 py-1 bg-accent-600/90 text-primary-foreground text-xs rounded-full flex items-center gap-1 shadow">
                                <svg
                                    className="w-3 h-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </span>
                        )}
                    </div>

                    {/* Edit overlay */}
                    {onEdit && (
                        <div
                            className={`absolute inset-0 transition-all duration-300 flex items-center justify-center
                            ${isHovered ? 'bg-background/40' : ''}
                        `}
                        >
                            <span
                                className={`bg-background text-foreground text-sm font-medium px-4 py-2 rounded-full border border-border transition-all duration-300
                                ${isHovered
                                        ? 'opacity-100 scale-100'
                                        : 'opacity-0 scale-90'}
                            `}
                            >
                                Click to edit
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    <h3 className="text-xl font-display font-bold mb-2 line-clamp-2 text-foreground">
                        {capsule.title}
                    </h3>

                    {capsule.description && (
                        <p
                            className={`text-muted-foreground whitespace-pre-wrap transition-all duration-300
                            ${isHovered && layoutMode !== 'list'
                                    ? 'line-clamp-none'
                                    : 'line-clamp-3'}
                        `}
                        >
                            {capsule.description}
                        </p>
                    )}

                    {capsule.tags && capsule.tags.length > 0 && (
                        <div
                            className={`flex flex-wrap gap-1.5 mt-3 transition-all duration-300
                            ${isHovered
                                    ? 'opacity-100 translate-y-0'
                                    : 'opacity-0 translate-y-2'}
                        `}
                        >
                            {capsule.tags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="text-xs px-2 py-1 bg-accent/10 text-accent-600 dark:text-accent-400 rounded"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {capsule.age !== undefined && (
                        <div className="mt-3 text-xs text-muted-foreground">
                            Age {capsule.age}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
};
