/**
 * Handles auto-resize and theme syncing for iframes.
 *
 */
(function () {
    'use strict';

    const url = "https://timecapsule.srirams.me";
    const domain = "https://timecapsule.srirams.me";

    // PRODUCTION ONLY - No localhost for security
    const ALLOWED_ORIGINS = [
        url
    ];

    const MIN_HEIGHT = 200;
    const MAX_HEIGHT = 10000;
    function isTrustedOrigin(origin) {
        try {
            const originUrl = new URL(origin);
            const allowedUrl = new URL(url);
            return originUrl.origin === allowedUrl.origin;
        } catch {
            return false;
        }
    }


    function initTimeCapsuleEmbeds() {
        const iframes = document.querySelectorAll(
            'iframe[src*="' + domain + '/embed"]'
        );

        if (!iframes.length) {
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
            const initialHeight = iframe.getAttribute('data-initial-height') || '400px';
            iframe.style.height = initialHeight;

            iframe.style.transition = 'height 0.3s ease';
        });

        // Listen for messages from iframes
        window.addEventListener('message', (event) => {
            // Security: Verify origin
            if (!isTrustedOrigin(event.origin)) {
                return;
            }

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

                    // Only update if change is significant
                    if (heightDiff > 10) {  // ← This is good, keeps it
                        state.rafId = requestAnimationFrame(() => {
                            iframe.style.height = `${newHeight}px`;
                            state.lastHeight = newHeight;
                            state.updateScheduled = false;
                        });
                        state.updateScheduled = true;
                    }
                });
            } else if (type === 'timecapsule-request-theme') {
                sendThemeToIframe(event.source);
            }
        });
    }

    function sendThemeToIframe(iframeWindow) {
        if (!iframeWindow) return;

        const html = document.documentElement;
        let theme = 'light';

        if (html.getAttribute('data-theme') === 'dark' || html.classList.contains('dark')) {
            theme = 'dark';
        }

        // Send only to allowed origins
        ALLOWED_ORIGINS.forEach(origin => {
            try {
                iframeWindow.postMessage({ type: 'timecapsule-theme', theme }, origin);
            } catch (e) {
                // Silently ignore
            }
        });
    }

    function sendThemeToEmbeds() {
        const iframes = document.querySelectorAll(
            'iframe[src*="' + domain + '/embed"]'
        );

        iframes.forEach(iframe => {
            if (iframe.contentWindow) {
                sendThemeToIframe(iframe.contentWindow);
            }
        });
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initTimeCapsuleEmbeds();
            setTimeout(sendThemeToEmbeds, 100);
        });
    } else {
        initTimeCapsuleEmbeds();
        setTimeout(sendThemeToEmbeds, 100);
    }

    // Observe theme changes
    const observer = new MutationObserver(sendThemeToEmbeds);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme']
    });

    // Public API
    window.TimeCapsuleEmbed = {
        init: initTimeCapsuleEmbeds,
        sendTheme: sendThemeToEmbeds
    };
})();