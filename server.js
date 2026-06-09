// ===== OnePlan - WebUntis Proxy Server =====

const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3001;

// Deine GitHub Pages URL hier eintragen (wird für CORS benötigt)
const ALLOWED_ORIGINS = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'https://iamera.github.io'
];

const server = http.createServer((req, res) => {
    const origin = req.headers.origin || '';
    const allowedOrigin = ALLOWED_ORIGINS.find(o => origin.startsWith(o)) ? origin : ALLOWED_ORIGINS[0];

    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    const targetUrl = reqUrl.searchParams.get('url');

    if (!targetUrl) {
        res.writeHead(400);
        res.end('Fehlender url Parameter');
        return;
    }

    if (!targetUrl.includes('webuntis.com')) {
        res.writeHead(403);
        res.end('Nur webuntis.com URLs erlaubt');
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        const parsed = new URL(targetUrl);
        const options = {
            hostname: parsed.hostname,
            path: parsed.pathname + parsed.search,
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'User-Agent': 'Mozilla/5.0'
            }
        };

        const proxyReq = https.request(options, proxyRes => {
            // Session-Cookie weiterleiten
            const cookies = proxyRes.headers['set-cookie'];
            if (cookies) {
                const cleaned = cookies.map(c => c.replace(/; secure/gi, '').replace(/; samesite=[^;]*/gi, ''));
                res.setHeader('Set-Cookie', cleaned);
            }
            res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
            proxyRes.pipe(res);
        });

        proxyReq.on('error', err => {
            console.error('Fehler:', err.message);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
        });

        if (body) proxyReq.write(body);
        proxyReq.end();
    });
});

server.listen(PORT, () => {
    console.log(`OnePlan Proxy läuft auf Port ${PORT}`);
});
