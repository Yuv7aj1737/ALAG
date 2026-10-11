const { createCanvas, loadImage, registerFont } = require("canvas");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const path = require("path");
const fs = require("fs");
const shorten = require('short-number');
const getStats = require('./autosecure/utils/hypixelapi/getStats');
const { getNAME } = require('./autosecure/utils/hypixelapi/getNAME');
const getUUID = require('./autosecure/utils/hypixelapi/getUUID');
const { getHypixelApiKey } = require('./db/getkey');
// Test-only Hypixel API key (used only when no other key is configured)
const TEST_HYPIXEL_API_KEY = 'YOUR_HYPIXEL_API_KEY';

// Registrar fuente Poppins
try {
  const fontPath = path.join(__dirname, "assets", "fonts", "Poppins-Bold.ttf");
  if (fs.existsSync(fontPath)) {
    registerFont(fontPath, { family: "Poppins", weight: "bold" });
  }
} catch (e) {
  console.warn("Poppins font not found, using default Sans");
}

/* ============================
   GET SKIN RENDER (VISAGE)
   ============================ */
async function fetchSkinRender(uuid, username) {
  // Render 3D usando visage - intentar múltiples endpoints
  if (!uuid) {
    console.warn('[PROFILECARD] No UUID provided for skin fetch');
    return null;
  }

  const cleanUuid = uuid.replace(/-/g, '');
  
  // Intentar primero con full/512
  // Prefer crafatar/visage/mc-heads first. If they all fail, try the provided Spanish NameMC static fallbacks.
  const primaryEndpoints = [
    `https://crafatar.com/renders/body/${cleanUuid}?scale=10&overlay`,
    `https://crafatar.com/avatars/${cleanUuid}?size=512&overlay`,
    `https://crafatar.com/skins/${cleanUuid}`,
    `https://visage.surgeplay.com/full/512/${cleanUuid}`,
    `https://visage.surgeplay.com/full/${cleanUuid}`,
    `https://mc-heads.net/body/${cleanUuid}/512`,
    `https://mc-heads.net/avatar/${cleanUuid}/512`
  ];

  // Fallback UUIDs with nicer skins (avoid Steve/Alex/jeb_)
  const fallbackUUIDs = [
    'e3d34e5df2e3477aaf1f58e96b64c39a', // CaptainSparklez
    '6512461bfd814e329c3bfd90c9f16bbf'  // Stampy
  ];

  const esFallbacks = [
    `https://es.namemc.com/skin/a5891ab2f2e0c785`,
    `https://es.namemc.com/skin/a2d6527e2adbea46`,
    `https://es.namemc.com/skin/91d3620ad681f3f4`,
    `https://es.namemc.com/skin/94ce53f05cc7612c`
  ];

  const genericRenders = [
    `https://namemc.com/skin/${cleanUuid}`,
    `https://namemc.com/texture/${cleanUuid}`,
    `https://render.namemc.com/body/${username}`,
    `https://render.namemc.com/bust/${username}`
  ];

  const tried = [];

  async function fetchAndValidate(url) {
    tried.push(url);
    try {
      const res = await fetch(url, { timeout: 15000 });
      if (!(res && res.ok)) return null;
      const contentType = (res.headers && res.headers.get) ? res.headers.get('content-type') : (res.headers && res.headers['content-type']);
      const buf = await res.buffer().catch(err => { throw err; });
      const sig = buf && buf.slice ? buf.slice(0, 8).toString('hex') : '';
      const isPng = sig.startsWith('89504e47');
      const isJpeg = sig.startsWith('ffd8ff');

      if (contentType && /image/i.test(contentType)) {
        if (isPng || isJpeg) {
          console.log('[PROFILECARD] ✅ Skin fetched from:', url, 'content-type:', contentType);
          return buf;
        }
        console.warn('[PROFILECARD] Content-Type image but buffer signature not recognized for', url, 'sig:', sig);
        return null;
      }

      // Some providers return image bytes without proper content-type, accept by signature
      if (isPng || isJpeg) {
        console.log('[PROFILECARD] ✅ Image buffer fetched from (no image content-type):', url, 'sig:', sig);
        return buf;
      }

      console.warn('[PROFILECARD] Non-image response from', url, 'content-type:', contentType, 'sig:', sig);
      return null;
    } catch (e) {
      console.warn('[PROFILECARD] Network/error for', url, e && e.message ? e.message : e);
      return null;
    }
  }

  try {
    console.log('[PROFILECARD] Fetching skin for UUID:', cleanUuid);

    // 1) Try primary providers first
    for (const url of primaryEndpoints) {
      const buf = await fetchAndValidate(url);
      if (buf) return buf;
    }

    // 2) If primary providers failed for the user's UUID, try a few curated fallback UUIDs
    console.log('[PROFILECARD] Primary providers failed for user UUID — trying curated fallback UUIDs');
    for (const fbUuid of fallbackUUIDs) {
      // try the same primary endpoints but replace the uuid
      const fbClean = String(fbUuid).replace(/-/g, '');
      const fbEndpoints = [
        `https://crafatar.com/renders/body/${fbClean}?scale=10&overlay`,
        `https://crafatar.com/avatars/${fbClean}?size=512&overlay`,
        `https://crafatar.com/skins/${fbClean}`,
        `https://visage.surgeplay.com/full/512/${fbClean}`,
        `https://visage.surgeplay.com/full/${fbClean}`,
        `https://mc-heads.net/body/${fbClean}/512`,
        `https://mc-heads.net/avatar/${fbClean}/512`
      ];
      for (const url of fbEndpoints) {
        const buf = await fetchAndValidate(url);
        if (buf) return buf;
      }
    }

    // 3) If curated UUIDs failed, try the Spanish NameMC static fallbacks (random order)
    console.log('[PROFILECARD] Curated fallbacks failed — trying Spanish NameMC static fallbacks');
    const esOrder = esFallbacks.slice();
    for (let i = esOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [esOrder[i], esOrder[j]] = [esOrder[j], esOrder[i]];
    }
    for (const url of esOrder) {
      const buf = await fetchAndValidate(url);
      if (buf) return buf;
    }

    // 3) Finally try generic NameMC render URLs
    console.log('[PROFILECARD] Spanish fallbacks failed — trying generic NameMC renders');
    for (const url of genericRenders) {
      const buf = await fetchAndValidate(url);
      if (buf) return buf;
    }

    console.warn('[PROFILECARD] ⚠️ Could not fetch skin from any provider for UUID:', cleanUuid, 'tried:', tried);
    return null;
  } catch (e) {
    console.error('[PROFILECARD] Skin fetch error:', e && e.message ? e.message : e);
    return null;
  }
}

