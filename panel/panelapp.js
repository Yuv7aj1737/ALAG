/**
 * Owner panel express app. Mounted two ways:
 *   - panel/server.js listens on 127.0.0.1:8090 (direct origin access)
 *   - handleapi.js delegates /panel/* requests (Cloudflare tunnel path)
 * Both share panel-config.json and public/.
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { execFile } = require('child_process');

const ROOT = path.join(__dirname, '..');
const botConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const { queryParams } = require(path.join(ROOT, 'db', 'database'));

// ---- Web portal (license access) config ----
const WEB_CONFIG_PATH = path.join(__dirname, 'web-config.json');
let webConfig;
if (fs.existsSync(WEB_CONFIG_PATH)) {
    webConfig = JSON.parse(fs.readFileSync(WEB_CONFIG_PATH, 'utf8'));
} else {
    // Mainbot's own token is used for OAuth: client id is derived from it, and the
    // token itself authenticates /users/@me when checking guild membership.
    webConfig = {
        client_id: (() => {
            try {
                const t = botConfig.tokens[0];
                return Buffer.from(t.split('.')[0], 'base64').toString();
            } catch (e) { return ''; }
        })(),
        client_secret: '',
        bot_token: botConfig.tokens[0] || '',
        guild_id: botConfig.guildid || '',
        redirect_uri: 'https://your-domain.com/auth/discord',
        owner_id: (botConfig.owners && botConfig.owners[0]) || ''
    };
    fs.writeFileSync(WEB_CONFIG_PATH, JSON.stringify(webConfig, null, 2));
    fs.chmodSync(WEB_CONFIG_PATH, 0o600);
    console.log(`[WEB] Generated web-config.json (fill client_secret for OAuth)`);
}

function oauthTokenRequest(form) {
    return new Promise((resolve, reject) => {
        const payload = new URLSearchParams(form).toString();
        const req = require('https').request({
            host: 'discord.com', path: '/api/oauth2/token', method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(payload) }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve({ status: res.statusCode, json: JSON.parse(data) }); } catch (e) { reject(e); } });
        });
        req.on('error', reject);
        req.write(payload); req.end();
    });
}

async function discordFetch(path, token, type = 'Bearer') {
    return new Promise((resolve, reject) => {
        const req = require('https').request({
            host: 'discord.com', path, method: 'GET',
            headers: { Authorization: `${type} ${token}` }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
        });
        req.on('error', reject);
        req.end();
    });
}

/**
 * Web-user access check: user must exist in usedLicenses with valid expiry.
 * Owners bypass. Returns { ok, expiry }.
 */
async function hasWebAccess(userId) {
    if (userId === webConfig.owner_id) return { ok: true, expiry: null, owner: true };
    try {
        const rows = await queryParams('SELECT expiry FROM usedLicenses WHERE user_id = ?', [userId]);
        if (rows.length > 0) {
            const expiry = parseInt(rows[0].expiry);
            if (expiry > Date.now()) return { ok: true, expiry, owner: false };
            return { ok: false, expired: true, expiry, owner: false };
        }
    } catch (e) {
        console.error('[WEB] hasWebAccess error:', e.message);
    }
    return { ok: false, owner: false };
}

function requireWebAuth(req, res, next) {
    const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('web_token='));
    if (!cookie) return res.status(401).json({ error: 'unauthorized', needAuth: true });
    try {
        const payload = jwt.verify(cookie.split('=').slice(1).join('='), panelConfig.secret);
        if (!payload.web) return res.status(401).json({ error: 'unauthorized', needAuth: true });
        req.webUser = payload;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'unauthorized', needAuth: true });
    }
}

function errorPage(title, message) {
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + title + '</title></head>' +
        '<body style="background:#0d1117;color:#e6edf3;font-family:-apple-system,Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">' +
        '<div style="text-align:center;max-width:420px;padding:24px"><h1>' + title + '</h1><p style="color:#8b949e">' + message + '</p></div></body></html>';
}

function sign(payload) {
    return jwt.sign(payload, panelConfig.secret, { expiresIn: '7d' });
}

function setWebToken(res, payload) {
    res.setHeader('Set-Cookie', `web_token=${sign({ ...payload, web: 1 })}; Max-Age=604800; HttpOnly; SameSite=Lax; Path=/`);
}

