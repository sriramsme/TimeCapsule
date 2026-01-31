/**
 * TimeCapsule Embed Script
 * Handles auto-resize and theme syncing for iframes.
 *
 * Usage:
 * <script src="https://timecapsule.srirams.me/embed-script.js"></script>
 * <iframe 
 *   src="https://timecapsule.srirams.me/embed/?data=..." 
 *   id="timecapsule-embed"
 *   width="100%"
 *   frameborder="0"
 * ></iframe>
 */
(function () {
    'use strict';

    const ORIGINS = ["timecapsule.srirams.me", "localhost"];
    const MIN_HEIGHT = 200;
    const MAX_HEIGHT = 10000;

    function isTrustedOrigin(origin) {
        return ORIGINS.some(o => origin.includes(o));
    }

    function initTimeCapsuleEmbeds() {
        const iframes = document.querySelectorAll('iframe[src*="timecapsule"], iframe[src*="localhost:4322/embed"]');

        if (!iframes.length) {
            console.log('No TimeCapsule embeds found');
            return;
        }

        const iframeStates = new WeakMap();

        // Initialize state for each iframe
        iframes.forEach(iframe => {
            iframeStates.set(iframe, {
                lastHeight: 0,
                updateScheduled: false,
                rafId: null
            });

            // Set initial height to prevent layout shift
            iframe.style.height = '400px';
            iframe.style.transition = 'height 0.3s ease';
        });

        // Listen for messages from iframes
        window.addEventListener('message', (event) => {
            if (!isTrustedOrigin(event.origin)) return;

            const { type, height } = event.data || {};

            if (type === 'timecapsule-resize' && typeof height === 'number') {
                iframes.forEach(iframe => {
                    if (iframe.contentWindow !== event.source) return;

                    const state = iframeStates.get(iframe);
                    if (!state) return;

                    // Cancel any pending update
                    if (state.updateScheduled && state.rafId) {
                        cancelAnimationFrame(state.rafId);
                    }

                    // Validate height is within reasonable bounds
                    const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Math.ceil(height)));
                    const heightDiff = Math.abs(newHeight - state.lastHeight);

                    // Only update if change is significant (prevents micro-adjustments)
                    if (heightDiff > 10) {
                        state.rafId = requestAnimationFrame(() => {
                            iframe.style.height = `${newHeight}px`;
                            state.lastHeight = newHeight;
                            state.updateScheduled = false;
                        });
                        state.updateScheduled = true;
                    }
                });
            } else if (type === 'timecapsule-request-theme') {
                // iframe asks for theme on first load
                sendThemeToIframe(event.source);
            }
        });

        console.log(`TimeCapsule auto-resize initialized for ${iframes.length} embed(s)`);
    }

    function sendThemeToIframe(iframeWindow) {
        if (!iframeWindow) return;

        // Check for data-theme attribute first (your setup), then .dark class
        const html = document.documentElement;
        let theme = 'light';

        if (html.getAttribute('data-theme') === 'dark' || html.classList.contains('dark')) {
            theme = 'dark';
        }

        iframeWindow.postMessage({ type: 'timecapsule-theme', theme }, '*');
    }

    function sendThemeToEmbeds() {
        const iframes = document.querySelectorAll('iframe[src*="timecapsule"], iframe[src*="localhost:4322/embed"]');
        iframes.forEach(iframe => {
            if (iframe.contentWindow) {
                sendThemeToIframe(iframe.contentWindow);
            }
        });
    }

    // On initial load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initTimeCapsuleEmbeds();
            // Delay theme send to ensure iframe is ready
            setTimeout(sendThemeToEmbeds, 100);
        });
    } else {
        initTimeCapsuleEmbeds();
        setTimeout(sendThemeToEmbeds, 100);
    }

    // Observe theme changes dynamically (watch for data-theme and .dark class)
    const observer = new MutationObserver(sendThemeToEmbeds);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme']
    });

    // Expose manual init if needed
    window.TimeCapsuleEmbed = {
        init: initTimeCapsuleEmbeds,
        sendTheme: sendThemeToEmbeds
    };
})();