import { useState } from 'react';
import { SITE } from '@/config';

interface EmbedCodeGeneratorProps {
    shareUrl: string;
    onClose: () => void;
}

/**
 * Component to generate and display embed code for websites
 * Can be added to the share modal as an additional tab/option
 */
export default function EmbedCodeGenerator({ shareUrl, onClose }: EmbedCodeGeneratorProps) {
    const [embedWidth, setEmbedWidth] = useState('100%');
    const [embedHeight, setEmbedHeight] = useState('600');
    const [useAutoResize, setUseAutoResize] = useState(true);
    const [copied, setCopied] = useState(false);

    // Convert share URL to embed URL
    const embedUrl = shareUrl.replace('/share', '/embed');

    // Generate embed code based on settings
    const generateEmbedCode = () => {
        if (useAutoResize) {
            // Auto-resize version with script
            return `
<script src="${SITE.website}/embed-script.js"></script>
<iframe 
  src="${embedUrl}"
  width="${embedWidth}"
  style="border-radius: 2rem;"
  frameborder="0"
></iframe>`;
        } else {
            // Fixed height version
            return `<iframe 
  src="${embedUrl}"
  width="${embedWidth}"
  height="${embedHeight}px"
  style="border-radius: 2rem;"
  frameborder="0"
></iframe>`;
        }
    };

    const embedCode = generateEmbedCode();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(embedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            const textArea = document.createElement('textarea');
            textArea.value = embedCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-4 text-foreground">
            <div>
                <p className="text-sm text-muted-foreground mb-4">
                    Embed this timeline on your website. The embed will automatically match your site's theme.
                </p>
            </div>

            {/* Embed Settings */}
            <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="text-sm font-semibold text-foreground">
                    Embed Settings
                </h4>

                {/* Width */}
                <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">
                        Width
                    </label>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={embedWidth}
                            onChange={(e) => setEmbedWidth(e.target.value)}
                            placeholder="100%"
                            className="flex-1 px-3 py-2 text-sm rounded-lg
                                   bg-background text-foreground
                                   border border-border
                                   placeholder:text-muted-foreground
                                   focus:ring-2 focus:ring-accent-500 focus:outline-none"
                        />

                        <button
                            onClick={() => setEmbedWidth('100%')}
                            className="px-3 py-2 text-sm rounded-lg
                                   bg-background text-foreground
                                   border border-border
                                   hover:bg-accent/10 transition-colors"
                        >
                            Full
                        </button>

                        <button
                            onClick={() => setEmbedWidth('600px')}
                            className="px-3 py-2 text-sm rounded-lg
                                   bg-background text-foreground
                                   border border-border
                                   hover:bg-accent/10 transition-colors"
                        >
                            600px
                        </button>
                    </div>
                </div>

                {/* Auto-resize toggle */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="auto-resize"
                        checked={useAutoResize}
                        onChange={(e) => setUseAutoResize(e.target.checked)}
                        className="w-4 h-4 rounded
                               border-border
                               bg-background
                               text-accent-500
                               focus:ring-accent-500"
                    />

                    <label
                        htmlFor="auto-resize"
                        className="text-sm cursor-pointer flex-1 text-foreground"
                    >
                        Auto-resize height (recommended)
                    </label>
                </div>

                {/* Height */}
                {!useAutoResize && (
                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">
                            Height (pixels)
                        </label>

                        <input
                            type="number"
                            value={embedHeight}
                            onChange={(e) => setEmbedHeight(e.target.value)}
                            min="300"
                            max="2000"
                            step="50"
                            className="w-full px-3 py-2 text-sm rounded-lg
                                   bg-background text-foreground
                                   border border-border
                                   focus:ring-2 focus:ring-accent-500 focus:outline-none"
                        />
                    </div>
                )}
            </div>

            {/* Preview */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-foreground">
                        Preview
                    </h4>

                    <span className="text-xs text-muted-foreground">
                        {useAutoResize ? 'Auto-height' : `${embedHeight}px tall`}
                    </span>
                </div>

                <div className="rounded-lg p-4 bg-muted/30 border border-border overflow-hidden">
                    <iframe
                        src={embedUrl}
                        width="100%"
                        height={useAutoResize ? "400" : embedHeight}
                        className="mx-auto rounded-lg border border-border bg-background"
                        style={{ minHeight: '300px' }}
                    />
                </div>
            </div>

            {/* Embed Code */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-foreground">
                        Embed Code
                    </h4>

                    <button
                        onClick={handleCopy}
                        className="text-xs px-3 py-1.5 rounded
                               bg-accent-500 text-primary-foreground
                               hover:bg-accent-600 transition-colors"
                    >
                        {copied ? '✓ Copied!' : 'Copy Code'}
                    </button>
                </div>

                <pre className="p-4 rounded-lg text-xs overflow-x-auto
                            bg-muted text-foreground
                            border border-border">
                    <code>{embedCode}</code>
                </pre>
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-lg space-y-2
                        bg-accent/10
                        border border-accent/20">
                <h4 className="text-sm font-semibold text-foreground">
                    How to Use:
                </h4>

                <ol className="text-sm space-y-1.5 ml-4 list-decimal text-muted-foreground">
                    <li>Copy the embed code above</li>
                    <li>Paste it into your website's HTML</li>
                    <li>The timeline will automatically load and display</li>

                    {useAutoResize && (
                        <li className="text-accent-600 dark:text-accent-400">
                            The height will auto-adjust based on content
                        </li>
                    )}
                </ol>
            </div>

            {/* Compatibility Note */}
            <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">
                    Compatible with:
                </p>

                <ul className="ml-4 list-disc space-y-0.5">
                    <li>WordPress, Webflow, Wix, Squarespace</li>
                    <li>Static HTML sites</li>
                    <li>React, Vue, Angular apps</li>
                    <li>Any site that supports iframe embeds</li>
                </ul>
            </div>

            {/* Close button */}
            <div className="flex gap-2 pt-2">
                <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 rounded-lg
                           bg-muted text-foreground
                           hover:bg-muted/80 transition-colors"
                >
                    Done
                </button>
            </div>
        </div>
    )
};
