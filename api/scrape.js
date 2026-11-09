export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  let payload = {};
  try {
    const rawBody = req.body || "{}";
    payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
  } catch (e) {
    payload = {};
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const msg = `
🚗 *SleekFleet Alert*

📍 Source: \`${payload.source}\`
⏰ Time: \`${new Date().toISOString()}\`

📝 Data:
\`\`\`
${payload.data || "No data received"}
\`\`\`
    `.trim();

    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;

    if (tgToken && tgChatId) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
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
           console.error(`TG Error: ${response.status}`);
        } else {
           console.log("✅ Sent to Telegram");
        }
      } catch (err) {
        console.error("❌ TG Fetch Failed:", err.message);
      }
    }

    res.status(200).json({ success: true });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
