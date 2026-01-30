/**
 * TimeCapsule Embed Auto-Resize Script
 * 
 * This script should be included in the parent page that embeds the TimeCapsule iframe.
 * It listens for height updates from the iframe and automatically resizes it.
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

    /**
     * Auto-resize TimeCapsule iframes
     */
    function initTimeCapsuleEmbeds() {
        // Find all TimeCapsule iframes
        const iframes = document.querySelectorAll('iframe[src*="timecapsule.srirams.me/embed"]');

        if (iframes.length === 0) {
            console.log('No TimeCapsule embeds found');
            return;
        }

        // Listen for resize messages from iframes
        window.addEventListener('message', function (event) {
            // Security: Verify origin
            if (!event.origin.includes('timecapsule.srirams.me') &&
                !event.origin.includes('localhost')) {
                return;
            }

            // Check if this is a TimeCapsule resize message
            if (event.data && event.data.type === 'timecapsule-resize') {
                const height = event.data.height;

                // Find the iframe that sent the message
                iframes.forEach(function (iframe) {
                    if (iframe.contentWindow === event.source) {
                        // Add some padding for safety
                        iframe.style.height = (height + 20) + 'px';

                        // Optional: smooth transition
                        iframe.style.transition = 'height 0.3s ease';
                    }
                });
            }
        });

        console.log('TimeCapsule auto-resize initialized for ' + iframes.length + ' embed(s)');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTimeCapsuleEmbeds);
    } else {
        initTimeCapsuleEmbeds();
    }

    // Also support manual initialization
    window.TimeCapsuleEmbed = {
        init: initTimeCapsuleEmbeds
    };
})();