const PANEL_CONFIG_PATH = path.join(__dirname, 'panel-config.json');
let panelConfig;
if (fs.existsSync(PANEL_CONFIG_PATH)) {
    panelConfig = JSON.parse(fs.readFileSync(PANEL_CONFIG_PATH, 'utf8'));
} else {
    panelConfig = {
        password: require('crypto').randomBytes(24).toString('hex'),
        secret: require('crypto').randomBytes(32).toString('hex'),
        port: 8090
    };
    fs.writeFileSync(PANEL_CONFIG_PATH, JSON.stringify(panelConfig, null, 2));
    fs.chmodSync(PANEL_CONFIG_PATH, 0o600);
    console.log(`[PANEL] Generated password: ${panelConfig.password}`);
}

const BOT_API_HOST = '127.0.0.1';
const BOT_API_PORT = botConfig.apiPort || 8080;
const BOT_API_KEY = botConfig.authkey;

function botRequest(apiPath, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = require('http').request({
            host: BOT_API_HOST,
            port: BOT_API_PORT,
            path: apiPath,
            method,
            headers: {
                'key': BOT_API_KEY,
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            },
            timeout: 120000
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, json: JSON.parse(data) }); }
                catch (e) { resolve({ status: res.statusCode, json: { raw: data } }); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('bot api timeout')); });
        if (payload) req.write(payload);
        req.end();
    });
}

function errorPage(title, message) {
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + title + '</title></head>' +
        '<body style="background:#0d1117;color:#e6edf3;font-family:-apple-system,Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">' +
        '<div style="text-align:center;max-width:420px;padding:24px"><h1>' + title + '</h1><p style="color:#8b949e">' + message + '</p></div></body></html>';
}

