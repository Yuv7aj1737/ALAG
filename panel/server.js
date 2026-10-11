/**
 * Standalone panel listener (127.0.0.1:8090) for direct origin access via
 * nginx /panel. The same app is also mounted inside the bot's HTTP API for
 * the Cloudflare tunnel path.
 */
const { createPanelApp, panelConfig } = require('./panelapp');

createPanelApp().listen(panelConfig.port, '127.0.0.1', () => {
    console.log(`[PANEL] Listening on 127.0.0.1:${panelConfig.port}`);
});

