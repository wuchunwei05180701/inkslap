import React from 'react';
import ReactDOM from 'react-dom';
import reactToWebComponent from 'react-to-webcomponent';
import { Input, Button, Tooltip, message, Spin } from 'antd';
import { SendOutlined, CloseOutlined, SmileOutlined, SaveOutlined, LoadingOutlined } from '@ant-design/icons';
import { loadChatHistory, saveChatHistory } from './dialog';

// 獲取antd的樣式
const getAntdStyles = () => {
  const antdStyles = [];
  document.querySelectorAll('style').forEach(style => {
    if (style.innerHTML.includes('ant-') || style.innerHTML.includes('anticon-')) {
      antdStyles.push(style.innerHTML);
    }
  });
  return antdStyles.join('\n');
};

// 將CSS樣式轉換為字符串，以便在Web Component中使用
const styles = `
.chat-window-container {
  width: 350px;
  min-height: 500px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  transition: all 0.3s ease;
  position: fixed;
  right: 20px;
  bottom: 20px;
}

.chat-window-container.minimized {
  min-height: auto;
  bottom: 0;
}

.chat-header {
  background-color: #ff69b4;
  color: white;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.chat-header-left {
  display: flex;
  align-items: center;
}

.chat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #4169e1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.chat-title {
  font-weight: bold;
  margin: 0;
}

.chat-subtitle {
  font-size: 0.8rem;
  margin: 0;
  opacity: 0.9;
}

.chat-body {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  min-height: 300px;
  max-height: 350px;
  background-color: #f9f9f9;
}

.message {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

.message-time {
  font-size: 0.7rem;
  color: #999;
  align-self: flex-end;
  margin-top: 2px;
}

.user-message {
  align-items: flex-end;
}

.user-message .message-content {
  background-color: #e1f5fe;
  border-radius: 18px 18px 0 18px;
  padding: 10px 15px;
  max-width: 80%;
  align-self: flex-end;
}

.bot-message {
  align-items: flex-start;
}

.bot-message .message-content {
  background-color: white;
  border-radius: 18px 18px 18px 0;
  padding: 10px 15px;
  max-width: 80%;
  align-self: flex-start;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
}

.loading-text {
  margin-top: 8px;
  color: #666;
  font-size: 14px;
}

.chat-footer {
  padding: 10px;
  border-top: 1px solid #eee;
  background-color: white;
}

.chat-input {
  display: flex;
  align-items: center;
}

.option-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
  width: 100%;
}

.option-button {
  width: 100%;
  text-align: left;
  white-space: normal;
  height: auto;
  padding: 8px 15px;
  font-size: 14px;
}

.markdown-content {
  font-size: 14px;
  line-height: 1.5;
}

.markdown-content h1 {
  font-size: 1.5em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.markdown-content h2 {
  font-size: 1.3em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.markdown-content h3 {
  font-size: 1.1em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.markdown-content p {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.markdown-content ul, .markdown-content ol {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  padding-left: 1.5em;
}

.markdown-content li {
  margin-bottom: 0.25em;
}

.markdown-content code {
  background-color: #f0f0f0;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

.markdown-content pre {
  background-color: #f0f0f0;
  padding: 0.5em;
  border-radius: 5px;
  overflow-x: auto;
  margin: 0.5em 0;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
}

.markdown-content blockquote {
  border-left: 4px solid #ddd;
  padding-left: 1em;
  margin-left: 0;
  color: #666;
}

.markdown-content a {
  color: #0366d6;
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5em 0;
}

.markdown-content th, .markdown-content td {
  border: 1px solid #ddd;
  padding: 0.5em;
  text-align: left;
}

.markdown-content th {
  background-color: #f0f0f0;
}

/* 訂單摘要樣式 */
.order-summary-container {
  margin: 10px 0;
}

.order-summary-header h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
}

.order-summary-header p {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 14px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  background-color: #fafafa;
  transition: all 0.2s ease;
}

.order-card:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.order-id {
  font-weight: bold;
  color: #1890ff;
  font-size: 14px;
}

.order-date {
  color: #999;
  font-size: 12px;
}

.order-status {
  margin-bottom: 8px;
  font-size: 13px;
}

.order-details {
  font-size: 12px;
  color: #666;
}

.order-details p {
  margin: 2px 0;
}

/* 登入模態框樣式 */
.login-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.login-modal {
  background: white;
  border-radius: 8px;
  width: 300px;
  max-width: 90vw;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.login-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.login-modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.login-modal-content {
  padding: 20px;
}

.login-modal-content p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
}

.login-buttons {
  display: flex;
  gap: 10px;
}

/* 商品搜尋結果樣式 */
.product-search-container {
  margin: 10px 0;
}

.product-search-header h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
}

.product-search-header p {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 14px;
}

.products-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-card {
  display: flex;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  background-color: #fafafa;
  transition: all 0.2s ease;
}

.product-card:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.product-image {
  width: 60px;
  height: 60px;
  margin-right: 12px;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  background-color: #f0f0f0;
}

.product-info {
  flex: 1;
}

.product-name {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  line-height: 1.3;
}

.product-price {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: bold;
  color: #1890ff;
}

.product-category {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #52c41a;
  font-weight: 500;
}

.product-description {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.all-products-loaded, .no-products-message, .all-orders-loaded {
  margin-top: 15px;
  padding: 12px;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
  text-align: center;
}

.all-products-loaded p, .no-products-message p, .all-orders-loaded p {
  margin: 0 0 10px 0;
  color: #52c41a;
  font-size: 14px;
}

.product-actions, .order-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.no-products-message {
  background-color: #fff2e8;
  border-color: #ffbb96;
}

.no-products-message p {
  color: #fa8c16;
}

/* 搜尋提示樣式 */
.search-prompt-container {
  margin: 10px 0;
  padding: 12px;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
}

.search-prompt-container p {
  margin: 0;
  color: #52c41a;
  font-size: 14px;
}

/* 無搜尋結果樣式 */
.no-results-container {
  margin: 10px 0;
  padding: 12px;
  background-color: #fff2e8;
  border: 1px solid #ffbb96;
  border-radius: 6px;
  text-align: center;
}

.no-results-container p {
  margin: 0 0 15px 0;
  color: #fa8c16;
  font-size: 14px;
  line-height: 1.5;
}

.no-results-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* 商品搜尋結果底部按鈕樣式 */
.product-search-actions {
  margin-top: 15px;
  padding: 12px;
  background-color: #fafafa;
  border-radius: 6px;
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.all-products-loaded-message {
  margin-top: 10px;
  text-align: center;
}

.all-products-loaded-message p {
  margin: 0;
  color: #52c41a;
  font-size: 14px;
}

/* 商品搜尋相關回答樣式 */
.product-search-with-buttons {
  margin: 10px 0;
}

.product-search-with-buttons .markdown-content {
  margin-bottom: 15px;
}

/* 訂單操作容器樣式 */
.order-actions-container {
  margin-top: 15px;
  padding: 12px;
  background-color: #fafafa;
  border-radius: 6px;
}

.all-orders-loaded-message {
  margin-bottom: 10px;
  text-align: center;
}

.all-orders-loaded-message p {
  margin: 0;
  color: #52c41a;
  font-size: 14px;
}

.order-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* Inkslap 簡介樣式 */
.about-inkslap-container {
  margin: 10px 0;
  padding: 15px;
  background-color: #f0f8ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
}

.about-content {
  color: #1890ff;
  font-size: 14px;
  line-height: 1.6;
}

.about-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 15px;
}
`;

