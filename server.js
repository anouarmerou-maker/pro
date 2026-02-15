
import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';

const app = express();
app.use(cors());

// دالة تحويل المعرفات إلى روابط مشغلات
function resolveUrl(name, id) {
    const n = name.toLowerCase();
    if (n.includes('ok') || n.includes('arab')) return `https://ok.ru/videoembed/${id}`;
    if (n.includes('red') || n.includes('dood')) return `https://dood.li/e/${id}`;
    if (n.includes('estream')) return `https://embedstream.me/embed-${id}.html`;
    return id.startsWith('http') ? id : `https://krmzi.quest/play.php?vid=${id}`;
}

// جلب قائمة الحلقات من صفحة المسلسل
app.get('/api/series-episodes', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).send("Series URL required");

        const response = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://krmzi.quest/'
            }
        });
        
        const $ = cheerio.load(response.data);
        const episodes = [];

        $('a').each((i, el) => {
            const link = $(el).attr('href') || "";
            const text = $(el).text().trim();
            const vidMatch = link.match(/vid=([a-zA-Z0-9]+)/);
            
            if (vidMatch && (text.includes('حلقة') || text.match(/\d+/))) {
                const epNumMatch = text.match(/\d+/);
                episodes.push({
                    episode_num: epNumMatch ? epNumMatch[0] : (i + 1).toString(),
                    vid: vidMatch[1],
                    page_url: link.startsWith('http') ? link : `https://krmzi.quest/${link.startsWith('/') ? link.substring(1) : link}`,
                    title: text || `الحلقة ${epNumMatch ? epNumMatch[0] : i+1}`
                });
            }
        });

        const uniqueEps = Array.from(new Map(episodes.map(item => [item.vid, item])).values())
            .sort((a, b) => parseInt(a.episode_num) - parseInt(b.episode_num));

        res.json(uniqueEps);
    } catch (error) {
        res.status(500).json({ error: "Failed to scrape" });
    }
});

app.get('/api/watch', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).send("URL required");

        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
        });
        const html = response.data;
        
        const match = html.match(/qesen\.net\/krmzi\?post=([a-zA-Z0-9+/=]+)/);
        if (match) {
            const encodedData = decodeURIComponent(match[1]);
            const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
            const data = JSON.parse(decodedData);
            
            const servers = data.servers.map(s => ({
                name: s.name,
                link: resolveUrl(s.name, s.id)
            }));
            res.json(servers);
        } else {
            const $ = cheerio.load(html);
            const iframe = $('iframe').attr('src');
            if (iframe) {
                res.json([{ name: 'سيرفر افتراضي', link: iframe }]);
            } else {
                res.json([{ name: 'سيرفر مباشر', link: url.replace('video.php', 'play.php') }]);
            }
        }
    } catch (error) {
        res.status(500).json({ error: "Player error" });
    }
});

export default app;

if (process.env.NODE_ENV !== 'production' && import.meta.url === `file://${process.argv[1]}`) {
    app.listen(5000, () => console.log('🚀 API Running on 5000 (ESM Mode)'));
}
