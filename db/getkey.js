const { queryParams } = require("./db"); 


async function haslifetimekey() {
  try {
    const lifetime = await queryParams("SELECT apikey, time FROM apikey WHERE id = ?", [2]);

   // console.log(`Lifetime: ${JSON.stringify(lifetime)}`)

    if (Array.isArray(lifetime) && lifetime.length > 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error checking lifetime API key:", error);
    return false; 
  }
}


async function getHypixelApiKey() {
    let key, timefromdbRaw;
    const hasLifetime = await haslifetimekey();
 
    if (hasLifetime) {
      const results2 = await queryParams("SELECT apikey, time FROM apikey WHERE id = ?", [2]);
      if (results2.length > 0) {
        key = results2[0].apikey;
        timefromdbRaw = results2[0].time;
      }
    }
 
    if (!key) {
      const results = await queryParams("SELECT apikey, time FROM apikey WHERE id = ?", [1]);
      if (results.length > 0) {
        key = results[0].apikey;
        timefromdbRaw = results[0].time;
      }
    }
    if (!key) {
        return null;
    }
    return key;
}

// All stored keys in preference order (lifetime id=2 first, monthly id=1 fallback)
async function getAllHypixelApiKeys() {
    const keys = [];
    for (const id of [2, 1]) {
        try {
            const rows = await queryParams("SELECT apikey FROM apikey WHERE id = ? AND apikey IS NOT NULL", [id]);
            if (Array.isArray(rows) && rows[0]?.apikey) keys.push(rows[0].apikey);
        } catch (_) {}
    }
    return keys;
}

module.exports = {
  getHypixelApiKey,
  getAllHypixelApiKeys,
  haslifetimekey
};

