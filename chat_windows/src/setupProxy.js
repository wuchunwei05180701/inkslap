const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

module.exports = function(app) {  
  app.use(bodyParser.json());

  const proxyConfig = {
    target: 'https://bot.agatha-ai.com/flowise/16347ad1-56a3-45ff-950c-35bc259865d3/',
    changeOrigin: true,
    secure: true,
    ws: false, // 禁用WebSocket代理，避免錯誤
    xfwd: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
      if (req.body) {
        // 確保請求體被正確處理
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // 設置CORS頭
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    },
    onError: (err, req, res) => {
      console.error('代理錯誤:', err);
      res.writeHead(500, {
        'Content-Type': 'text/plain',
      });
      res.end(`代理錯誤: ${err.message}`);
    }
  };

  const historyFilePath = path.join(__dirname, '..', 'history.json');
  
  app.get('/local_chat_history', (req, res) => {
    try {
      if (fs.existsSync(historyFilePath)) {
        const fileContent = fs.readFileSync(historyFilePath, 'utf8');
        
        const chatHistory = JSON.parse(fileContent);
        res.setHeader('Content-Type', 'application/json');
        res.json({ status: 'success', chat_history: chatHistory });
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.json({ status: 'success', chat_history: [] });
      }
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.json({ status: 'error', message: error.message, chat_history: [] });
    }
  });

  app.post('/local_chat_history', (req, res) => {
    try {
      const chatHistory = req.body.chat_history;
      if (!chatHistory) {
        res.setHeader('Content-Type', 'application/json');
        return res.json({ status: 'error', message: '沒有提供對話記錄' });
      }

      fs.writeFileSync(historyFilePath, JSON.stringify(chatHistory, null, 2), 'utf8');

      res.setHeader('Content-Type', 'application/json');
      res.json({ status: 'success' });
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.json({ status: 'error', message: error.message });
    }
  });

  app.use('/api/chat', createProxyMiddleware({
    ...proxyConfig,
    pathRewrite: {
      '^/api/chat': '/chat'
    }
  }));
  
};