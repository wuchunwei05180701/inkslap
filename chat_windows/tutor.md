# 如何在網頁中使用聊天窗口 Web Component

要在您的網頁中使用聊天窗口 Web Component，請按照以下步驟操作：

## 1. 引入必要的依賴

在您的 HTML 頁面的 `<head>` 部分添加以下代碼，引入必要的依賴：

```html
<head>
  <!-- 引入 React 和 ReactDOM -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <!-- 引入 Ant Design 樣式 -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/antd/5.10.0/reset.css">
</head>
```

## 2. 添加聊天窗口元素

在您的 HTML 頁面的 `<body>` 部分添加聊天窗口元素：

```html
<body>
  <!-- 其他內容 -->
  
  <!-- 添加聊天窗口元素 -->
  <chat-window-element></chat-window-element>
  
  <!-- 引入聊天窗口 Web Component 腳本 -->
  <script src="https://bot.agatha-ai.com/flowise/6525e15a-af02-4503-a13d-237a25ab63f8/chat-window-element.js"></script>
</body>
```

## 3. 自定義配置（可選）

您可以通過添加屬性來自定義聊天窗口的行為：

### api-url

指定 API 端點。默認為 `https://bot.agatha-ai.com/16347ad1-56a3-45ff-950c-35bc259865d3/chat`。

```html
<chat-window-element 
  api-url="https://bot.agatha-ai.com/16347ad1-56a3-45ff-950c-35bc259865d3/chat">
</chat-window-element>
```

### history-path

指定聊天歷史的 JSON 文件路徑。默認為 `/history.json`。

```html
<chat-window-element 
  history-path="/custom-history.json">
</chat-window-element>
```

## 4. 在 React 應用中使用

如果您使用 React，可以這樣動態加載聊天窗口：

```jsx
import React, { useEffect } from 'react';

const YourComponent = () => {
  useEffect(() => {
    // 動態加載聊天窗口 Web Component
    const script = document.createElement('script');
    script.src = 'https://bot.agatha-ai.com/flowise/6525e15a-af02-4503-a13d-237a25ab63f8/chat-window-element.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      // 清理函數
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      {/* 其他內容 */}
      <chat-window-element></chat-window-element>
    </div>
  );
};

export default YourComponent;
```

## 5. 完整示例

以下是一個完整的示例，展示如何在網頁中使用聊天窗口 Web Component：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>聊天窗口示例</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/antd/5.10.0/reset.css">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
    
    h1 {
      color: #333;
    }
  </style>
</head>
<body>
  <h1>我的網站</h1>
  <p>這是一個示例網頁，展示如何使用聊天窗口 Web Component。</p>
  
  <!-- 使用聊天窗口 Web Component -->
  <chat-window-element></chat-window-element>
  
  <!-- 引入聊天窗口 Web Component 腳本 -->
  <script src="https://bot.agatha-ai.com/flowise/6525e15a-af02-4503-a13d-237a25ab63f8/chat-window-element.js"></script>
</body>
</html>
```

## 6. 注意事項

1. **CORS 問題**：Web Component 使用 CORS 代理來解決跨域問題。如果您的 API 已經支持 CORS，則不需要擔心這個問題。

2. **聊天歷史**：Web Component 會嘗試從指定的 `history-path` 加載聊天歷史。如果加載失敗，它會使用默認的歡迎消息。聊天歷史會保存在瀏覽器的 localStorage 中。

3. **樣式隔離**：Web Component 使用 Shadow DOM 來隔離樣式，這意味著外部樣式不會影響 Web Component 的內部樣式，反之亦然。

4. **依賴關係**：Web Component 依賴於 React、ReactDOM 和 Ant Design 的樣式。確保在使用 Web Component 之前已經加載了這些依賴。