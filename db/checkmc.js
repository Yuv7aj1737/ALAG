const OWNED_SOURCES = new Set([
    'purchased',
    'gamepass',
    'true (source: n/a)',
    'owned',
    'yes'
]);

const NOT_OWNED_SOURCES = new Set([
    'trial',
    'none',
    'no',
    'no minecraft!',
    'xbl failed',
    'maybe',
    'maybe has mc',
    'maybe (dm david asap)',
    'unknown'
]);

function normalize(value) {
    if (typeof value !== 'string') return null;
    return value.trim().toLowerCase();
}

function checkmc(mc) {
    if (mc === true || mc === 1 || mc === '1') return true;
    if (mc === false || mc === 0 || mc === '0' || mc === null || mc === undefined) return false;

    const normalized = normalize(mc);
    if (!normalized) return false;
    if (OWNED_SOURCES.has(normalized)) return true;
    if (NOT_OWNED_SOURCES.has(normalized)) return false;

    // Anything else is unknown — treat as not owned (do not over-claim MC)
    return false;
}

module.exports = checkmc;

