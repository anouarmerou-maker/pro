
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import CryptoJS from 'crypto-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const SECRET_KEY = "krmzi-secure-vault-2025";

const loadLinks = () => {
    try {
        const paths = [
            path.join(process.cwd(), 'server', 'links.json'),
            path.join(__dirname, '..', 'server', 'links.json')
        ];
        for (const p of paths) {
            if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
        }
        return {};
    } catch (e) { return {}; }
};

const decryptEpisodeId = (encryptedData) => {
    try {
        const bytes = CryptoJS.AES.decrypt(decodeURIComponent(encryptedData), SECRET_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted.includes(':')) return null;
        const [episodeId, timestamp] = decrypted.split(':');
        return { episodeId, timestamp: parseInt(timestamp) };
    } catch (e) { return null; }
};

const obfuscate = (str) => {
    return Buffer.from(str).toString('base64').split('').reverse().join('');
}

app.get('/api/secure-embed/:encryptedId', (req, res) => {
    const { encryptedId } = req.params;
    const decrypted = decryptEpisodeId(encryptedId);
    
    if (!decrypted || (Date.now() - decrypted.timestamp > 30 * 60 * 1000)) {
        return res.status(403).send("Invalid/Expired Session");
    }
    
    const linksJson = loadLinks();
    const realUrl = linksJson[decrypted.episodeId];
    if (!realUrl) return res.status(404).send("Stream not found");

    const maskedUrl = obfuscate(realUrl);

    res.setHeader('Content-Type', 'text/html');
    res.send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <meta name="referrer" content="no-referrer">
            <style>
                body, html { margin:0; padding:0; height:100%; background:#000; overflow:hidden; font-family: sans-serif; }
                #host { width:100%; height:100%; display: flex; align-items: center; justify-content: center; position: relative; }
                #play-overlay { 
                    position: absolute; inset: 0; z-index: 100; 
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    background: radial-gradient(circle at center, rgba(229,9,20,0.15) 0%, transparent 70%), #050505;
                    cursor: pointer; transition: opacity 0.4s;
                }
                .play-btn {
                    width: 80px; height: 80px; background: #e50914; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 30px rgba(229,9,20,0.4); border: none; cursor: pointer;
                    transition: all 0.3s;
                }
                .play-btn:hover { transform: scale(1.1); box-shadow: 0 0 50px rgba(229,9,20,0.6); }
                .play-icon { width: 0; height: 0; border-top: 15px solid transparent; border-bottom: 15px solid transparent; border-left: 25px solid white; margin-left: 8px; }
                .loading-text { color: #555; font-size: 10px; margin-top: 20px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; }
                .hidden { opacity: 0; pointer-events: none; }
            </style>
        </head>
        <body oncontextmenu="return false;">
            <div id="host">
                <div id="play-overlay" onclick="initStream()">
                    <div class="play-btn"><div class="play-icon"></div></div>
                    <div class="loading-text">KRMZI SECURE STREAM</div>
                </div>
            </div>
            
            <script>
                const masked = "${maskedUrl}";
                let isInitialized = false;

                function initStream() {
                    if (isInitialized) return;
                    isInitialized = true;
                    
                    const overlay = document.getElementById('play-overlay');
                    overlay.classList.add('hidden');

                    const real = atob(masked.split('').reverse().join(''));
                    const host = document.getElementById('host');
                    const shadow = host.attachShadow({mode: 'closed'});
                    
                    const ifrm = document.createElement('iframe');
                    
                    // تزييف الخصائص لمنع السرقة البرمجية
                    Object.defineProperty(ifrm, 'src', {
                        get: function() { return '🔒 [PROTECTED-BY-KRMZI]'; },
                        set: function(v) { this.setAttribute('src', v); }
                    });

                    ifrm.src = real;
                    ifrm.style.width = '100%';
                    ifrm.style.height = '100%';
                    ifrm.style.border = 'none';
                    ifrm.setAttribute('allowfullscreen', 'true');
                    ifrm.setAttribute('referrerpolicy', 'no-referrer');
                    ifrm.setAttribute('allow', 'autoplay; fullscreen; encrypted-media');
                    
                    shadow.appendChild(ifrm);
                    
                    // تعطيل أدوات الفحص عند التشغيل فقط لعدم التأثير على الإعلانات مسبقاً
                    setInterval(function() {
                        const start = Date.now();
                        debugger; 
                        if (Date.now() - start > 100) {
                            document.body.innerHTML = "<div style='color:red;text-align:center;padding-top:20%;font-family:sans-serif;'><h1>SECURITY ALERT</h1>Access Denied by KRMZI SHIELD</div>";
                        }
                    }, 2000);
                }

                // مسح الكونسول دورياً
                setInterval(() => console.clear(), 3000);
            </script>
        </body>
        </html>
    `);
});

app.get('/api/watch', async (req, res) => {
    try {
        const { url } = req.query;
        const response = await axios.get(url, { headers: { 'Referer': 'https://krmzi.quest/' } });
        const match = response.data.match(/qesen\.net\/krmzi\?post=([a-zA-Z0-9+/=]+)/);
        if (match) {
            const data = JSON.parse(Buffer.from(decodeURIComponent(match[1]), 'base64').toString());
            res.json(data.servers.map(s => ({ name: s.name, link: s.id.startsWith('http') ? s.id : `https://krmzi.quest/play.php?vid=${s.id}` })));
        } else {
            res.json([{ name: 'Direct', link: url.replace('video.php', 'play.php') }]);
        }
    } catch (e) { res.status(500).json([]); }
});

export default app;
