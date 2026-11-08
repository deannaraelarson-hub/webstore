const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const filePath = path.join(process.cwd(), 'data.json');
    let data = [];
    
    if (fs.existsSync(filePath)) {
        try { data = JSON.parse(fs.readFileSync(filePath, 'utf8')); } 
        catch (e) { data = []; }
    }

    // Sort by newest first
    data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json(data);
}