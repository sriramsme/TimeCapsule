export type CapsuleType = 'past' | 'future';

export type LayoutMode = 'masonry' | 'vertical' | 'list';

export type Mood = 'joyful' | 'reflective' | 'challenging' | 'transformative' | 'peaceful' | 'adventurous';

export interface Capsule {
    id: string;
    year: number;
    title: string;
    description?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'link'; // Auto-detected or user-specified
    mood?: Mood;
    milestone?: boolean;
    type: CapsuleType;
    createdAt: number;
    updatedAt: number;
    colorSeed?: number; // For generating consistent random colors when no media
    tags?: string[];
    age?: number;
}

export interface TimelineData {
    capsules: Capsule[];
    version: number;
}

export type Theme = 'minimal' | 'dark' | 'colorful';

export interface ExportOptions {
    format: 'image' | 'json';
    theme?: Theme;
    includeMedia?: boolean;
}

export interface AppState {
    capsules: Capsule[];
    theme: Theme;
    selectedYear?: number;
}

export interface LinkPreview {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    logo?: string;
}


export interface ShareMetadata {
    name?: string;
    profilePic?: string; // URL to profile picture
    bio?: string;
    sharedAt?: string; // ISO timestamp
}

export interface ShareData {
    capsules: Capsule[];
    metadata?: ShareMetadata;
}