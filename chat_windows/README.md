# 聊天框 Web Component

這是一個可重用的聊天框 Web Component，可以輕鬆集成到任何網頁中，無需依賴 React 或其他框架。

## 跨域使用 (CORS)

為了允許從不同域名引入和使用此 Web Component，我們提供了一個簡單的 Express 服務器，已配置好 CORS 設置。

### 啟動服務器

1. 安裝依賴：
```bash
npm install
```

2. 啟動服務器：
```bash
npm run serve
```

服務器將在 http://localhost:3000 上運行，並提供以下端點：
- `/chat-window.js` - Web Component 文件
- `/` - 示例頁面

### 從其他域名引入

在您的 HTML 頁面中，可以直接從服務器引入 Web Component：

```html
<script src="http://localhost:3000/chat-window.js"></script>
```

## 功能特點

- 完全獨立的 Web Component，可在任何網頁中使用
- 支持流式回應顯示
- 支持 Markdown 格式內容
- 支持圖片顯示
- 可最小化/最大化
- 預設選項按鈕
- 保存聊天記錄
- 自定義事件通知

## 安裝

1. 下載 `chat-window.js` 文件
2. 將文件引入到您的 HTML 頁面中

```html
<script src="path/to/chat-window.js"></script>
```

## 基本用法

在 HTML 中添加聊天框組件：

```html
<chat-window></chat-window>
```

### 示例

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>聊天框示例</title>
  <script src="chat-window.js"></script>
</head>
<body>
  <h1>我的網站</h1>
  
  <!-- 添加聊天框 -->
  <chat-window></chat-window>
</body>
</html>
```

## 自定義樣式

您可以通過 CSS 來自定義聊天框的外觀：

```css
chat-window {
  /* 自定義樣式示例 */
  --chat-primary-color: #4caf50;
  --chat-header-bg: #388e3c;
  --chat-user-bubble-bg: #e8f5e9;
  --chat-bot-bubble-bg: #ffffff;
}
```

## 事件監聽

聊天框組件會觸發以下自定義事件：

- `chat-closed`：當聊天框被關閉時觸發
- `chat-minimized`：當聊天框被最小化或最大化時觸發，事件詳情中包含 `isMinimized` 狀態

### 示例

```javascript
const chatWindow = document.querySelector('chat-window');

// 監聽關閉事件
chatWindow.addEventListener('chat-closed', () => {
  console.log('聊天框已關閉');
});

// 監聽最小化/最大化事件
chatWindow.addEventListener('chat-minimized', (event) => {
  console.log('聊天框狀態變更：', event.detail.isMinimized ? '最小化' : '最大化');
});
```

## API 端點配置

默認情況下，聊天框使用 Flowise API 端點。您可以通過 JavaScript 修改 API 端點：

```javascript
const chatWindow = document.querySelector('chat-window');
chatWindow.apiEndpoint = 'https://your-api-endpoint.com/chat';
```

## 後端整合

聊天框需要以下後端 API 端點：

1. `/local_chat_history` - GET 請求，用於加載聊天歷史
2. `/local_chat_history` - POST 請求，用於保存聊天歷史

您需要在後端實現這些端點，或者修改 Web Component 代碼以適應您的後端 API。

### 聊天歷史 API 格式

GET 響應格式：

```json
{
  "status": "success",
  "chat_history": [
    {
      "role": "assistant",
      "content": "您好，有什麼可以幫助您的嗎？"
    },
    {
      "role": "user",
      "content": "我想了解產品信息"
    }
  ]
}
```

POST 請求格式：

```json
{
  "chat_history": [
    {
      "role": "assistant",
      "content": "您好，有什麼可以幫助您的嗎？"
    },
    {
      "role": "user",
      "content": "我想了解產品信息"
    }
  ]
}
```

## 進階用法

### 程式化控制

您可以通過 JavaScript 來控制聊天框：

```javascript
const chatWindow = document.querySelector('chat-window');

// 隱藏聊天框
chatWindow.style.display = 'none';

// 顯示聊天框
chatWindow.style.display = 'block';

// 重置聊天框
const container = document.querySelector('.chat-container');
container.removeChild(chatWindow);
const newChat = document.createElement('chat-window');
container.appendChild(newChat);
```

## 瀏覽器兼容性

此 Web Component 使用現代 Web API，兼容以下瀏覽器：

- Chrome 67+
- Firefox 63+
- Safari 12.1+
- Edge 79+

## 許可證

MIT

## 跨域問題排查

如果您在使用 Web Component 時遇到跨域問題，請檢查以下幾點：

1. 確保服務器正在運行：`npm run serve`
2. 檢查控制台錯誤信息，查看是否有 CORS 相關錯誤
3. 如果您的網頁使用 HTTPS，而服務器使用 HTTP，某些瀏覽器可能會阻止混合內容
4. 如果您需要在生產環境中使用，建議將 Web Component 部署到支持 HTTPS 的服務器上

### 自定義 CORS 設置

如果您需要自定義 CORS 設置，可以修改 `server.js` 文件中的 CORS 配置：

```javascript
app.use(cors({
  origin: '*', // 可以改為特定域名，如 'https://yourwebsite.com'
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```