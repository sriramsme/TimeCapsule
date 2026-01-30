import type { Capsule, CapsuleType, LinkPreview } from '../types';

export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getCapsuleType(year: number): CapsuleType {
    const currentYear = new Date().getFullYear();
    return year > currentYear ? 'future' : 'past';
}

export function sortCapsules(capsules: Capsule[]): Capsule[] {
    return [...capsules].sort((a, b) => a.year - b.year);
}

export function createCapsule(year: number, title?: string, description?: string): Capsule {
    const type = getCapsuleType(year);
    const now = Date.now();

    return {
        id: generateId(),
        year,
        title: title || (type === 'future' ? `Year ${year}` : `The Year ${year}`),
        description,
        type,
        milestone: false,
        createdAt: now,
        updatedAt: now,
        colorSeed: Math.random(), // For consistent color generation
    };
}

export function updateCapsuleType(capsule: Capsule): Capsule {
    return {
        ...capsule,
        type: getCapsuleType(capsule.year),
        updatedAt: Date.now(),
    };
}

export function createBirthYearCapsule(birthYear: number): Capsule {
    return createCapsule(birthYear, 'Hello World', 'I arrived.');
}

export function validateCapsule(capsule: Partial<Capsule>): string[] {
    const errors: string[] = [];

    if (!capsule.year || capsule.year < 1900 || capsule.year > 2200) {
        errors.push('Year must be between 1900 and 2200');
    }

    if (!capsule.title || capsule.title.trim().length === 0) {
        errors.push('Title is required');
    }

    if (capsule.title && capsule.title.length > 100) {
        errors.push('Title must be less than 100 characters');
    }

    if (capsule.description && capsule.description.length > 1000) {
        errors.push('Description must be less than 1000 characters');
    }

    return errors;
}

export function getCapsulesStats(capsules: Capsule[]) {
    const total = capsules.length;
    const milestones = capsules.filter(c => c.milestone).length;
    const past = capsules.filter(c => c.type === 'past').length;
    const future = capsules.filter(c => c.type === 'future').length;

    const years = capsules.map(c => c.year);
    const earliestYear = years.length > 0 ? Math.min(...years) : null;
    const latestYear = years.length > 0 ? Math.max(...years) : null;
    const span = earliestYear && latestYear ? latestYear - earliestYear : 0;

    return {
        total,
        milestones,
        past,
        future,
        earliestYear,
        latestYear,
        span,
    };
}

// Generate consistent color from seed
export function getColorFromSeed(seed: number): string {
    const colors = [
        'from-rose-400 to-pink-600',
        'from-purple-400 to-indigo-600',
        'from-blue-400 to-cyan-600',
        'from-teal-400 to-emerald-600',
        'from-amber-400 to-orange-600',
        'from-red-400 to-rose-600',
        'from-violet-400 to-purple-600',
        'from-sky-400 to-blue-600',
        'from-lime-400 to-green-600',
        'from-orange-400 to-red-600',
        'from-cyan-400 to-teal-600',
        'from-fuchsia-400 to-pink-600',
    ];

    const index = Math.floor(seed * colors.length);
    return colors[index % colors.length];
}

// Detect media type from URL
export function detectMediaType(url: string): 'image' | 'video' | 'link' {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];
    const lowerUrl = url.toLowerCase();

    // Check if it's a data URL (uploaded file)
    if (lowerUrl.startsWith('data:image/')) {
        return 'image';
    }
    if (lowerUrl.startsWith('data:video/')) {
        return 'video';
    }

    // Check for YouTube
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
        return 'video';
    }

    // Check for video platforms
    if (lowerUrl.includes('vimeo.com') ||
        lowerUrl.includes('dailymotion.com') ||
        lowerUrl.includes('twitch.tv')) {
        return 'video';
    }

    // Check file extensions
    if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
        return 'image';
    }
    if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
        return 'video';
    }

    // Check for common image hosting patterns
    if (lowerUrl.includes('imgur.com') ||
        lowerUrl.includes('i.redd.it') ||
        lowerUrl.includes('unsplash.com') ||
        lowerUrl.includes('pexels.com') ||
        lowerUrl.includes('pixabay.com') ||
        lowerUrl.includes('cloudinary.com') ||
        lowerUrl.includes('imagekit.io')) {
        return 'image';
    }

    return 'link';
}

// Extract YouTube video ID from URL
export function extractYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
}


// Microlink API helper
export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
    try {
        const response = await fetch(
            `https://api.microlink.io?url=${encodeURIComponent(url)}`
        );

        if (!response.ok) throw new Error('Failed to fetch preview');

        const data = await response.json();

        if (data.status !== 'success') throw new Error('Preview not available');

        return {
            url,
            title: data.data.title,
            description: data.data.description,
            image: data.data.image?.url,
            logo: data.data.logo?.url,
        };
    } catch (error) {
        console.error('Link preview error:', error);
        return null;
    }
}

// Platform-specific preview handlers
export function getYouTubeThumbnail(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null;
}

export function getVimeoThumbnail(url: string): Promise<string | null> {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (!match) return Promise.resolve(null);

    return fetch(`https://vimeo.com/api/v2/video/${match[1]}.json`)
        .then(res => res.json())
        .then(data => data[0]?.thumbnail_large)
        .catch(() => null);
}
