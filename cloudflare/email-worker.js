// Cloudflare Email Worker — receives all inbound mail for the zone and delivers
// it to the autosecure /email-webhook over HTTPS (Cloudflare proxy -> nginx -> app).
// The origin VPS IP never appears in DNS or the mail path.
export default {
  async email(message, env, ctx) {
    const webhook = env.WEBHOOK_URL || "https://your-domain.com/email-webhook";
    try {
      const raw = await new Response(message.raw).text();
      const resp = await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "key": env.AUTH_KEY || "",
        },
        body: JSON.stringify({ raw: raw }),
      });
      if (!resp.ok) {
        console.log(`delivery failed ${message.from} -> ${message.to}: HTTP ${resp.status}`);
      }
    } catch (err) {
      console.error(`worker error ${message.from} -> ${message.to}: ${err}`);
    }
  },
};

