const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());

/* 0x API Proxy */
app.use('/api/0x', createProxyMiddleware({
    target: 'https://api.0x.org',
    changeOrigin: true,
    pathRewrite: { '^/api/0x': '' },
    onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('0x-api-key', '3a27b97e-023b-4979-8841-0808b98bd30e');
        proxyReq.setHeader('0x-version', 'v2');
        console.log(`🔄 proxy: ${req.method} ${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`✅ resp: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        console.error('❌ proxy err:', err.message);
        res.status(500).json({ error: 'proxy error', details: err.message });
    }
}));

app.use(express.static(__dirname));

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'MetaMask Swap server running normally',
        proxy: '0x API proxy integrated',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    console.log(`req from ${req.ip}`);
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server: http://localhost:${PORT}`);
    console.log('Open in browser');
});

process.on('SIGINT', () => {
    console.log('\nShutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nTerminated');
    process.exit(0);
});