function createPanelApp() {
    const app = express();
    app.disable('x-powered-by');
    app.use(express.json({ limit: '256kb' }));

    function requireAuth(req, res, next) {
        const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('panel_token='));
        if (!cookie) return res.status(401).json({ error: 'unauthorized' });
        try {
            jwt.verify(cookie.split('=')[1], panelConfig.secret);
            next();
        } catch (e) {
            return res.status(401).json({ error: 'unauthorized' });
        }
    }

    // ---- auth (rate-limited against brute force) ----
    const loginAttempts = new Map(); // ip -> [timestamps]
    app.post('/login', (req, res) => {
        const { password } = req.body || {};
        const ip = req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const attempts = (loginAttempts.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
        if (attempts.length >= 8) {
            return res.status(429).json({ error: 'Too many attempts, wait 10 minutes' });
        }
        if (String(password || '') !== panelConfig.password) {
            attempts.push(now);
            loginAttempts.set(ip, attempts);
            console.log(`[PANEL] Failed login from ${ip}`);
            return res.status(401).json({ error: 'Wrong password' });
        }
        loginAttempts.delete(ip);
        res.setHeader('Set-Cookie', `panel_token=${sign({ p: 1 })}; Max-Age=604800; HttpOnly; SameSite=Lax; Path=/`);
        res.json({ ok: true });
    });

    app.post('/logout', (req, res) => {
        res.setHeader('Set-Cookie', 'panel_token=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/');
        res.json({ ok: true });
    });

    // ==================== WEB PORTAL (license users) ====================

    // Discord OAuth (PKCE — no client secret needed). Verifies the user,
    // checks guild membership, then issues a web_token (NOT panel access).
    const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    app.get('/auth/discord', async (req, res) => {
        try {
            const code = req.query.code;

            // ---- Step 1: no code -> start the flow (PKCE) ----
            if (!code) {
                const state = require('crypto').randomBytes(16).toString('hex');
                const verifier = b64url(require('crypto').randomBytes(32));
                const challenge = b64url(require('crypto').createHash('sha256').update(verifier).digest());
                const opts = 'HttpOnly; SameSite=Lax; Path=/; Max-Age=600';
                res.setHeader('Set-Cookie', [`oauth_state=${state}; ${opts}`, `oauth_verifier=${verifier}; ${opts}`]);
                const url = 'https://discord.com/oauth2/authorize' +
                    `?client_id=${encodeURIComponent(webConfig.client_id)}` +
                    '&response_type=code' +
                    `&redirect_uri=${encodeURIComponent(webConfig.redirect_uri)}` +
                    '&scope=identify' +
                    `&state=${state}` +
                    `&code_challenge=${challenge}&code_challenge_method=S256`;
                return res.redirect(url);
            }

            // ---- Step 2: callback -> verify state, exchange code with verifier ----
            const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(s => s.trim()).filter(Boolean).map(s => [s.split('=')[0], s.split('=').slice(1).join('=')]));
            if (!req.query.state || req.query.state !== cookies.oauth_state || !cookies.oauth_verifier) {
                return res.status(400).send(errorPage('⚠️ Invalid state', 'Login session expired or corrupted. Go back and try again.'));
            }

            const tokenRes = await oauthTokenRequest({
                client_id: webConfig.client_id,
                ...(webConfig.client_secret ? { client_secret: webConfig.client_secret } : {}),
                grant_type: 'authorization_code',
                code,
                redirect_uri: webConfig.redirect_uri,
                code_verifier: cookies.oauth_verifier
            });
            if (!tokenRes.json || !tokenRes.json.access_token) {
                console.error('[WEB] OAuth token exchange failed:', JSON.stringify(tokenRes.json || {}).slice(0, 300));
                return res.status(401).send('Discord auth failed — try again.');
            }

            const me = await discordFetch('/api/users/@me', tokenRes.json.access_token);
            if (!me || !me.id) return res.status(401).send('Could not fetch Discord profile.');

            // Guild verification (optional): set require_guild=true to enforce support-server membership
            let inGuild = false;
            try {
                if (webConfig.require_guild) {
                    const member = await discordFetch(`/api/guilds/${webConfig.guild_id}/members/${me.id}`, webConfig.bot_token, 'Bot');
                    inGuild = !!member && !!member.user;
                } else {
                    inGuild = true;
                }
            } catch (e) { inGuild = !webConfig.require_guild; }
            if (!inGuild) {
                return res.status(403).send(errorPage('❌ Not in server', 'You must be a member of the support server to use this site. Join it and log in again.'));
            }

            // Everyone can log in and view the dashboard; without an active
            // license it renders read-only (controls disabled client-side AND
            // blocked server-side by requireWebLicense on every mutation).
            const access = await hasWebAccess(me.id);

            setWebToken(res, {
                id: me.id,
                username: me.username,
                avatar: me.avatar,
                owner: access.owner || false,
                licensed: !!access.ok,
                expired: !!access.expired,
                expiry: access.expiry
            });
            console.log(`[WEB] Login: ${me.username} (${me.id})${access.ok ? '' : ' — view-only (no license)'}`);
            res.redirect('/portal');
        } catch (e) {
            console.error('[WEB] OAuth error:', e);
            res.status(500).send('Auth error: ' + e.message);
        }
    });

    // Who am I (web session) — works with or without a license so the
    // dashboard can be previewed by everyone; `licensed` gates the controls.
    app.get('/api/web/me', requireWebAuth, async (req, res) => {
        const fresh = await hasWebAccess(req.webUser.id);
        res.json({
            id: req.webUser.id,
            username: req.webUser.username,
            avatar: req.webUser.avatar,
            owner: fresh.owner,
            licensed: !!fresh.ok,
            expired: !!fresh.expired,
            expiry: fresh.expiry || req.webUser.expiry || null
        });
    });

    // Web logout
    app.post('/api/web/logout', (req, res) => {
        res.setHeader('Set-Cookie', 'web_token=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/');
        res.json({ ok: true });
    });

    // Redeem a license key from the website: binds the key to the logged-in
    // Discord account and starts/extends the subscription. If the user already
    // has an active license, the new duration is stacked on top of it and the
    // old key is freed back into the pool.
    app.post('/api/web/redeem', requireWebAuth, async (req, res) => {
        try {
            const key = String((req.body || {}).license || '').trim();
            if (!key) return res.status(400).json({ error: 'Paste a license key' });

            const rows = await queryParams('SELECT duration FROM licenses WHERE license = ?', [key]);
            if (!rows.length) {
                const mine = await queryParams('SELECT license FROM usedLicenses WHERE user_id = ? AND license = ?', [req.webUser.id, key]);
                if (mine.length) return res.status(400).json({ error: 'That key is already active on your account' });
                return res.status(400).json({ error: 'Invalid or already-used license key' });
            }
            const days = parseFloat(rows[0].duration);
            if (isNaN(days) || days < 0) return res.status(400).json({ error: 'Key has an invalid duration — contact the owner' });

            const now = Date.now();
            const existing = await queryParams('SELECT license, expiry FROM usedLicenses WHERE user_id = ?', [req.webUser.id]);
            const base = (existing.length && parseInt(existing[0].expiry) > now) ? parseInt(existing[0].expiry) : now;
            if (existing.length && existing[0].license !== key) {
                await queryParams('DELETE FROM usedLicenses WHERE license = ?', [existing[0].license]);
            }
            const expiry = base + Math.round(days * 86400000);
            await queryParams('INSERT OR REPLACE INTO usedLicenses(license, user_id, expiry) VALUES (?, ?, ?)', [key, req.webUser.id, String(expiry)]);
            await queryParams('DELETE FROM licenses WHERE license = ?', [key]);

            console.log(`[WEB] ${req.webUser.username} redeemed ${key} (+${days}d, expires ${new Date(expiry).toISOString()})`);
            res.json({ ok: true, expiry });
        } catch (e) {
            console.error('[WEB] redeem error:', e.message);
            res.status(500).json({ error: e.message });
        }
    });

    // Current user's own license history (for the Purchase page)
    app.get('/api/web/mylicense', requireWebAuth, async (req, res) => {
        try {
            const rows = await queryParams('SELECT license, expiry FROM usedLicenses WHERE user_id = ?', [req.webUser.id]);
            res.json({ license: rows[0] || null });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // Purchase plans (editable in web-config.json -> "plans": [...], "support_link": url)
    const DEFAULT_PLANS = [
        { id: 'starter', name: 'Starter', price: '$4', period: '/ 7 days', tag: '', features: ['Unlimited ad-bots', 'Chat triggers (auto-DM)', 'Rotating proxies', 'Live console', '24/7 hosting'] },
        { id: 'pro', name: 'Pro', price: '$10', period: '/ 30 days', tag: 'POPULAR', features: ['Everything in Starter', 'Priority support', 'Custom proxy list', 'All future updates'] },
        { id: 'lifetime', name: 'Lifetime', price: '$30', period: '/ forever', tag: 'BEST VALUE', features: ['Everything in Pro', 'Never expires', 'Priority feature requests'] }
    ];
    app.get('/api/web/plans', (req, res) => {
        const support = webConfig.support_link || ('https://discord.com/users/' + webConfig.owner_id);
        res.json({ support, plans: (Array.isArray(webConfig.plans) && webConfig.plans.length) ? webConfig.plans : DEFAULT_PLANS });
    });

    // Web dashboard stats (safe subset of bot data)
    app.get('/api/web/stats', requireWebAuth, async (req, res) => {
        try {
            const userId = req.webUser.id;
            const my = await queryParams('SELECT license, expiry FROM usedLicenses WHERE user_id = ?', [userId]);
            let accountCount = [{ c: 0 }];
            try { accountCount = await queryParams('SELECT COUNT(*) AS c FROM accounts WHERE user_id = ?', [userId]); } catch (e) {}
            let sec = [];
            try { sec = await queryParams('SELECT * FROM secureconfig WHERE user_id = ?', [userId]); } catch (e) {}
            let myBots = [];
            try { myBots = await queryParams('SELECT botnumber, claimedamount, claimstreak FROM autosecure WHERE user_id = ?', [userId]); } catch (e) {}
            res.json({
                license: my[0] || null,
                accounts: accountCount[0] ? accountCount[0].c : 0,
                secureConfig: sec[0] || null,
                bots: myBots
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // ==================== WEB: adbot control (license holders) ====================
    // Everyone logged in can VIEW the dashboard (status is public to web users);
    // mutating anything requires an active license.
    function requireWebLicense(req, res, next) {
        hasWebAccess(req.webUser.id).then(fresh => {
            if (!fresh.ok) return res.status(403).json({ error: 'license ' + (fresh.expired ? 'expired' : 'missing'), needLicense: true });
            req.license = fresh;
            next();
        }).catch(() => res.status(500).json({ error: 'license check failed' }));
    }

    const webAdbotProxy = (to) => async (req, res) => {
        try {
            const r = await botRequest(to, 'POST', req.body || {});
            console.log(`[WEB] ${req.webUser.username} -> ${to}`);
            res.status(r.status).json(r.json);
        } catch (e) {
            res.status(502).json({ ok: false, error: e.message });
        }
    };

    app.get('/api/web/adbot/status', requireWebAuth, async (req, res) => {
        try {
            const r = await botRequest('/adbot/status');
            res.status(r.status).json(r.json);
        } catch (e) {
            res.status(502).json({ ok: false, error: e.message });
        }
    });
    app.post('/api/web/adbot/account', requireWebAuth, requireWebLicense, webAdbotProxy('/adbot/account'));
    app.post('/api/web/adbot/account/remove', requireWebAuth, requireWebLicense, webAdbotProxy('/adbot/account/remove'));
    app.post('/api/web/adbot/campaign', requireWebAuth, requireWebLicense, webAdbotProxy('/adbot/campaign'));
    app.post('/api/web/adbot/start', requireWebAuth, requireWebLicense, webAdbotProxy('/adbot/start'));
    app.post('/api/web/adbot/stop', requireWebAuth, requireWebLicense, webAdbotProxy('/adbot/stop'));
    // full process restart — picks up any code/config changes made on the VPS
    app.post('/api/web/adbot/restart', requireWebAuth, requireWebLicense, (req, res) => {
        console.log(`[WEB] ${req.webUser.username} -> restart autosecure`);
        execFile('/usr/bin/pm2', ['restart', 'autosecure'], { timeout: 30000 }, (err) => {
            if (err) return res.status(500).json({ ok: false, error: err.message });
            console.log('[WEB] autosecure restarted via portal');
            res.json({ ok: true });
        });
    });

    // ==================== OWNER: license management (via web login) ====================
    const webOwnerOnly = (req, res, next) => {
        if (!req.webUser || !req.webUser.owner) return res.status(403).json({ error: 'owner only' });
        next();
    };

    app.get('/api/web/licenses', requireWebAuth, webOwnerOnly, async (req, res) => {
        const avail = await queryParams('SELECT license, duration FROM licenses ORDER BY rowid DESC LIMIT 100');
        const used = await queryParams('SELECT license, user_id, expiry FROM usedLicenses ORDER BY rowid DESC LIMIT 100');
        res.json({ available: avail, used });
    });

    app.post('/api/web/licenses/create', requireWebAuth, webOwnerOnly, async (req, res) => {
        const { duration, count } = req.body || {};
        const days = parseFloat(duration);
        if (isNaN(days) || days <= 0) return res.status(400).json({ error: 'Invalid duration (days, e.g. 30)' });
        const n = Math.min(Math.max(parseInt(count) || 1, 1), 50);
        const created = [];
        for (let i = 0; i < n; i++) {
            const raw = require('crypto').randomBytes(16).toString('hex');
            const key = raw.slice(0, 8) + '-' + raw.slice(8, 16) + '-' + raw.slice(16, 24) + '-' + raw.slice(24, 32);
            await queryParams('INSERT INTO licenses(license, duration) VALUES (?, ?)', [key, String(days)]);
            created.push(key);
        }
        console.log(`[WEB] Owner created ${n} license(s) duration=${days}d`);
        res.json({ ok: true, created });
    });

    app.post('/api/web/licenses/delete', requireWebAuth, webOwnerOnly, async (req, res) => {
        const { license } = req.body || {};
        if (!license) return res.status(400).json({ error: 'license required' });
        await queryParams('DELETE FROM licenses WHERE license = ?', [license]);
        res.json({ ok: true });
    });

    app.post('/api/web/licenses/revoke', requireWebAuth, webOwnerOnly, async (req, res) => {
        const { license } = req.body || {};
        if (!license) return res.status(400).json({ error: 'license required' });
        await queryParams('DELETE FROM usedLicenses WHERE license = ?', [license]);
        console.log(`[WEB] Owner revoked license ${license}`);
        res.json({ ok: true });
    });

    // ---- proxied adbot API ----
    app.get('/api/status', requireAuth, async (req, res) => {
        try {
            const r = await botRequest('/adbot/status');
            res.status(r.status).json(r.json);
        } catch (e) {
            res.status(502).json({ ok: false, error: 'Bot API unreachable (' + e.message + ')' });
        }
    });

    const PROXY_POSTS = {
        '/api/account': '/adbot/account',
        '/api/account/remove': '/adbot/account/remove',
        '/api/campaign': '/adbot/campaign',
        '/api/start': '/adbot/start',
        '/api/stop': '/adbot/stop'
    };
    for (const [from, to] of Object.entries(PROXY_POSTS)) {
        app.post(from, requireAuth, async (req, res) => {
            try {
                const r = await botRequest(to, 'POST', req.body || {});
                res.status(r.status).json(r.json);
            } catch (e) {
                res.status(502).json({ ok: false, error: e.message });
            }
        });
    }

    // ---- bot process restart (pm2) ----
    app.post('/api/restart-bot', requireAuth, (req, res) => {
        execFile('/usr/bin/pm2', ['restart', 'autosecure'], { timeout: 30000 }, (err) => {
            if (err) return res.status(500).json({ ok: false, error: err.message });
            console.log('[PANEL] autosecure restarted via panel');
            res.json({ ok: true });
        });
    });

    app.use(express.static(path.join(__dirname, 'public')));
    app.get('/portal', (req, res) => res.sendFile(path.join(__dirname, 'public', 'portal.html')));
    app.use((req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

    return app;
}

module.exports = { createPanelApp, panelConfig };