// 直接在Web Component中實現聊天窗口組件，避免CORS問題
const ChatWindowComponent = (props) => {
  // 從props中獲取屬性，如果沒有提供，則使用默認值
  const historyPath = props.historyPath || '/history.json';
  const apiUrl = props.apiUrl || '/api/chat';

  // 輸出 API URL，以便調試
  console.log('ChatWindowComponent props:', props);
  console.log('API URL:', apiUrl);
  console.log('History Path:', historyPath);
  const [chatHistory, setChatHistory] = React.useState([]);
  const [userInput, setUserInput] = React.useState('');
  const [showOptions, setShowOptions] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(true);
  const [isMinimized, setIsMinimized] = React.useState(false);

  // 登入狀態和訂單相關狀態
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [userOrders, setUserOrders] = React.useState([]);
  const messagesEndRef = React.useRef(null);

  const welcomeMessage = "嘿，歡迎來到 Inkslap！我是 Inky 😄，今天可以怎麼幫您呢？請問是需要協助關於客製化商品的部分，還是有其他需求呢？";

  // 商品解析函數 - 增強版，支援更多後端回應格式
  const parseProductInfo = (content) => {
    // 檢查是否包含產品信息的關鍵字
    const productKeywords = ['價格', '材質', '包', 'NT$', '推薦', '商品', '元', '規格', '尺寸', '分類', '筆', '杯', '帽'];
    const hasProductKeywords = productKeywords.some(keyword => content.includes(keyword));

    if (!hasProductKeywords) {
      return null;
    }

    const products = [];
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);

    // 方法1: 解析列表格式的 HTML
    console.log('嘗試解析 HTML 列表格式...');

    // 修復可能被截斷的 HTML 開頭
    let fixedContent = content;
    if (content.includes('ul>') && !content.includes('<ul>')) {
      fixedContent = '<' + content;
    }

    // 解析列表項目
    const listItemPattern = /<li[^>]*>(.*?)<\/li>/g;
    let itemMatch;

    while ((itemMatch = listItemPattern.exec(fixedContent)) !== null) {
      const itemContent = itemMatch[1];
      console.log('找到列表項目:', itemContent);

      // 提取商品名稱
      const nameMatch = itemContent.match(/<strong>([^<]+)<\/strong>/);
      if (!nameMatch) continue;

      const name = nameMatch[1].trim();

      // 提取價格 - 支援多種格式
      const pricePatterns = [
        /單價[：:\s]*NT\$(\d+(?:\.\d+)?)/,
        /價格[：:\s]*NT\$(\d+(?:\.\d+)?)/,
        /NT\$(\d+(?:\.\d+)?)/
      ];

      let price = '';
      for (const pattern of pricePatterns) {
        const priceMatch = itemContent.match(pattern);
        if (priceMatch) {
          price = `${priceMatch[1]}元`;
          break;
        }
      }

      // 提取描述信息（材質、規格等）
      let description = '';
      const descPatterns = [
        /材質[：:\s]*([^<\n]+)/,
        /規格[：:\s]*([^<\n]+)/,
        /尺寸[：:\s]*([^<\n]+)/
      ];

      const descParts = [];
      for (const pattern of descPatterns) {
        const descMatch = itemContent.match(pattern);
        if (descMatch) {
          descParts.push(descMatch[1].trim());
        }
      }
      description = descParts.join('，');

      if (name && price) {
        console.log('成功解析列表商品:', {
          name: name,
          price: price,
          desc: description
        });

        // 根據商品名稱推斷分類
        let category = '生活雜貨';
        if (name.includes('包') || name.includes('袋') || name.includes('箱')) {
          category = '包袋收納、生活雜貨';
        } else if (name.includes('筆') || name.includes('本')) {
          category = '文具、辦公用品';
        } else if (name.includes('杯') || name.includes('瓶')) {
          category = '杯瓶餐具、生活雜貨';
        } else if (name.includes('帽') || name.includes('衣')) {
          category = '衣物配件、生活雜貨';
        }

        products.push({
          name: name,
          price: price,
          category: category,
          description: description,
          image: null
        });
      }
    }

    console.log('HTML 列表解析結果:', products);

    // 方法2: 解析表格格式的 HTML
    if (products.length === 0) {
      console.log('嘗試解析 HTML 表格格式...');

      // 解析表格行
      const tableRowPattern = /<tr[^>]*>(.*?)<\/tr>/g;
      let rowMatch;
      let isFirstRow = true; // 跳過表頭

      while ((rowMatch = tableRowPattern.exec(content)) !== null) {
        const rowContent = rowMatch[1];
        console.log('找到表格行:', rowContent);

        // 跳過表頭行
        if (isFirstRow || rowContent.includes('<th>')) {
          isFirstRow = false;
          continue;
        }

        // 提取表格單元格
        const cellPattern = /<td[^>]*>(.*?)<\/td>/g;
        const cells = [];
        let cellMatch;

        while ((cellMatch = cellPattern.exec(rowContent)) !== null) {
          cells.push(cellMatch[1].trim());
        }

        console.log('表格單元格:', cells);

        // 確保有足夠的單元格（商品名稱、價格、描述）
        if (cells.length >= 3) {
          const name = cells[0].trim();
          const priceText = cells[1].trim();
          const description = cells[2].trim();

          // 提取價格數字 - 支援多種格式
          let price = priceText;
          const priceMatch = priceText.match(/(\d+(?:\.\d+)?)元?/);
          if (priceMatch) {
            price = `${priceMatch[1]}元`;
          }

          console.log('成功解析表格商品:', {
            name: name,
            price: price,
            desc: description
          });

          // 根據商品名稱推斷分類
          let category = '生活雜貨';
          if (name.includes('包') || name.includes('袋') || name.includes('箱')) {
            category = '包袋收納、生活雜貨';
          } else if (name.includes('筆') || name.includes('本')) {
            category = '文具、辦公用品';
          } else if (name.includes('杯') || name.includes('瓶')) {
            category = '杯瓶餐具、生活雜貨';
          } else if (name.includes('帽') || name.includes('衣')) {
            category = '衣物配件、生活雜貨';
          }

          products.push({
            name: name,
            price: price,
            category: category,
            description: description,
            image: null
          });
        }
      }

      console.log('HTML 表格解析結果:', products);
    }

    return products.length > 0 ? products : null;
  };

  // 提取搜尋關鍵字
  const extractSearchKeyword = (userInput, botResponse) => {
    const keywords = ['包裝', '收納', '馬克杯', '筆記本', '帆布袋', '滑鼠墊', 'USB', '書籤'];
    for (const keyword of keywords) {
      if (userInput.includes(keyword) || botResponse.includes(keyword)) {
        return keyword;
      }
    }
    return '商品';
  };

  // 模擬訂單數據
  const mockOrders = [
    {
      id: '202506010002',
      date: '2025/06/01',
      status: '處理中',
      statusColor: '#1890ff',
      customerName: '陳同學',
      paymentMethod: '信用卡',
      totalAmount: 152600,
      items: [
        { name: '客製化馬克杯', quantity: 100, unitPrice: 280 },
        { name: '環保帆布袋', quantity: 200, unitPrice: 460 }
      ]
    },
    {
      id: '202506010003',
      date: '2025/06/01',
      status: '處理中',
      statusColor: '#1890ff',
      customerName: '陳同學',
      paymentMethod: '轉帳',
      totalAmount: 164600,
      items: [
        { name: '客製化筆記本', quantity: 150, unitPrice: 320 },
        { name: '金屬書籤', quantity: 300, unitPrice: 380 }
      ]
    },
    {
      id: '202505050009',
      date: '2025/05/05',
      status: '已完成',
      statusColor: '#28a745',
      customerName: '陳同學',
      paymentMethod: '信用卡',
      totalAmount: 178500,
      items: [
        { name: '客製化滑鼠墊', quantity: 300, unitPrice: 85 },
        { name: 'USB隨身碟', quantity: 150, unitPrice: 890 }
      ]
    },
    {
      id: '202504300010',
      date: '2025/04/30',
      status: '已完成',
      statusColor: '#28a745',
      customerName: '陳同學',
      paymentMethod: '轉帳',
      totalAmount: 98700,
      items: [
        { name: '客製化貼紙', quantity: 1000, unitPrice: 35 },
        { name: '環保購物袋', quantity: 200, unitPrice: 320 }
      ]
    },
    {
      id: '202504150011',
      date: '2025/04/15',
      status: '已完成',
      statusColor: '#28a745',
      customerName: '陳同學',
      paymentMethod: '信用卡',
      totalAmount: 156000,
      items: [
        { name: '客製化保溫杯', quantity: 120, unitPrice: 450 },
        { name: '無線充電盤', quantity: 80, unitPrice: 750 }
      ]
    },
    {
      id: '202503280012',
      date: '2025/03/28',
      status: '已完成',
      statusColor: '#28a745',
      customerName: '陳同學',
      paymentMethod: '轉帳',
      totalAmount: 89400,
      items: [
        { name: '客製化鑰匙圈', quantity: 500, unitPrice: 65 },
        { name: '手機支架', quantity: 150, unitPrice: 380 }
      ]
    }
  ];

  const options = [
    { key: 'gift', text: '尋找贈品', response: '請問您的送禮需求是什麼？（如送禮目的、數量、預算）' },
    { key: 'order', text: '查詢訂單', response: '想查詢甚麼訂單？' },
    {
      key: 'about',
      text: '了解 Inkslap 禮贈平台',
      response: `您好，Inkslap 是一個專注於禮贈品的平台，提供多樣化的商品選擇和客製化服務。我們的特色包括：

正版授權：平台上的所有品牌與肖像均為官方正版授權，確保您購買的商品具有合法性與品質保障。

多樣化商品：我們提供各類型的禮贈品，並可依據您的需求進行客製化設計。

客製化服務：收費會依據會員等級、商品類型、客製化程度及數量等因素而有所不同。

售後服務：雖然目前未提供保固和維修，但如遇到任何問題，我們將協助您處理。

若您有任何疑問或需進一步的協助，請隨時告訴我！😊`
    }
  ];

  React.useEffect(() => {
    const initChat = async () => {
      const history = await loadChatHistory(historyPath);
      if (history && history.length > 0) {
        setChatHistory(history.map(msg => ({
          ...msg,
          time: msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));
      } else {
        const initialMessage = {
          role: 'assistant',
          content: welcomeMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory([initialMessage]);
        await saveChatHistory([{ role: 'assistant', content: welcomeMessage }], historyPath);
      }
    };
    initChat();
  }, []);

  React.useEffect(() => {
    if (chatHistory.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleInputChange = (e) => setUserInput(e.target.value);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessage = {
      role: 'user',
      content: userInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setUserInput('');
    setShowOptions(false);
    setLoading(true);

    try {
      const apiChatHistory = updatedHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const botMessage = {
        role: 'assistant',
        content: '正在查詢中，請稍等...',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLoading: true
      };
      setChatHistory(prev => [...prev, botMessage]);

      // 使用配置的 API URL

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          user_query: userInput,
          chat_history: [...apiChatHistory, { role: 'user', content: userInput }]
        })
      });

      if (!response.ok) {
        throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let responseContent = '';
      let cleanedContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.includes('done') || line.trim() === 'data: done') continue;

            if (line.startsWith('data: ')) {
              const data = line.substring(6).trim();
              if (data && !data.includes('done')) {
                responseContent += data;
                cleanedContent += data.replace(/data:\s*/g, '');
                // 不再即時更新界面，等待完整回應
              }
            }
          }
        }
      } catch (error) {
        throw error;
      }

      cleanedContent = cleanedContent.replace(/done$/g, '').trim();

      // 檢查回應內容是否包含商品信息，如果是則標準化處理
      const finalMessage = {
        role: 'assistant',
        content: cleanedContent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLoading: false
      };

      // 檢查是否為商品搜尋結果
      console.log('解析商品信息，回應內容:', cleanedContent);
      const products = parseProductInfo(cleanedContent);
      console.log('解析到的商品:', products);

      // 檢查是否為商品搜尋相關的關鍵字
      const isGiftSearchKeyword = userInput.includes('包') || userInput.includes('收納') || userInput.includes('禮品') ||
                                 userInput.includes('贈品') || userInput.includes('辦公') || userInput.includes('生活') ||
                                 userInput.includes('馬克杯') || userInput.includes('筆記本') || userInput.includes('帆布袋') ||
                                 userInput.includes('文具') || userInput.includes('用品') || userInput.includes('小物');

      if (products && products.length > 0) {
        console.log('設置為商品搜尋結果');
        finalMessage.isProductSearch = true;

        // 為每個商品添加 ID 和圖片
        const productsWithId = products.map((product, index) => ({
          ...product,
          id: `product_${Date.now()}_${index}`,
          image: product.image || '/api/placeholder/150/150'
        }));

        finalMessage.productData = {
          totalProducts: productsWithId,
          displayedCount: Math.min(3, productsWithId.length), // 預設顯示前3筆商品
          searchKeyword: extractSearchKeyword(userInput, cleanedContent)
        };
        // 修改顯示內容，添加搜尋結果提示
        finalMessage.content = `以下是符合您需求的推薦商品：`;
      } else if (isGiftSearchKeyword && (
        cleanedContent.includes('找不到') || cleanedContent.includes('沒有') || cleanedContent.includes('無法') ||
        cleanedContent.includes('抱歉') || cleanedContent.includes('很遺憾') || cleanedContent.includes('無結果') ||
        cleanedContent.includes('不存在') || cleanedContent.includes('查無')
      )) {
        // 明確的無搜尋結果情況
        console.log('檢測到無搜尋結果');
        finalMessage.isNoResults = true;
        finalMessage.searchKeyword = userInput;
        finalMessage.content = `抱歉，找不到符合「${userInput}」的贈品😢\n可以試試其他關鍵字，例如「生活用品」、「療癒系」、「科技感」等～`;
      }

      const finalHistory = [...updatedHistory, finalMessage];
      setChatHistory(finalHistory);

      try {
        await saveChatHistory(finalHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })), historyPath);
      } catch (saveError) {
        pass; // 保存失敗時不做任何操作
      }
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: '抱歉，發生了一些錯誤。請稍後再試。',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLoading: false
      };
      const errorHistory = [...updatedHistory, errorMessage];
      setChatHistory(errorHistory);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = async (option) => {
    const userMessage = {
      role: 'user',
      content: option.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 特殊處理查詢訂單
    if (option.key === 'order') {
      // 檢查登入狀態
      if (!isLoggedIn) {
        const loginPromptMessage = {
          role: 'assistant',
          content: '請先登入以查看您的訂單資訊',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isLoginPrompt: true
        };
        const updatedHistory = [...chatHistory, userMessage, loginPromptMessage];
        setChatHistory(updatedHistory);
        setShowOptions(false);
        setShowLoginModal(true);
        await saveChatHistory(updatedHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })), historyPath);
        return;
      }

      // 已登入，顯示訂單摘要
      const orderSummaryMessage = {
        role: 'assistant',
        content: '以下是您最近的訂單記錄：',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOrderSummary: true,
        orderData: {
          orders: mockOrders.slice(0, 3), // 顯示最多3筆訂單
          displayedCount: Math.min(3, mockOrders.length),
          hasMore: mockOrders.length > 3,
          allLoaded: mockOrders.length <= 3
        }
      };
      const updatedHistory = [...chatHistory, userMessage, orderSummaryMessage];
      setChatHistory(updatedHistory);
      setShowOptions(false);
      await saveChatHistory(updatedHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })), historyPath);
      return;
    }

    // 特殊處理了解 Inkslap
    if (option.key === 'about') {
      const aboutMessage = {
        role: 'assistant',
        content: option.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAboutInkslap: true
      };
      const updatedHistory = [...chatHistory, userMessage, aboutMessage];
      setChatHistory(updatedHistory);
      setShowOptions(false);
      await saveChatHistory(updatedHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })), historyPath);
      return;
    }

    // 其他選項的預設處理
    const botMessage = {
      role: 'assistant',
      content: option.response,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLoading: false
    };
    const updatedHistory = [...chatHistory, userMessage, botMessage];
    setChatHistory(updatedHistory);
    setShowOptions(false);
    await saveChatHistory(updatedHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })), historyPath);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  // 處理登入
  const handleLogin = async (credentials) => {
    try {
      setLoading(true);

      // 模擬 API 呼叫延遲
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 模擬登入成功
      setIsLoggedIn(true);
      setShowLoginModal(false);
      setUserOrders(mockOrders);

      // 登入成功後顯示訂單摘要
      const orderSummaryMessage = {
        role: 'assistant',
        content: '登入成功！以下是您最近的訂單記錄：',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOrderSummary: true,
        orderData: {
          orders: mockOrders.slice(0, 3),
          displayedCount: Math.min(3, mockOrders.length),
          hasMore: mockOrders.length > 3,
          allLoaded: mockOrders.length <= 3
        }
      };

      setChatHistory(prev => [...prev, orderSummaryMessage]);
      await saveChatHistory([...chatHistory, orderSummaryMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      })), historyPath);

    } catch (error) {
      console.error('登入錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  // 處理查看更多商品
  const handleViewMoreProducts = (message) => {
    setChatHistory(prev => {
      const updatedHistory = [...prev];
      const messageIndex = updatedHistory.findIndex(msg => msg === message);

      if (messageIndex !== -1 && updatedHistory[messageIndex].isProductSearch) {
        const currentDisplayed = updatedHistory[messageIndex].productData.displayedCount || 3;
        const newDisplayedCount = Math.min(currentDisplayed + 3, updatedHistory[messageIndex].productData.totalProducts.length);

        updatedHistory[messageIndex] = {
          ...updatedHistory[messageIndex],
          productData: {
            ...updatedHistory[messageIndex].productData,
            displayedCount: newDisplayedCount
          }
        };
      }

      return updatedHistory;
    });
  };

  // 處理查看更多訂單
  const handleViewMoreOrders = (message) => {
    setChatHistory(prev => {
      const updatedHistory = [...prev];
      const messageIndex = updatedHistory.findIndex(msg => msg === message);

      if (messageIndex !== -1 && updatedHistory[messageIndex].isOrderSummary) {
        const currentDisplayed = updatedHistory[messageIndex].orderData.displayedCount || 3;
        const newDisplayedCount = Math.min(currentDisplayed + 3, mockOrders.length);
        const allLoaded = newDisplayedCount >= mockOrders.length;

        updatedHistory[messageIndex] = {
          ...updatedHistory[messageIndex],
          orderData: {
            ...updatedHistory[messageIndex].orderData,
            orders: mockOrders.slice(0, newDisplayedCount),
            displayedCount: newDisplayedCount,
            hasMore: !allLoaded,
            allLoaded: allLoaded
          }
        };
      }

      return updatedHistory;
    });
  };

  // 處理回到選單
  const handleBackToMenu = () => {
    setShowOptions(true);

    // 添加一個系統訊息
    const backToMenuMessage = {
      role: 'assistant',
      content: welcomeMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLoading: false
    };

    setChatHistory(prev => [...prev, backToMenuMessage]);
  };

  // 處理其他關鍵字搜尋
  const handleOtherKeywordSearch = () => {
    const searchPromptMessage = {
      role: 'assistant',
      content: '想找特定商品嗎？輸入關鍵字試試看吧 (例如：辦公小物、送男友、收納)',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSearchPrompt: true
    };

    setChatHistory(prev => [...prev, searchPromptMessage]);
    setShowOptions(false);
  };

  // 處理查看贈品推薦（跳到尋找贈品流程）
  const handleViewGiftRecommendations = () => {
    const giftInquiryMessage = {
      role: 'assistant',
      content: '請問您的送禮需求是什麼？（如送禮目的、數量、預算）',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLoading: false
    };

    setChatHistory(prev => [...prev, giftInquiryMessage]);
    setShowOptions(false);
  };

  // 處理查看所有商品
  const handleViewAllProducts = () => {
    // 導向所有商品頁面
    window.open('/products', '_blank');
  };

  const handleClose = () => setIsOpen(false);

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  const handleSaveChat = async () => {
    try {
      setLoading(true);
      await saveChatHistory(chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })), historyPath);
      message.success('對話記錄已保存到本地 JSON 文件');
    } catch (error) {
      pass; // 保存失敗時不做任何操作
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <React.Fragment>
      <style>{styles}</style>
      <style>{getAntdStyles()}</style>
      <div className={`chat-window-container ${isMinimized ? 'minimized' : ''}`}>
        <div className="chat-header" onClick={toggleMinimize}>
          <div className="chat-header-left">
            <div className="chat-avatar">
              <SmileOutlined style={{ color: 'white', fontSize: '20px' }} />
            </div>
            <div>
              <h3 className="chat-title">Chat bot</h3>
              <p className="chat-subtitle">Questions? We're here to help.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }} onClick={e => e.stopPropagation()}>
            <Tooltip title="保存對話記錄">
              <SaveOutlined onClick={handleSaveChat} style={{ cursor: 'pointer', marginRight: '8px' }} />
            </Tooltip>
            <CloseOutlined onClick={handleClose} style={{ cursor: 'pointer' }} />
          </div>
        </div>

        {!isMinimized && (
          <div className="chat-body">
            {chatHistory.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-content">
                  {message.isLoading ? (
                    <div className="loading-container">
                      <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                      <span className="loading-text">正在查詢中，請稍等...</span>
                    </div>
                  ) : message.isLoginPrompt ? (
                    <div>
                      <p>{message.content}</p>
                      <Button
                        type="primary"
                        onClick={() => setShowLoginModal(true)}
                        style={{ marginTop: '10px' }}
                      >
                        立即登入
                      </Button>
                    </div>
                  ) : message.isSearchPrompt ? (
                    <div className="search-prompt-container">
                      <p>{message.content}</p>
                    </div>
                  ) : message.isNoResults ? (
                    <div className="no-results-container">
                      <p style={{ whiteSpace: 'pre-line' }}>{message.content}</p>
                      <div className="no-results-actions">
                        <Button type="primary" style={{ marginRight: '10px' }} onClick={handleOtherKeywordSearch}>
                          其他關鍵字搜尋
                        </Button>
                        <Button onClick={handleBackToMenu}>
                          回主選單
                        </Button>
                      </div>
                    </div>
                  ) : message.isAboutInkslap ? (
                    <div className="about-inkslap-container">
                      <div
                        className="about-content"
                        style={{ whiteSpace: 'pre-line', marginBottom: '15px' }}
                      >
                        {message.content}
                      </div>
                      <div className="about-actions">
                        <Button type="primary" style={{ marginRight: '10px' }} onClick={handleViewAllProducts}>
                          查看所有商品
                        </Button>
                        <Button onClick={handleBackToMenu}>
                          回主選單
                        </Button>
                      </div>
                    </div>
                  ) : message.isOrderSummary ? (
                    <div className="order-summary-container">
                      <div className="order-summary-header">
                        <h3>查詢訂單</h3>
                        <p>{message.content}</p>
                      </div>
                      <div className="orders-list">
                        {message.orderData.orders.map((order, orderIndex) => (
                          <div key={order.id} className="order-card">
                            <div className="order-header">
                              <span className="order-id">#{order.id}</span>
                              <span className="order-date">{order.date}</span>
                            </div>
                            <div className="order-status">
                              <span style={{ color: order.statusColor }}>● {order.status}</span>
                            </div>
                            <div className="order-details">
                              <p>客戶：{order.customerName}</p>
                              <p>付款方式：{order.paymentMethod}</p>
                              <p>總金額：NT$ {order.totalAmount.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* 訂單操作按鈕區域 */}
                      <div className="order-actions-container">
                        {message.orderData.hasMore && (
                          <Button
                            type="link"
                            onClick={() => handleViewMoreOrders(message)}
                            style={{ marginBottom: '10px' }}
                          >
                            查看更多訂單
                          </Button>
                        )}

                        {/* 全部載入完成提示 */}
                        {message.orderData.allLoaded && message.orderData.orders.length > 3 && (
                          <div className="all-orders-loaded-message">
                            <p>✅ 已顯示全部訂單囉～</p>
                          </div>
                        )}

                        {/* 主要操作按鈕 - 始終顯示 */}
                        <div className="order-actions">
                          <Button type="primary" style={{ marginRight: '10px' }} onClick={handleViewGiftRecommendations}>
                            查看贈品推薦
                          </Button>
                          <Button onClick={handleBackToMenu}>
                            回主選單
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : message.isProductSearch ? (
                    <div className="product-search-container">
                      <div className="product-search-header">
                        <h3>商品推薦</h3>
                        <p>{message.content}</p>
                      </div>
                      <div className="products-grid">
                        {message.productData.totalProducts.slice(0, message.productData.displayedCount).map((product, productIndex) => (
                          <div key={product.id} className="product-card">
                            <div className="product-image">
                              <img src={product.image} alt={product.name} />
                            </div>
                            <div className="product-info">
                              <h4 className="product-name">{product.name}</h4>
                              <p className="product-price">{product.price}</p>
                              {product.category && (
                                <p className="product-category">分類：{product.category}</p>
                              )}
                              {product.description && (
                                <p className="product-description">{product.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* 商品搜尋結果底部按鈕 */}
                      <div className="product-search-actions">
                        {message.productData.displayedCount < message.productData.totalProducts.length && (
                          <Button
                            type="link"
                            onClick={() => handleViewMoreProducts(message)}
                            style={{ marginRight: '10px' }}
                          >
                            載入更多商品 ({message.productData.totalProducts.length - message.productData.displayedCount} 項)
                          </Button>
                        )}
                        <Button
                          type="primary"
                          style={{ marginRight: '10px' }}
                          onClick={handleOtherKeywordSearch}
                        >
                          其他關鍵字搜尋
                        </Button>
                        <Button onClick={handleBackToMenu}>
                          回主選單
                        </Button>
                      </div>

                      {/* 全部載入完成提示 */}
                      {message.productData.displayedCount >= message.productData.totalProducts.length && message.productData.totalProducts.length > 3 && (
                        <div className="all-products-loaded-message">
                          <p>✅ 已顯示全部商品囉～</p>
                        </div>
                      )}
                    </div>
                  ) : message.isProductSearchWithButtons ? (
                    <div className="product-search-with-buttons">
                      <div
                        className="markdown-content"
                        dangerouslySetInnerHTML={{ __html: message.content }}
                      />
                      {/* 商品搜尋相關回答的底部按鈕 */}
                      <div className="product-search-actions">
                        <Button
                          type="primary"
                          style={{ marginRight: '10px' }}
                          onClick={handleOtherKeywordSearch}
                        >
                          其他關鍵字搜尋
                        </Button>
                        <Button onClick={handleBackToMenu}>
                          回主選單
                        </Button>
                      </div>
                    </div>
                  ) : message.content.includes('data:') ? (
                    <div>
                      {message.content.split('data:').map((part, i) => {
                        if (i === 0) {
                          return part ? <span key={i}>{part}</span> : null;
                        }
                        if (part.includes('image/')) {
                          return (
                            <img
                              key={i}
                              src={`data:${part}`}
                              alt="圖片"
                              style={{ maxWidth: '100%', maxHeight: '200px', margin: '5px 0' }}
                            />
                          );
                        } else if (part.trim() === 'done') {
                          return null;
                        } else {
                          return <span key={i}>{part.trim()}</span>;
                        }
                      })}
                    </div>
                  ) : (
                    <div
                      className="markdown-content"
                      dangerouslySetInnerHTML={{ __html: message.content }}
                    />
                  )}
                </div>
                <div className="message-time">{message.time}</div>
              </div>
            ))}

            {showOptions && (
              <div className="option-buttons">
                {options.map(option => (
                  <Button
                    key={option.key}
                    type="primary"
                    className="option-button"
                    onClick={() => handleOptionClick(option)}
                  >
                    {option.text}
                  </Button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {!isMinimized && (
          <div className="chat-footer">
            <div className="chat-input">
              <Input
                placeholder="Ask anything..."
                value={userInput}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                disabled={loading}
                suffix={
                  <Tooltip title="Send">
                    <Button
                      type="text"
                      icon={<SendOutlined />}
                      onClick={handleSendMessage}
                      disabled={!userInput.trim() || loading}
                    />
                  </Tooltip>
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* 登入模態框 */}
      {showLoginModal && (
        <div className="login-modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <div className="login-modal-header">
              <h3>登入 Inkslap</h3>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setShowLoginModal(false)}
              />
            </div>
            <div className="login-modal-content">
              <p>請登入以查看您的訂單資訊</p>
              <div className="login-buttons">
                <Button
                  type="primary"
                  loading={loading}
                  onClick={() => handleLogin({})}
                  style={{ marginRight: '10px' }}
                >
                  {loading ? '登入中...' : '模擬登入'}
                </Button>
                <Button
                  disabled={loading}
                  onClick={() => setShowLoginModal(false)}
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

// 創建一個包裝組件，用於添加樣式和處理屬性
const ChatWindowWrapper = (props) => {
  // 使用 React.useEffect 來獲取屬性
  const [apiUrl, setApiUrl] = React.useState('/api/chat');
  const [historyPath, setHistoryPath] = React.useState('/history.json');

  React.useEffect(() => {
    // 查找當前的 chat-window-element
    const elements = document.querySelectorAll('chat-window-element');
    let targetElement = null;

    // 找到包含當前組件的元素
    for (const element of elements) {
      if (element.shadowRoot && element.shadowRoot.contains(props.container)) {
        targetElement = element;
        break;
      }
    }

    if (!targetElement && elements.length > 0) {
      targetElement = elements[0]; // 如果找不到，使用第一個
    }

    if (targetElement) {
      const newApiUrl = targetElement.getAttribute('api-url') || '/api/chat';
      const newHistoryPath = targetElement.getAttribute('history-path') || '/history.json';

      console.log('Found element:', targetElement);
      console.log('API URL from attribute:', newApiUrl);
      console.log('History Path from attribute:', newHistoryPath);

      setApiUrl(newApiUrl);
      setHistoryPath(newHistoryPath);
    }
  }, []);

  return <ChatWindowComponent {...props} historyPath={historyPath} apiUrl={apiUrl} />;
};

// 將React組件轉換為Web Component
const ChatWindowElement = reactToWebComponent(
  ChatWindowWrapper,
  React,
  ReactDOM,
  {
    shadow: 'open',
    props: {
      historyPath: {
        type: String,
        attribute: 'history-path'
      },
      apiUrl: {
        type: String,
        attribute: 'api-url'
      }
    }
  }
);

// 註冊Web Component (只有在尚未註冊時才註冊)
if (!customElements.get('chat-window-element')) {
  customElements.define('chat-window-element', ChatWindowElement);
}

export default ChatWindowElement;