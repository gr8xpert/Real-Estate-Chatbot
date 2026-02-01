/**
 * RealtySoft Widget Loader v2.0
 *
 * Auto-versioning: Uses current timestamp, no manual version updates needed.
 * Just upload new chatbot.js and all sites get it automatically.
 */
(function() {
    var CHATBOT_URL = 'https://realtysoft.ai/n8n/chatbot.js';

    // Prevent double loading
    if (window._realtySoftLoaderDone) return;
    window._realtySoftLoaderDone = true;

    // Queue for configs called before script loads
    window._realtySoftQueue = [];

    // Temporary function that queues configs
    window.initRealtySoftEmbed = function(config) {
        window._realtySoftQueue.push(config);
    };

    // Load main script with timestamp (always fresh)
    var script = document.createElement('script');
    script.src = CHATBOT_URL + '?v=' + Date.now();

    script.onerror = function() {
        console.error('RealtySoft: Failed to load chatbot.js');
    };

    document.head.appendChild(script);
})();
