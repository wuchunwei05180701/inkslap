# Agatha AI 聊天機器人嵌入指南

## 🎯 您的網站資訊
- **主網站**: https://bot.agatha-ai.com/flowise/6525e15a-af02-4503-a13d-237a25ab63f8/
- **API 端點**: https://bot.agatha-ai.com/flowise/16347ad1-56a3-45ff-950c-35bc259865d3/chat

## 📁 需要上傳的文件

將以下文件上傳到您的網站根目錄或子目錄：

```
/chat-widget/
├── embed.html
├── inkslap-chat-widget.js
├── agatha-embed-guide.md
└── src/
    └── ChatWindowWebComponent.js
```

## 🚀 方法一：浮動聊天窗口（推薦）

在您想要顯示聊天機器人的頁面中，在 `</body>` 標籤前加入：

```html
<!-- Inkslap 聊天機器人 -->
<script>
    window.inkSlapChatConfig = {
        width: '400px',
        height: '600px',
        position: 'bottom-right',
        triggerButtonText: '💬 客服',
        triggerButtonColor: '#1890ff',
        iframeSrc: 'https://bot.agatha-ai.com/flowise/6525e15a-af02-4503-a13d-237a25ab63f8/chat-widget/embed.html'
    };
</script>
<script src="https://bot.agatha-ai.com/flowise/6525e15a-af02-4503-a13d-237a25ab63f8/chat-widget/inkslap-chat-widget.js"></script>
```

## 🖼️ 方法二：直接嵌入頁面

如果您想將聊天機器人直接嵌入到頁面內容中：

```html
<div style="width: 100%; height: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <iframe 
        src="https://bot.agatha-ai.com/flowise/6525e15a-af02-4503-a13d-237a25ab63f8/chat-widget/embed.html"
        width="100%"
        height="100%"
        frameborder="0"
        allow="microphone; camera">
    </iframe>
</div>
```

## 📱 方法三：替換現有聊天界面

如果您想完全替換現有的 Flowise 聊天界面，可以：

### 選項 A：重定向到新界面
在現有頁面加入重定向腳本：

```html
<script>
    // 自動重定向到新的聊天界面
    if (window.location.pathname.includes('6525e15a-af02-4503-a13d-237a25ab63f8')) {
        window.location.href = './chat-widget/embed.html';
    }
</script>
```

### 選項 B：隱藏原界面，顯示新界面
```html
<style>
    /* 隱藏原有的 Flowise 界面 */
    .flowise-container,
    #flowise-chatbot {
        display: none !important;
    }
</style>

<!-- 顯示新的聊天界面 -->
<div id="new-chat-container" style="width: 100%; height: 100vh;">
    <iframe 
        src="./chat-widget/embed.html"
        width="100%"
        height="100%"
        frameborder="0">
    </iframe>
</div>
```

## ⚙️ 自定義配置

您可以根據品牌需求自定義外觀：

```html
<script>
    window.inkSlapChatConfig = {
        // 基本設置
        width: '450px',
        height: '650px',
        position: 'bottom-right',
        
        // 觸發按鈕自定義
        triggerButtonText: '🤖 Agatha AI',
        triggerButtonColor: '#722ed1', // 紫色主題
        triggerButtonSize: '70px',
        
        // 路徑設置
        iframeSrc: 'https://bot.agatha-ai.com/flowise/6525e15a-af02-4503-a13d-237a25ab63f8/chat-widget/embed.html',
        
        // 自定義樣式
        customCSS: `
            .inkslap-chat-trigger {
                background: linear-gradient(45deg, #722ed1, #1890ff) !important;
                box-shadow: 0 4px 20px rgba(114, 46, 209, 0.3) !important;
            }
            .inkslap-chat-container {
                border: 2px solid #722ed1 !important;
            }
        `
    };
</script>
```

## 🔧 部署步驟

### 1. 準備文件
- 下載所有必要文件到本地
- 確認 `embed.html` 中的 API 端點正確

### 2. 上傳到服務器
```bash
# 使用 FTP、SFTP 或您的部署工具上傳文件到：
https://bot.agatha-ai.com/flowise/6525e15a-af02-4503-a13d-237a25ab63f8/chat-widget/
```

### 3. 測試功能
- 訪問 `https://bot.agatha-ai.com/flowise/6525e15a-af02-4503-a13d-237a25ab63f8/chat-widget/embed.html`
- 確認聊天功能正常
- 測試 API 連接

### 4. 嵌入到頁面
- 在目標頁面加入嵌入代碼
- 測試浮動窗口功能
- 檢查響應式設計

## 🌐 跨域設置

如果遇到跨域問題，可能需要在服務器配置 CORS：

```nginx
# Nginx 配置示例
location /chat-widget/ {
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type";
}
```

## 📊 使用統計

如果需要追蹤聊天機器人使用情況：

```javascript
// 在嵌入代碼中加入
window.addEventListener('message', function(event) {
    if (event.data.type === 'INKSLAP_CHAT_OPEN') {
        // Google Analytics 或其他統計工具
        gtag('event', 'chat_opened', {
            'event_category': 'engagement',
            'event_label': 'inkslap_chat'
        });
    }
});
```

## 🔍 故障排除

### 常見問題：

1. **聊天窗口無法載入**
   - 檢查文件路徑是否正確
   - 確認服務器支援 iframe

2. **API 連接失敗**
   - 驗證 API 端點是否可訪問
   - 檢查 CORS 設置

3. **樣式顯示異常**
   - 確認 CSS 文件載入完成
   - 檢查是否有樣式衝突

4. **移動設備顯示問題**
   - 確認 viewport meta 標籤
   - 測試響應式設計

## 📞 技術支援

如需協助，請提供：
- 錯誤訊息截圖
- 瀏覽器控制台日誌
- 使用的嵌入方法
- 測試環境資訊