/* ============================
   GENERATE PROFILE CARD
   ============================ */
async function generateProfileCard({
  username = "Unknown",
  rank = undefined,
  uuid,
  backgroundUrl,
  networth = "N/A",
  skyblockLevel = "N/A",
  bedwarsStars = "N/A",
  networkLevel = "N/A",
  duelKDR = "N/A",
  duelWinstreak = "N/A",
  plusColor = "N/A",
  gifted = "N/A"
}) {
  // If HYPIXEL_API_KEY is available and a uuid was provided, try to fetch authoritative stats
  async function fetchHypixelPlayerData(uuid) {
    let key = process.env.HYPIXEL_API_KEY || null;
    try {
      if (!key) {
        key = await getHypixelApiKey();
      }
    } catch (e) {
      // ignore
    }
    // If there's still no key, fall back to the test key so we can run local tests
    if (!key) key = TEST_HYPIXEL_API_KEY;
    if (!key) return null;
    try {
      const cleanUuid = String(uuid).replace(/-/g, '');
      const res = await fetch(`https://api.hypixel.net/player?key=${encodeURIComponent(key)}&uuid=${encodeURIComponent(cleanUuid)}`, { timeout: 15000 });
      const json = await res.json();
      if (!json || !json.success || !json.player) return null;
      return json.player;
    } catch (e) {
      console.warn('Hypixel API fetch failed:', e.message || e);
      return null;
    }
  }

  function resolveRankFromPlayer(p) {
    if (!p) return undefined;
    if (p.rank && p.rank !== 'NORMAL') return p.rank;
    if (p.newPackageRank) return p.newPackageRank;
    if (p.monthlyPackageRank) return p.monthlyPackageRank;
    if (p.prefix) return p.prefix;
    return undefined;
  }

  function getNetworkLevelFromExp(exp) {
    if (!exp || isNaN(Number(exp))) return undefined;
    const e = Number(exp);
    const lvl = (Math.sqrt(2 * e + 30625) - 175) / 50;
    return Math.round(lvl * 10) / 10; // one decimal
  }

  async function enrichFromHypixel() {
    // If we don't have a uuid, try to resolve it from the provided username
    let resolvedUuid = uuid;
    if (!resolvedUuid && typeof username === 'string' && username.trim()) {
      try {
        const maybe = await getUUID(username.trim());
        if (maybe) resolvedUuid = maybe;
      } catch (e) {
        // ignore
      }
    }

    const p = resolvedUuid ? await fetchHypixelPlayerData(resolvedUuid) : null;
    // proceed even if `p` is null because aggregated `getStats` may still provide useful values
    const out = {};
    const r = resolveRankFromPlayer(p);
    if (r) out.rank = r;

    // Try to use internal getStats helper (which aggregates SkyBlock profile networth, duels, bedwars, etc.)
    try {
      let ign = username;
      if (!ign) {
        try {
          const nameFromUuid = await getNAME(String(uuid));
          if (nameFromUuid) ign = nameFromUuid;
        } catch (e) {}
      }

      if (ign) {
        const stats = await getStats(ign);
        if (stats) {
          // Networth: choose selected profile if available
          try {
            if (Array.isArray(stats.skyblock) && stats.skyblock.length > 0) {
              const profile = stats.skyblock.find(p => p.current === true) || stats.skyblock[0];
              if (profile && profile.networth !== undefined) out.networth = shorten(Number(profile.networth));
              if (profile && profile.levels !== undefined) out.skyblockLevel = String(profile.levels);
            }
          } catch (e) {}

          // Bedwars stars
          try {
            if (stats.bedwars && stats.bedwars.level !== undefined) out.bedwarsStars = String(stats.bedwars.level);
          } catch (e) {}

          // Network level
          try {
            if (stats.nwl !== undefined) out.networkLevel = stats.nwl;
          } catch (e) {}

          // Duels
          try {
            if (stats.duels) {
              if (stats.duels.KLRatio !== undefined) out.duelKDR = String(stats.duels.KLRatio);
              if (stats.duels.currentWinStreak !== undefined) out.duelWinstreak = stats.duels.currentWinStreak;
              else if (stats.duels.bestWinStreak !== undefined) out.duelWinstreak = stats.duels.bestWinStreak;
            }
          } catch (e) {}

          // plusColor and gifted from aggregated stats
          try {
            if (stats.color) out.plusColor = stats.color;
            if (stats.giftedranks !== undefined) out.gifted = Number(stats.giftedranks) > 0 ? "YES" : "NO";
          } catch (e) {}
        }
      }
    } catch (e) {
      // ignore getStats errors
    }
    
    // Only access p properties if p is not null
    if (p) {
      // network level
      if (p.networkExp) {
        const nl = getNetworkLevelFromExp(p.networkExp);
        if (nl !== undefined) out.networkLevel = nl;
      }
      // bedwars stars - try multiple paths
      try {
        const bw = (p.achievements && p.achievements.bedwars_level) || (p.stats && p.stats.Bedwars && (p.stats.Bedwars.level || p.stats.Bedwars['stars'] || p.stats.Bedwars['bedwars_level']));
        if (bw !== undefined) out.bedwarsStars = bw;
      } catch (e) {}
      // duels KDR and winstreak
      try {
        const du = p.stats && (p.stats.Duels || p.stats.Duels_2v2 || p.stats['Duels']);
        if (du) {
          // try to compute KDR
          const kills = du.kills || du.kills_solo || du.kills_ranked || du.kills_all || du.kills_total || 0;
          const deaths = du.deaths || du.deaths_solo || du.deaths_ranked || du.deaths_all || du.deaths_total || 0;
          if (deaths && deaths > 0) out.duelKDR = (kills / deaths).toFixed(2);
          else if (kills) out.duelKDR = String(kills);
          // winstreak
          if (du.winstreak !== undefined) out.duelWinstreak = du.winstreak;
          else if (du.current_winstreak !== undefined) out.duelWinstreak = du.current_winstreak;
        }
      } catch (e) {}

      // plus color - try multiple paths in mvpPlus object
      try {
        if (p.mvpPlus && p.mvpPlus.plusColor) {
          out.plusColor = p.mvpPlus.plusColor;
        } else if (p.plusColor) {
          out.plusColor = p.plusColor;
        }
      } catch (e) {}

      // gifted - check if MVP+ was gifted
      try {
        if (p.mvpPlus && p.mvpPlus.isGifted !== undefined) {
          out.gifted = p.mvpPlus.isGifted ? "YES" : "NO";
        } else if (p.isGifted !== undefined) {
          out.gifted = p.isGifted ? "YES" : "NO";
        }
      } catch (e) {}
    }

    // No debug file writing here

    // expose the resolved uuid so the caller can load the skin even when only username was passed
    out.uuidResolved = resolvedUuid;
    return out;
  }

  // Try to enrich incoming values from Hypixel when possible
  // prepare skinUuid variable in outer scope so it's available later
  let skinUuid = null;
  try {
    const enrichment = await enrichFromHypixel();
    if (typeof enrichment.rank !== 'undefined') rank = enrichment.rank;
    if (typeof enrichment.networkLevel !== 'undefined') networkLevel = enrichment.networkLevel;
    if (typeof enrichment.bedwarsStars !== 'undefined') bedwarsStars = enrichment.bedwarsStars;
    if (typeof enrichment.duelKDR !== 'undefined') duelKDR = enrichment.duelKDR;
    if (typeof enrichment.duelWinstreak !== 'undefined') duelWinstreak = enrichment.duelWinstreak;
    if (typeof enrichment.networth !== 'undefined') networth = enrichment.networth;
    if (typeof enrichment.skyblockLevel !== 'undefined') skyblockLevel = enrichment.skyblockLevel;
    if (typeof enrichment.plusColor !== 'undefined') plusColor = enrichment.plusColor;
    if (typeof enrichment.gifted !== 'undefined') gifted = enrichment.gifted;
    // use resolved uuid for skin rendering if available
    skinUuid = uuid || enrichment.uuidResolved || null;
  } catch (e) {
    // Ignore enrichment errors; keep provided values
    console.warn('Error enriching from Hypixel:', e.message || e);
  }
  // Si el username viene con un rango entre corchetes al inicio, extraerlo.
  if (!rank && typeof username === 'string') {
    const m = username.match(/^\s*\[([^\]]+)\]\s*(.*)$/);
    if (m) {
      rank = m[1];
      username = m[2] || username;
    }
  }

  // Mask username: show only first letter, last letter, and fill middle with asterisks
  function maskUsername(name) {
    if (!name || typeof name !== 'string') return name;
    if (name.length <= 2) return name; // Don't mask very short names
    if (name.length === 3) return name[0] + '*' + name[name.length - 1];
    // For longer names, use between 3 and 5 asterisks depending on length
    const asteriskCount = Math.min(5, Math.max(3, Math.floor(name.length / 3)));
    return name[0] + '*'.repeat(asteriskCount) + name[name.length - 1];
  }

  const displayUsername = maskUsername(username);

  // (debug logs removed)
  // Tamaño exacto de la referencia
  const width = 1000;
  const height = 600;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  /* ============================
     BACKGROUND (con paisaje aleatorio si no se especifica)
     ============================ */
  // Lista de paisajes de Unsplash - URLs con IDs válidos
  const landscapes = [
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1950&h=600&fit=crop", // playa sunset
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1950&h=600&fit=crop", // montañas
    "https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=1950&h=600&fit=crop", // bosque
    "https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=1950&h=600&fit=crop", // puesta de sol
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1950&h=600&fit=crop", // lago
    "https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=1950&h=600&fit=crop", // aurora
    "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1950&h=600&fit=crop", // desierto
    "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1950&h=600&fit=crop", // océano
    "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?w=1950&h=600&fit=crop", // city night skyline
    "https://images.unsplash.com/photo-1501785888041-66b5cb9f6b9f?w=1950&h=600&fit=crop", // canyon
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1950&h=600&fit=crop", // waterfall
    "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?w=1950&h=600&fit=crop", // snowy peaks
    "https://images.unsplash.com/photo-1470167290877-7d6d5c4f3f5f?w=1950&h=600&fit=crop", // lavender field
    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1950&h=600&fit=crop", // meadow sunrise
    "https://images.unsplash.com/photo-1501785888041-2c9b8d3e7b2b?w=1950&h=600&fit=crop", // milky way / night sky
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1950&h=600&fit=crop", // desert dunes
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1950&h=600&fit=crop", // cliffs by sea
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1950&h=600&fit=crop"  // autumn forest
  ];

  const selectedBackground = backgroundUrl || landscapes[Math.floor(Math.random() * landscapes.length)];
  let bg;
  try {
    bg = await loadImage(selectedBackground);
  } catch (e) {
    console.warn("Fallo al cargar paisaje, usando URL por defecto", e.message);
    bg = await loadImage("https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1950&h=600&fit=crop");
  }
  
  // Aplicar blur al fondo (downscale-upscale)
  const blurIntensity = 8;
  const smallW = Math.max(1, Math.round(width / blurIntensity));
  const smallH = Math.max(1, Math.round(height / blurIntensity));
  const blurCanvas = createCanvas(smallW, smallH);
  const blurCtx = blurCanvas.getContext('2d');
  blurCtx.drawImage(bg, 0, 0, smallW, smallH);
  ctx.drawImage(blurCanvas, 0, 0, width, height);

  // Vignette (oscuro en bordes)
  const vignette = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, 600);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

    /* TITLE will be drawn after the left panel so it can be aligned to the stats area */

  /* ============================
     RENDER SKIN (LEFT SIDE, CENTERED)
     ============================ */
  // Panel izquierdo fijo (basado en referencia) - definidos siempre
  const panelX = 30;
  const panelY = 60;
  const panelW = 350;
  const panelH = height - panelY - 60;

  // Dibujar panel izquierdo de fondo (glass)
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 20);
  ctx.fill();

  // Draw username centered above the stats area on the right with a glass background
  ctx.font = "bold 36px Poppins, Sans";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  const usernameX = panelX + panelW + Math.round((width - (panelX + panelW)) / 2);
  const usernameY = panelY + 12;

  // background box behind username (glass, same tone as cards)
  const rightAreaWidth = width - (panelX + panelW);
  const titleBgW = Math.min(Math.round(rightAreaWidth * 0.8), 520);
  const titleBgH = 56;
  const titleBgX = usernameX - Math.round(titleBgW / 2);
  const titleBgY = usernameY - Math.round(titleBgH / 2) - 6;

  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath();
  ctx.roundRect(titleBgX, titleBgY, titleBgW, titleBgH, 14);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(titleBgX, titleBgY, titleBgW, titleBgH, 14);
  ctx.stroke();

  // draw username on top along with colored rank badge to the left (uses `rank` param)

  // helper: map rank -> colored parts
  function getRankParts(r, dynamicPlusColor) {
    if (!r) return [];
    const R = String(r).toUpperCase();
    // known colors (approximate) - tweakable
    const colors = {
      'OWNER': '#FF3B3B',
      'ADMIN': '#FF3B3B',
      'MOD': '#00A2FF',
      'HELPER': '#00E676',
      'YOUTUBER': '#FF0000',
      'YT': '#FF0000',
      'VIP': '#55FF55',
      'VIP+': '#55FFAA',
      'MVP': '#1EB6FF',
      'MVP+_MAIN': '#1EB6FF', // MVP text color
      'MVP+_PLUS': '#FFB300'
    };

    if (R === 'MVP+' || R === 'MVP_PLUS' || R === 'MVPPLUS') {
      // Use dynamic plusColor from Hypixel API if available, otherwise use default
      const plusColorToUse = (dynamicPlusColor && dynamicPlusColor !== 'N/A' && dynamicPlusColor !== undefined) 
        ? dynamicPlusColor 
        : colors['MVP+_PLUS'];
      
      return [
        { text: '[', color: colors['MVP+_MAIN'] },
        { text: 'MVP', color: colors['MVP+_MAIN'] },
        { text: '+', color: plusColorToUse },
        { text: ']', color: colors['MVP+_MAIN'] },
        { text: ' ', color: '#FFFFFF' }
      ];
    }

    // default single-colored rank inside brackets
    const c = colors[R] || '#FFD166';
    return [
      { text: '[', color: c },
      { text: String(r), color: c },
      { text: ']', color: c },
      { text: ' ', color: '#FFFFFF' }
    ];
  }

  const rankParts = getRankParts(rank, plusColor);

  // fonts for rank and name
  const rankFont = "700 20px Poppins, Sans";
  const nameFont = "bold 28px Poppins, Sans";

  // measure widths
  let totalRankW = 0;
  ctx.font = rankFont;
  for (const p of rankParts) {
    totalRankW += ctx.measureText(p.text).width;
  }
  ctx.font = nameFont;
  const nameW = ctx.measureText(displayUsername).width;
  const combinedW = totalRankW + nameW;

  const startX = usernameX - Math.round(combinedW / 2);
  let cursorX = startX;

  // draw rank parts
  ctx.textBaseline = 'middle';
  ctx.font = rankFont;
  for (const p of rankParts) {
    ctx.fillStyle = p.color;
    ctx.textAlign = 'left';
    ctx.fillText(p.text, cursorX, usernameY);
    cursorX += ctx.measureText(p.text).width;
  }

  // draw name (masked)
  ctx.font = nameFont;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.fillText(displayUsername, cursorX, usernameY);

  // Try to render skin using either provided uuid or resolved one from enrichment
  const skinUuidToUse = (typeof skinUuid !== 'undefined') ? skinUuid : uuid;
  let skinBuffer = null;
  
  if (skinUuidToUse) {
    try {
      skinBuffer = await fetchSkinRender(skinUuidToUse, username);
    } catch (e) {
      console.error('[PROFILECARD] Error in skin fetch process:', e.message || e);
    }
  }
  
  if (skinBuffer) {
    try {
      const skinImage = await loadImage(skinBuffer);

      // Increase skin display size slightly (keeps fitting in left panel)
      const skinW = 320;
      const skinH = 320;
      // Panel izquierdo fijo (basado en referencia)
      const panelX = 30;
      const panelY = 60;
        const panelW = 350;
        const panelH = height - panelY - 60;

        const skinX = panelX + (panelW / 2) - (skinW / 2); // centrado en el panel izquierdo
        const skinY = panelY + Math.round((panelH - skinH) / 2);
        const cardRadius = 44;

        // Ajustes de padding para el fondo de la skin (hacerlo más alto)
        const skinPadX = 15; // padding horizontal (reduced to keep within panel)
        const skinPadY = 28; // padding vertical (adjusted)
        const bgX = skinX - skinPadX;
        const bgY = skinY - skinPadY;
        const bgW = skinW + skinPadX * 2;
        const bgH = skinH + skinPadY * 2;

        // Background sólido detrás de la skin
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.roundRect(bgX, bgY, bgW, bgH, cardRadius);
        ctx.fill();

        // GLASS CARD BACKGROUND DETRÁS DE LA SKIN
        ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        // Fondo glassmorphism
        ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
        ctx.beginPath();
        ctx.roundRect(bgX, bgY, bgW, bgH, cardRadius);
        ctx.fill();

        // Resetear sombra
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // Contorno glassmorphism
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(skinX - 10, skinY - 10, skinW + 20, skinH + 20, cardRadius);
        ctx.stroke();

        // Dibujar skin encima del fondo glass — mantener relación de aspecto
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        const imgW = skinImage.width || skinW;
        const imgH = skinImage.height || skinH;
        const scale = Math.min(skinW / imgW, skinH / imgH);
        const destW = Math.round(imgW * scale);
        const destH = Math.round(imgH * scale);
        const destX = Math.round(skinX + (skinW - destW) / 2);
        const destY = Math.round(skinY + (skinH - destH) / 2);
        ctx.drawImage(skinImage, destX, destY, destW, destH);
    } catch (e) {
      console.error("[PROFILECARD] Error rendering skin to canvas:", e.message || e);
      // Draw placeholder if image load fails
      drawSkinPlaceholder();
    }
  } else {
    // No skin buffer, draw placeholder
    console.warn('[PROFILECARD] No skin buffer available, drawing placeholder');
    drawSkinPlaceholder();
  }
  
  // Helper function to draw a placeholder when no skin is available
  function drawSkinPlaceholder() {
    const skinW = 320;
    const skinH = 320;
    const panelX = 30;
    const panelY = 60;
    const panelW = 350;
    const panelH = height - panelY - 60;
    const skinX = panelX + (panelW / 2) - (skinW / 2);
    const skinY = panelY + Math.round((panelH - skinH) / 2);
    const cardRadius = 44;
    const skinPadX = 15;
    const skinPadY = 28;
    const bgX = skinX - skinPadX;
    const bgY = skinY - skinPadY;
    const bgW = skinW + skinPadX * 2;
    const bgH = skinH + skinPadY * 2;

    // Background
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.roundRect(bgX, bgY, bgW, bgH, cardRadius);
    ctx.fill();

    // Glass background
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.beginPath();
    ctx.roundRect(bgX, bgY, bgW, bgH, cardRadius);
    ctx.fill();

    // Border
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(skinX - 10, skinY - 10, skinW + 20, skinH + 20, cardRadius);
    ctx.stroke();

    // Draw placeholder rectangle
    ctx.fillStyle = "rgba(100, 100, 100, 0.4)";
    ctx.fillRect(skinX, skinY, skinW, skinH);

    // Draw "No Skin" text
    ctx.fillStyle = "rgba(200, 200, 200, 0.6)";
    ctx.font = "bold 36px Poppins, Sans";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("No Skin", skinX + skinW / 2, skinY + skinH / 2);
  }

  /* ============================
     RIGHT SIDE STATS (2 columnas + última fila centrada)
     ============================ */
  // Debug: show resolved stat values used for rendering
  try {
    console.log('profileCard -> resolved stats:', { networth, skyblockLevel, bedwarsStars, networkLevel, duelKDR, duelWinstreak, plusColor, gifted });
  } catch (e) {}

  const stats = [
    ["Networth", networth, "#ffb300"],
    ["SkyBlock Level", skyblockLevel, "#42a5f5"],
    ["Bedwars Stars", bedwarsStars, "#ec407a"],
    ["Network Level", networkLevel, "#8e24aa"],
    ["Duel KDR", duelKDR, "#29b6f6"],
    ["Duel Winstreak", duelWinstreak, "#66bb6a"],
    ["Plus Color", plusColor, plusColor.includes("RED") ? "#e53935" : "#ffb300"],
    ["Gifted", gifted, gifted === "YES" ? "#66bb6a" : "#e53935"]
  ];

  // Dimensiones de las tarjetas (según referencia)
  const cardW = 260;
  const cardH = 65;
  const gapX = 16;
  const gapY = 16;

  // Área de stats centrada en la zona derecha (después del panel izquierdo)
  const statsAreaWidth = (cardW * 2) + gapX;
  const statsAreaAvailableX = width - (panelX + panelW) - 40; // margen derecho
  const statsStartX = panelX + panelW + Math.round((statsAreaAvailableX - statsAreaWidth) / 2) + 20;
  // Ajuste vertical global para bajar las tarjetas ligeramente
  const statsOffsetY = 36;
  const statsStartY = panelY + 10 + statsOffsetY;

  // Dibujar las primeras 6 stats en 3 filas x 2 columnas
  for (let i = 0; i < 6; i++) {
    const [label, value, color] = stats[i];
    const row = Math.floor(i / 2);
    const col = i % 2;

    const cardX = statsStartX + (col * (cardW + gapX));
    const cardY = statsStartY + (row * (cardH + gapY));
    const cardRadius = 16;

    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
    ctx.stroke();

    // Stack label above value (centered) to match reference
    const centerX = cardX + Math.round(cardW / 2);
    const labelY = cardY + 20;
    const valueY = cardY + 42;

    ctx.textBaseline = 'middle';

    ctx.font = "700 14px Poppins, Sans";
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(label, centerX, labelY);

    ctx.font = "700 22px Poppins, Sans";
    ctx.textAlign = 'center';
    ctx.fillStyle = "white";
    ctx.fillText(String(value), centerX, valueY);
  }

  // Últimas 2 stats: usar mismas columnas que las anteriores para mantener alineación
  const lastRowY = statsStartY + (3 * (cardH + gapY)) + 8;

  for (let i = 6; i < 8; i++) {
    const [label, value, color] = stats[i];
    const col = i - 6; // 0 o 1, same columns as above
    const cardX = statsStartX + (col * (cardW + gapX));
    const cardY = lastRowY;
    const cardRadius = 16;

    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
    ctx.stroke();

    // Stack label above value for last row as well (centered)
    const centerX = cardX + Math.round(cardW / 2);
    const labelY = cardY + 20;
    const valueY = cardY + 42;

    ctx.textBaseline = 'middle';

    ctx.font = "700 14px Poppins, Sans";
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(label, centerX, labelY);

    ctx.font = "700 22px Poppins, Sans";
    ctx.textAlign = 'center';
    ctx.fillStyle = "white";
    ctx.fillText(String(value), centerX, valueY);
  }

  /* ============================
     RETURN PNG BUFFER
     ============================ */
  return canvas.toBuffer("image/png");
}

module.exports = generateProfileCard;
