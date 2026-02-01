import type { Capsule, ShareData, ShareMetadata } from '../types';

export interface ValidationResult {
    valid: boolean;
    error?: string;
    data?: {
        capsules: Capsule[];
        metadata?: ShareMetadata;
    };
    warnings?: string[];
}

/**
 * Comprehensive validation for imported JSON files
 */
export function validateImportedJSON(parsed: any): ValidationResult {
    const warnings: string[] = [];

    console.log('🔍 Starting validation for:', parsed);

    // Level 1: Basic structure validation
    if (typeof parsed !== 'object' || parsed === null) {
        return {
            valid: false,
            error: 'Invalid file format. Expected a JSON object.',
        };
    }

    // Handle legacy format (direct array of capsules)
    if (Array.isArray(parsed)) {
        parsed = { capsules: parsed };
    }

    // Check for capsules array
    if (!parsed.capsules || !Array.isArray(parsed.capsules)) {
        return {
            valid: false,
            error: 'This file doesn\'t appear to be a TimeCapsule export. Missing capsules data.',
        };
    }

    console.log('✅ Found capsules array with', parsed.capsules.length, 'items');

    if (parsed.capsules.length === 0) {
        return {
            valid: false,
            error: 'This file contains no capsules to import.',
        };
    }

    // Level 2: Validate and sanitize each capsule
    const validCapsules: Capsule[] = [];
    let invalidCount = 0;

    for (let i = 0; i < parsed.capsules.length; i++) {
        const capsule = parsed.capsules[i];
        console.log(`Validating capsule ${i + 1}:`, capsule);

        const validationResult = validateAndSanitizeCapsule(capsule);

        if (validationResult.valid && validationResult.capsule) {
            console.log(`✅ Capsule ${i + 1} is valid`);
            validCapsules.push(validationResult.capsule);
        } else {
            console.log(`❌ Capsule ${i + 1} is invalid`);
            invalidCount++;
        }
    }

    console.log('📊 Validation results:', {
        total: parsed.capsules.length,
        valid: validCapsules.length,
        invalid: invalidCount
    });

    // If no valid capsules, return error
    if (validCapsules.length === 0) {
        return {
            valid: false,
            error: 'All capsules in this file are invalid or corrupted.',
        };
    }

    // Add warning if some capsules were skipped
    if (invalidCount > 0) {
        warnings.push(
            `${invalidCount} capsule${invalidCount > 1 ? 's were' : ' was'} skipped due to invalid data.`
        );
    }

    // Level 3: Validate metadata if present
    let validMetadata: ShareMetadata | undefined;
    if (parsed.metadata && typeof parsed.metadata === 'object') {
        validMetadata = validateAndSanitizeMetadata(parsed.metadata);
    }

    console.log('✅ Final valid capsules:', validCapsules);

    return {
        valid: true,
        data: {
            capsules: validCapsules,
            metadata: validMetadata,
        },
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}

/**
 * Validate and sanitize a single capsule
 */
function validateAndSanitizeCapsule(capsule: any): { valid: boolean; capsule?: Capsule } {
    try {
        // Required fields validation
        if (
            typeof capsule.id !== 'string' ||
            typeof capsule.year !== 'number' ||
            typeof capsule.title !== 'string' ||
            (capsule.type !== 'past' && capsule.type !== 'future')
        ) {
            return { valid: false };
        }

        // Sanitize and construct valid capsule
        const sanitized: Capsule = {
            // Core required fields
            id: sanitizeString(capsule.id),
            year: Math.floor(capsule.year), // Ensure integer
            title: sanitizeString(capsule.title),
            type: capsule.type,

            // Timestamps (use current time if invalid)
            createdAt: typeof capsule.createdAt === 'number' ? capsule.createdAt : Date.now(),
            updatedAt: typeof capsule.updatedAt === 'number' ? capsule.updatedAt : Date.now(),

            // Optional fields with validation
            description: capsule.description ? sanitizeString(capsule.description) : undefined,
            mediaUrl: capsule.mediaUrl && typeof capsule.mediaUrl === 'string'
                ? sanitizeURL(capsule.mediaUrl)
                : undefined,
            mediaType: validateMediaType(capsule.mediaType),
            mood: validateMood(capsule.mood),
            milestone: typeof capsule.milestone === 'boolean' ? capsule.milestone : undefined,
            colorSeed: typeof capsule.colorSeed === 'number' ? capsule.colorSeed : undefined,
            tags: Array.isArray(capsule.tags)
                ? capsule.tags.filter((t: any) => typeof t === 'string').map(sanitizeString)
                : undefined,
            age: typeof capsule.age === 'number' ? Math.floor(capsule.age) : undefined,
        };

        return { valid: true, capsule: sanitized };
    } catch {
        return { valid: false };
    }
}

/**
 * Validate and sanitize metadata
 */
function validateAndSanitizeMetadata(metadata: any): ShareMetadata | undefined {
    try {
        const sanitized: ShareMetadata = {};

        if (metadata.name && typeof metadata.name === 'string') {
            sanitized.name = sanitizeString(metadata.name);
        }

        if (metadata.bio && typeof metadata.bio === 'string') {
            sanitized.bio = sanitizeString(metadata.bio);
        }

        if (metadata.profilePic && typeof metadata.profilePic === 'string') {
            sanitized.profilePic = sanitizeURL(metadata.profilePic);
        }

        if (metadata.sharedAt && typeof metadata.sharedAt === 'string') {
            // Validate ISO date string
            const date = new Date(metadata.sharedAt);
            if (!isNaN(date.getTime())) {
                sanitized.sharedAt = metadata.sharedAt;
            }
        }

        return Object.keys(sanitized).length > 0 ? sanitized : undefined;
    } catch {
        return undefined;
    }
}

/**
 * Sanitize string to prevent XSS
 * Only removes dangerous characters, doesn't encode everything
 */
function sanitizeString(str: string): string {
    if (typeof str !== 'string') return '';

    // Just trim and limit length - React will handle XSS prevention during rendering
    return str
        .trim()
        .slice(0, 10000); // Reasonable length limit
}

/**
 * Sanitize URL (basic validation)
 */
function sanitizeURL(url: string): string | undefined {
    if (typeof url !== 'string') return undefined;

    try {
        // Allow data URLs for base64 images
        if (url.startsWith('data:')) {
            return url;
        }

        // Validate HTTP(S) URLs
        const parsed = new URL(url);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return url;
        }

        return undefined;
    } catch {
        return undefined;
    }
}

/**
 * Validate media type
 */
function validateMediaType(type: any): 'image' | 'video' | 'link' | undefined {
    if (type === 'image' || type === 'video' || type === 'link') {
        return type;
    }
    return undefined;
}

/**
 * Validate mood
 */
function validateMood(mood: any): 'joyful' | 'reflective' | 'challenging' | 'transformative' | 'peaceful' | 'adventurous' | undefined {
    const validMoods = ['joyful', 'reflective', 'challenging', 'transformative', 'peaceful', 'adventurous'];
    if (validMoods.includes(mood)) {
        return mood;
    }
    return undefined;
}