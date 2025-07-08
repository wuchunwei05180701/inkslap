import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Tooltip, message, Spin } from 'antd';
import { SendOutlined, CloseOutlined, SmileOutlined, SaveOutlined, LoadingOutlined, SearchOutlined, HomeOutlined } from '@ant-design/icons';
import { loadChatHistory, saveChatHistory } from './dialog';
import axios from 'axios';

// 產品卡片組件 - 左圖右文格式
const ProductCard = ({ product, onClick }) => {
  // 生成佔位圖片 URL - 使用線上服務
  const getPlaceholderImage = (productName) => {
    // 根據商品名稱生成不同顏色的佔位圖片
    const getImageConfig = (name) => {
      const configs = {
        '筆': { bg: 'e6e6fa', text: '4b0082', label: '筆類' },
        '杯': { bg: 'f0f8ff', text: '4682b4', label: '杯具' },
        '包': { bg: 'faf0e6', text: 'cd853f', label: '包袋' },
        '袋': { bg: 'ffefd5', text: 'daa520', label: '袋類' },
        '箱': { bg: 'f0f0f0', text: '696969', label: '收納' },
        '收納': { bg: 'e8f5e8', text: '2e7d32', label: '收納' },
        '帽': { bg: 'fff3e0', text: 'f57c00', label: '帽類' },
        '襪': { bg: 'fce4ec', text: 'c2185b', label: '襪類' },
        '傘': { bg: 'e3f2fd', text: '1976d2', label: '雨具' },
        '鏡': { bg: 'f3e5f5', text: '7b1fa2', label: '鏡子' },
        '便當': { bg: 'e8f5e8', text: '388e3c', label: '餐具' },
        '花瓶': { bg: 'fff8e1', text: 'f9a825', label: '花瓶' },
        '杯墊': { bg: 'efebe9', text: '5d4037', label: '杯墊' },
        '牙刷': { bg: 'e1f5fe', text: '0097a7', label: '牙刷' },
        '眼罩': { bg: 'f1f8e9', text: '689f38', label: '眼罩' }
      };

      // 精確匹配
      for (const [key, config] of Object.entries(configs)) {
        if (name.includes(key)) {
          return config;
        }
      }

      // 預設配置
      return { bg: 'f8f9fa', text: '6c757d', label: '商品' };
    };

    const config = getImageConfig(productName);
    const encodedLabel = encodeURIComponent(config.label);

    return `https://via.placeholder.com/100x100/${config.bg}/${config.text}?text=${encodedLabel}`;
  };

  // 獲取商品圖片 URL
  const getProductImageUrl = (product) => {
    // 如果有真實圖片檔名，未來可以構建完整 URL
    if (product.image) {
      // TODO: 當有圖片伺服器時，替換為真實 URL
      // return `https://your-image-server.com/products/${product.image}`;

      // 暫時仍使用佔位圖片，但可以根據檔名生成不同的圖片
      return getPlaceholderImage(product.name);
    }

    return getPlaceholderImage(product.name);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  return (
    <div className="product-card" onClick={handleCardClick}>
      <div className="product-image">
        <img
          src={getProductImageUrl(product)}
          alt={product.name}
          onError={(e) => {
            e.target.src = getPlaceholderImage(product.name);
          }}
        />
      </div>
      <div className="product-info">
        <h4 className="product-name">{product.name}</h4>
        <div className="product-price">價格：{product.price}</div>
        {product.category && (
          <div className="product-category">分類：{product.category}</div>
        )}
        {product.description && (
          <div className="product-description">{product.description}</div>
        )}
      </div>
    </div>
  );
};

// 訂單卡片組件
const OrderCard = ({ order, onClick }) => {
  const handleCardClick = () => {
    if (onClick) {
      onClick(order);
    }
  };

  return (
    <div className="order-card" onClick={handleCardClick}>
      <div className="order-header">
        <div className="order-date">{order.date}</div>
        <div className="order-status" style={{ color: order.statusColor }}>
          {order.status}
        </div>
      </div>
      <div className="order-content">
        <div className="order-id">{order.id}</div>
        <div className="order-details">
          <div className="order-customer">客戶：{order.customerName}</div>
          <div className="order-payment">{order.paymentMethod}</div>
          <div className="order-amount">付款金額：${order.totalAmount.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

// 提取搜尋關鍵字的函數
const extractSearchKeyword = (userInput, responseContent) => {
  // 從用戶輸入中提取關鍵字
  if (userInput) return userInput.trim();

  // 從回應內容中提取關鍵字
  const keywordMatch = responseContent.match(/「(.+?)」/);
  if (keywordMatch) return keywordMatch[1];

  return '';
};

// 解析產品信息的函數 - 增強版，支援更多後端回應格式
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
  // 格式: <ul><li><strong>商品名稱</strong><br>單價：NT$價格<br>材質：xxx</li></ul>
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

  // 方法3: 解析實際後端回應格式 (• 開頭的列表)
  if (products.length === 0) {
    let currentProduct = null;
    let isInProductSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 檢測產品區域開始
      if (line.includes('推薦') || line.includes('以下') || line.includes('商品') || line.includes('選擇') || line.includes('參考')) {
        isInProductSection = true;
        continue;
      }

      // 檢測產品標題 (• 開頭) - 支援價格在同一行的格式
      const productTitleWithPriceMatch = line.match(/^•\s*(.+?)-?NT\$(\d+(?:\.\d+)?)/);
      const productTitleMatch = line.match(/^•\s*(.+)$/);

      if (isInProductSection && productTitleWithPriceMatch) {
        // 保存前一個產品
        if (currentProduct && currentProduct.name) {
          products.push(currentProduct);
        }

        // 創建新產品（價格在同一行）
        currentProduct = {
          name: productTitleWithPriceMatch[1].trim(),
          price: `${productTitleWithPriceMatch[2]}元`,
          category: '',
          description: '',
          image: null
        };
      }
      else if (isInProductSection && productTitleMatch && !productTitleWithPriceMatch) {
        // 保存前一個產品
        if (currentProduct && currentProduct.name) {
          products.push(currentProduct);
        }

        // 創建新產品（價格在其他行）
        currentProduct = {
          name: productTitleMatch[1].trim(),
          price: '',
          category: '',
          description: '',
          image: null
        };
      }
      // 檢測價格信息（獨立行）
      else if (currentProduct && (line.includes('價格') || line.includes('NT$'))) {
        const priceMatch = line.match(/(?:價格[：:\s]*)?NT\$?(\d+(?:\.\d+)?)/);
        if (priceMatch) {
          currentProduct.price = `${priceMatch[1]}元`;
        }
      }
      // 檢測材質信息
      else if (currentProduct && line.includes('材質')) {
        const materialMatch = line.match(/材質[：:\s]*(.+)/);
        if (materialMatch) {
          currentProduct.description = materialMatch[1].trim();
        }
      }
      // 檢測規格信息
      else if (currentProduct && line.includes('規格')) {
        const specMatch = line.match(/規格[：:\s]*(.+)/);
        if (specMatch) {
          if (currentProduct.description) {
            currentProduct.description += `，${specMatch[1].trim()}`;
          } else {
            currentProduct.description = specMatch[1].trim();
          }
        }
      }
      // 檢測最小起訂量（用來推斷分類）
      else if (currentProduct && line.includes('最小起訂量')) {
        // 根據商品名稱推斷分類
        const name = currentProduct.name.toLowerCase();
        if (name.includes('包') || name.includes('袋')) {
          currentProduct.category = '包袋收納、生活雜貨';
        } else if (name.includes('筆') || name.includes('本')) {
          currentProduct.category = '文具、辦公用品';
        } else if (name.includes('杯') || name.includes('瓶')) {
          currentProduct.category = '杯瓶餐具、生活雜貨';
        } else if (name.includes('帽') || name.includes('衣')) {
          currentProduct.category = '衣物配件、生活雜貨';
        } else {
          currentProduct.category = '生活雜貨、配件飾品';
        }
      }
    }

    // 保存最後一個產品
    if (currentProduct && currentProduct.name) {
      products.push(currentProduct);
    }
  }

  // 方法2: 解析表格格式
  if (products.length === 0) {
    const tablePattern = /\|([^|]+)\|([^|]+)\|([^|]*)\|?/g;
    let tableMatch;
    let isFirstRow = true;

    while ((tableMatch = tablePattern.exec(content)) !== null) {
      if (isFirstRow || tableMatch[1].includes('---')) {
        isFirstRow = false;
        continue;
      }

      const name = tableMatch[1].trim();
      const price = tableMatch[2].trim();
      const description = tableMatch[3] ? tableMatch[3].trim() : '';

      if (name && price) {
        products.push({
          name: name,
          price: price.includes('元') ? price : `${price}元`,
          category: '包袋收納、配件商品、生活雜貨',
          description: description,
          image: null
        });
      }
    }
  }

  // 方法3: 智能提取產品名稱和價格
  if (products.length === 0) {
    const productPattern = /([^，。！？\n]*包[^，。！？\n]*)[，。]?\s*(?:價格[：:]?\s*)?(?:NT\$)?(\d+)\s*元?/g;
    let match;

    while ((match = productPattern.exec(content)) !== null) {
      const name = match[1].trim();
      const price = `${match[2]}元`;

      if (name.length > 2 && name.length < 20) { // 合理的產品名稱長度
        products.push({
          name: name,
          price: price,
          category: '包袋收納、配件商品、生活雜貨',
          description: '',
          image: null
        });
      }
    }
  }

  return products.length > 0 ? products : null;
};

const ChatWindow = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [showOptions, setShowOptions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('unknown'); // 'unknown', 'connected', 'disconnected'

  // 尋找贈品功能的狀態管理
  const [giftSearchState, setGiftSearchState] = useState({
    currentProducts: [], // 當前顯示的所有商品
    displayedCount: 3, // 當前顯示的商品數量
    totalProducts: [], // 搜尋結果的所有商品
    searchKeyword: '', // 當前搜尋關鍵字
    showLoadMore: false, // 是否顯示查看更多按鈕
    isSearchMode: false, // 是否處於搜尋模式
    searchPromptVisible: false // 是否顯示搜尋提示
  });

  // 登入狀態和訂單相關狀態
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [orderDisplayState, setOrderDisplayState] = useState({
    displayedCount: 3,
    allLoaded: false
  });

  const messagesEndRef = useRef(null);

  const welcomeMessage = "嘿，歡迎來到 Inkslap！我是 Inky 😄，今天可以怎麼幫您呢？請問是需要協助關於客製化商品的部分，還是有其他需求呢？";

  // 模擬訂單資料
  const mockOrders = [
    {
      id: '202506010001',
      date: '2025/05/06',
      status: '處理中',
      statusColor: '#ff9500',
      customerName: '陳同學',
      paymentMethod: '付款方式',
      totalAmount: 125000,
      items: [
        { name: '客製化馬克杯', quantity: 100, unitPrice: 150 },
        { name: '環保購物袋', quantity: 200, unitPrice: 85 }
      ]
    },
    {
      id: '202506010002',
      date: '2025/05/06',
      status: '處理中',
      statusColor: '#ff9500',
      customerName: '陳同學',
      paymentMethod: '付款方式',
      totalAmount: 125000,
      items: [
        { name: '客製化T恤', quantity: 50, unitPrice: 280 }
      ]
    },
    {
      id: '202506010003',
      date: '2025/05/06',
      status: '處理中',
      statusColor: '#ff9500',
      customerName: '陳同學',
      paymentMethod: '付款方式',
      totalAmount: 125000,
      items: [
        { name: '客製化筆記本', quantity: 300, unitPrice: 120 }
      ]
    },
    {
      id: '202505280004',
      date: '2025/05/28',
      status: '已完成',
      statusColor: '#28a745',
      customerName: '陳同學',
      paymentMethod: '信用卡',
      totalAmount: 89500,
      items: [
        { name: '客製化帆布袋', quantity: 150, unitPrice: 95 },
        { name: '環保水瓶', quantity: 80, unitPrice: 280 }
      ]
    },
    {
      id: '202505250005',
      date: '2025/05/25',
      status: '已完成',
      statusColor: '#28a745',
      customerName: '陳同學',
      paymentMethod: '轉帳',
      totalAmount: 67800,
      items: [
        { name: '客製化筆記本', quantity: 200, unitPrice: 120 },
        { name: '原子筆組合', quantity: 300, unitPrice: 89 }
      ]
    },
    {
      id: '202505200006',
      date: '2025/05/20',
      status: '已完成',
      statusColor: '#28a745',
      customerName: '陳同學',
      paymentMethod: '信用卡',
      totalAmount: 156000,
      items: [
        { name: '客製化保溫杯', quantity: 100, unitPrice: 380 },
        { name: '環保餐具組', quantity: 200, unitPrice: 190 }
      ]
    },
    {
      id: '202505150007',
      date: '2025/05/15',
      status: '已取消',
      statusColor: '#dc3545',
      customerName: '陳同學',
      paymentMethod: '信用卡',
      totalAmount: 45000,
      items: [
        { name: '客製化鑰匙圈', quantity: 500, unitPrice: 90 }
      ]
    },
    {
      id: '202505100008',
      date: '2025/05/10',
      status: '已完成',
      statusColor: '#28a745',
      customerName: '陳同學',
      paymentMethod: '轉帳',
      totalAmount: 234000,
      items: [
        { name: '客製化外套', quantity: 60, unitPrice: 1200 },
        { name: '客製化帽子', quantity: 120, unitPrice: 450 }
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
    }
  ];

  const options = [
    { key: 'gift', text: '尋找贈品', response: '請問您的送禮需求是什麼？（如送禮目的、數量、預算）' },
    { key: 'order', text: '查詢訂單', response: '想查詢甚麼訂單？' },
    { key: 'about', text: '了解 Inkslap 禮贈平台', response: '想了解 Inkslap的甚麼問題?' }
  ];

  // 同義詞字典 - 用於擴充搜尋關鍵字
  const synonyms = {
    "辦公": ["辦公用品", "文具", "商務"],
    "辦公小物": ["文具", "辦公用品", "商務用品"],
    "生活": ["生活雜貨", "家居", "日用品"],
    "生活用品": ["生活雜貨", "家居", "日用品"],
    "收納": ["包袋收納", "整理", "儲物"],
    "包包": ["包袋收納", "袋子", "背包"],
    "杯子": ["杯瓶餐具", "水杯", "茶杯"],
    "餐具": ["杯瓶餐具", "用餐", "廚具"],
    "衣服": ["衣物配件", "服裝", "穿搭"],
    "配件": ["配件飾品", "裝飾", "飾品"],
    "送男友": ["男性", "男士", "紳士"],
    "送女友": ["女性", "女士", "淑女"],
    "療癒系": ["舒壓", "放鬆", "可愛"],
    "科技感": ["現代", "時尚", "高科技"],
    "環保": ["綠色", "永續", "生態"]
  };

  // 擴充關鍵字函數
  const expandKeywords = (keyword) => {
    const expanded = [keyword.toLowerCase()];

    // 檢查是否有同義詞
    for (const [key, syns] of Object.entries(synonyms)) {
      if (key.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(key)) {
        expanded.push(...syns.map(s => s.toLowerCase()));
      }
      if (syns.some(syn => syn.toLowerCase().includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(syn.toLowerCase()))) {
        expanded.push(key.toLowerCase());
        expanded.push(...syns.map(s => s.toLowerCase()));
      }
    }

    return [...new Set(expanded)]; // 去重
  };

  // 模糊搜尋商品的函數
  const searchProducts = (keyword) => {
    if (!keyword || keyword.trim() === '') return [];

    const expandedKeywords = expandKeywords(keyword.trim());

    // 擴充的模擬商品資料
    const mockProducts = [
      { name: '帆布托特包', price: '160元', category: '包袋收納、配件商品、生活雜貨' },
      { name: '網格收納包', price: '130元', category: '包袋收納、生活雜貨' },
      { name: '燈芯絨兩用包', price: '300元', category: '包袋收納、生活雜貨' },
      { name: '密碼鎖收納包', price: '250元', category: '包袋收納、生活雜貨、配件飾品' },
      { name: '帆布零錢包', price: '95元', category: '包袋收納、配件飾品、生活雜貨' },
      { name: '皮革筆袋', price: '50元', category: '文具、配件飾品、生活雜貨' },
      { name: '不銹鋼杯', price: '160元', category: '杯瓶餐具、生活雜貨、家居' },
      { name: '環保杯 800mL', price: '750元', category: '杯瓶餐具、生活雜貨、家居、環保' },
      { name: '電鍍圓珠筆', price: '20元', category: '文具、辦公用品、配件飾品' },
      { name: 'PU束繩記事本', price: '200元', category: '文具、辦公用品、生活雜貨' },
      { name: '金屬圓珠筆', price: '25元', category: '文具、辦公用品' },
      { name: '商務金屬圓珠筆', price: '25元', category: '文具、辦公用品' },
      { name: '便條紙', price: '14元', category: '文具、辦公用品' },
      { name: '皮革文件夾', price: '90元', category: '文具、辦公用品' },
      { name: '棒球帽', price: '160元', category: '衣物配件、配件飾品、生活雜貨' },
      { name: '針織毛帽', price: '270元', category: '衣物配件、生活雜貨' }
    ];

    // 多欄位模糊搜尋，支援同義詞
    const results = [];
    for (const product of mockProducts) {
      let matchScore = 0;

      // 搜尋商品名稱
      for (const expKeyword of expandedKeywords) {
        if (product.name.toLowerCase().includes(expKeyword)) {
          matchScore += 3; // 名稱匹配權重最高
        }
      }

      // 搜尋分類
      for (const expKeyword of expandedKeywords) {
        if (product.category.toLowerCase().includes(expKeyword)) {
          matchScore += 2; // 分類匹配權重中等
        }
      }

      if (matchScore > 0) {
        results.push({ ...product, matchScore });
      }
    }

    // 按匹配分數排序
    return results.sort((a, b) => b.matchScore - a.matchScore);
  };

  // 處理查看更多按鈕點擊
  const handleLoadMore = (messageIndex) => {
    setChatHistory(prev => {
      const newHistory = [...prev];
      const message = newHistory[messageIndex];

      if (message && message.productData) {
        const currentDisplayed = message.productData.displayedCount || 3;
        const newDisplayedCount = Math.min(currentDisplayed + 3, message.productData.totalProducts.length);

        // 更新該訊息的產品數據
        message.productData = {
          ...message.productData,
          displayedCount: newDisplayedCount
        };
      }

      return newHistory;
    });
  };

  // 處理關鍵字搜尋按鈕點擊
  const handleKeywordSearch = () => {
    setGiftSearchState(prev => ({
      ...prev,
      searchPromptVisible: true
    }));

    // 添加搜尋提示訊息
    const searchPromptMessage = {
      role: 'assistant',
      content: '想找特定商品嗎？輸入關鍵字試試看吧 (例如：辦公小物、送男友、收納)',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSearchPrompt: true
    };

    setChatHistory(prev => [...prev, searchPromptMessage]);
  };

  // 處理商品點擊
  const handleProductClick = (product) => {
    console.log('點擊商品:', product);

    // TODO: 實現以下功能
    // 1. 導向商品簡介頁
    // 2. 上傳購買動機到 Inky
    // 3. 收合搜尋關鍵字卡
    // 4. 保留原有對話

    // 暫時顯示商品信息
    const productInfoMessage = {
      role: 'assistant',
      content: `您點擊了商品：${product.name}，價格：${product.price}。商品詳情頁面開發中...`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, productInfoMessage]);
  };

  // 處理回主選單按鈕點擊
  const handleBackToMenu = () => {
    // 重置狀態
    setGiftSearchState({
      currentProducts: [],
      displayedCount: 3,
      totalProducts: [],
      searchKeyword: '',
      showLoadMore: false,
      isSearchMode: false,
      searchPromptVisible: false
    });

    // 清除對話記錄並回到初始狀態
    const initialMessage = {
      role: 'assistant',
      content: welcomeMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory([initialMessage]);
    setShowOptions(true);
  };

  // 處理登入
  const handleLogin = async (credentials) => {
    // 模擬登入邏輯
    try {
      setLoading(true);

      // 模擬 API 呼叫延遲
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 這裡可以添加真實的登入 API 呼叫
      // const response = await fetch('/api/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(credentials)
      // });
      // const result = await response.json();

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
      await saveChatHistory([...chatHistory, orderSummaryMessage]);

      message.success('登入成功！');
    } catch (error) {
      console.error('登入錯誤:', error);
      message.error('登入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 處理查看更多訂單
  const handleViewMoreOrders = () => {
    setChatHistory(prev => {
      const updatedHistory = [...prev];
      const lastMessageIndex = updatedHistory.length - 1;
      const lastMessage = updatedHistory[lastMessageIndex];

      if (lastMessage && lastMessage.isOrderSummary) {
        const currentDisplayed = lastMessage.orderData.displayedCount || 3;
        const newDisplayedCount = Math.min(currentDisplayed + 3, mockOrders.length);
        const allLoaded = newDisplayedCount >= mockOrders.length;

        // 更新訂單顯示狀態
        updatedHistory[lastMessageIndex] = {
          ...lastMessage,
          orderData: {
            ...lastMessage.orderData,
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

  // 處理訂單卡片點擊
  const handleOrderClick = (order) => {
    // 這裡可以導向到訂單詳細資訊頁面
    message.info(`查看訂單 ${order.id} 的詳細資訊`);
  };

  // 處理查看所有商品
  const handleViewAllProducts = () => {
    // 這裡可以導向到所有商品頁面
    message.info('即將導向到所有商品頁面');
    // 實際實作時可以使用：
    // window.open('/products', '_blank'); // 新視窗開啟
    // 或者 window.location.href = '/products'; // 當前視窗跳轉
  };

  // 測試 API 連接
  const testConnection = async () => {
    try {
      console.log('測試 API 連接...');

      // 先嘗試代理
      let response;
      try {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          },
          body: JSON.stringify({
            user_query: '測試連接',
            chat_history: []
          })
        });
      } catch (proxyError) {
        console.warn('代理測試失敗，嘗試直接連接:', proxyError);
        // 如果代理失敗，嘗試直接連接
        response = await fetch('https://bot.agatha-ai.com/flowise/16347ad1-56a3-45ff-950c-35bc259865d3/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          },
          body: JSON.stringify({
            user_query: '測試連接',
            chat_history: []
          })
        });
      }

      if (response.ok) {
        setConnectionStatus('connected');
        console.log('API 連接測試成功');
      } else {
        setConnectionStatus('disconnected');
        console.error('API 連接測試失敗:', response.status, response.statusText);
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      console.error('API 連接測試錯誤:', error);
    }
  };

  useEffect(() => {
    const initChat = async () => {
      const history = await loadChatHistory();
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
        await saveChatHistory([{ role: 'assistant', content: welcomeMessage }]);
      }
    };
    initChat();
  }, []);

  useEffect(() => {
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

      console.log('發送聊天請求:', {
        user_query: userInput,
        chat_history_length: apiChatHistory.length
      });

      // 嘗試使用本地代理，如果失敗則直接調用 API
      let apiUrl = '/api/chat';
      let response;

      try {
        response = await fetch(apiUrl, {
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
      } catch (proxyError) {
        console.warn('代理請求失敗，嘗試直接調用 API:', proxyError);
        // 如果代理失敗，嘗試直接調用 API
        apiUrl = 'https://bot.agatha-ai.com/flowise/16347ad1-56a3-45ff-950c-35bc259865d3/chat';
        response = await fetch(apiUrl, {
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
      }

      console.log('API 響應狀態:', response.status, response.statusText);
      console.log('使用的 API URL:', apiUrl);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '無法讀取錯誤詳情');
        console.error('API 錯誤響應:', errorText);

        // 根據不同的 HTTP 狀態碼提供更具體的錯誤信息
        let errorMessage = `API 請求失敗: ${response.status} ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = 'API 端點不存在，請檢查 API 地址是否正確';
        } else if (response.status === 500) {
          errorMessage = '服務器內部錯誤，請稍後再試';
        } else if (response.status === 403) {
          errorMessage = 'API 訪問被拒絕，請檢查權限設置';
        } else if (response.status >= 400 && response.status < 500) {
          errorMessage = '請求格式錯誤，請檢查發送的數據';
        }

        throw new Error(`${errorMessage} - ${errorText}`);
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

      if (products && products.length > 0) {
        console.log('設置為商品搜尋結果');
        finalMessage.isProductSearch = true;
        finalMessage.productData = {
          totalProducts: products,
          displayedCount: Math.min(3, products.length), // 預設顯示前3筆商品
          searchKeyword: extractSearchKeyword(userInput, cleanedContent)
        };
        // 修改顯示內容，添加搜尋結果提示
        finalMessage.content = `以下是符合您需求的推薦商品：`;
      }

      const finalHistory = [
        ...updatedHistory,
        finalMessage
      ];

      setChatHistory(finalHistory);

      try {
        await saveChatHistory(finalHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })));
      } catch (saveError) {
        message.error('保存對話記錄失敗');
      }
    } catch (error) {
      console.error('聊天請求錯誤:', error);

      let errorContent = '抱歉，發生了一些錯誤。請稍後再試。';

      // 根據不同的錯誤類型提供更具體的錯誤信息
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorContent = '網路連接錯誤，請檢查您的網路連接後重試。';
      } else if (error.message.includes('API 請求失敗')) {
        errorContent = `服務器錯誤：${error.message}。請稍後再試或聯繫技術支援。`;
      } else if (error.message.includes('timeout')) {
        errorContent = '請求超時，請稍後再試。';
      }

      const errorMessage = {
        role: 'assistant',
        content: errorContent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLoading: false
      };

      // 移除加載中的消息並添加錯誤消息
      setChatHistory(prev => {
        const newHistory = prev.filter(msg => !msg.isLoading);
        return [...newHistory, errorMessage];
      });

      // 顯示錯誤通知
      message.error(errorContent);
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
        await saveChatHistory(updatedHistory);
        return;
      }

      // 已登入，顯示訂單摘要
      const orderSummaryMessage = {
        role: 'assistant',
        content: '嗨，歡迎到 Inkslap！我是 Inky 😄，今天可以怎麼幫您呢？請問是需要協助關於客製化商品的部分，還是有其他需求呢？',
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
      await saveChatHistory(updatedHistory);
      return;
    }

    // 特殊處理了解 Inkslap 禮贈平台
    if (option.key === 'about') {
      const aboutMessage = {
        role: 'assistant',
        content: 'Inkslap 簡介',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAboutInkslap: true
      };
      const updatedHistory = [...chatHistory, userMessage, aboutMessage];
      setChatHistory(updatedHistory);
      setShowOptions(false);
      await saveChatHistory(updatedHistory);
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
    await saveChatHistory(updatedHistory);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  const handleClose = () => setIsOpen(false);
  
  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  const handleSaveChat = async () => {
    try {
      setLoading(true);
      await saveChatHistory(chatHistory);
      message.success('對話記錄已保存到本地 JSON 文件');
    } catch (error) {
      message.error('保存對話記錄失敗');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
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
            <SaveOutlined onClick={handleSaveChat} style={{ cursor: 'pointer' }} />
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
                ) : message.isOrderSummary ? (
                  // 處理訂單摘要顯示
                  (() => {
                    const { orders, hasMore, allLoaded, displayedCount } = message.orderData;

                    return (
                      <div className="order-summary-container">
                        <div className="order-summary-header">
                          <h3>查詢訂單</h3>
                          <p>
                            {displayedCount <= 3
                              ? '以下是您最近的三筆訂單記錄，可點擊查看詳細資訊：'
                              : `以下是您的訂單記錄（顯示 ${displayedCount} 筆），可點擊查看詳細資訊：`
                            }
                          </p>
                        </div>

                        <div className="orders-list">
                          {orders.map((order, orderIndex) => (
                            <OrderCard
                              key={order.id}
                              order={order}
                              onClick={handleOrderClick}
                            />
                          ))}
                        </div>

                        {orders.length === 0 && (
                          <div className="no-orders-message">
                            <p>如果您需要更多資訊或其他需求，請隨時告訴我！</p>
                          </div>
                        )}

                        {/* 全部載入完成的提示 */}
                        {allLoaded && orders.length > 3 && (
                          <div className="all-loaded-message">
                            <p>✅ 已顯示全部訂單囉～</p>
                          </div>
                        )}

                        <div className="action-buttons">
                          {hasMore && !allLoaded && (
                            <Button
                              type="primary"
                              size="small"
                              className="action-btn"
                              onClick={handleViewMoreOrders}
                            >
                              查看更多
                            </Button>
                          )}
                          {allLoaded && (
                            <Button
                              type="primary"
                              size="small"
                              className="action-btn"
                              onClick={() => handleOptionClick({ key: 'gift', text: '尋找贈品', response: '請問您的送禮需求是什麼？（如送禮目的、數量、預算）' })}
                            >
                              查看贈品推薦
                            </Button>
                          )}
                          <Button
                            type="default"
                            size="small"
                            className="action-btn"
                            icon={<HomeOutlined />}
                            onClick={handleBackToMenu}
                          >
                            回主選單
                          </Button>
                        </div>
                      </div>
                    );
                  })()
                ) : message.isLoginPrompt ? (
                  // 處理登入提示
                  <div className="login-prompt-container">
                    <p>{message.content}</p>
                    <Button
                      type="primary"
                      onClick={() => setShowLoginModal(true)}
                    >
                      立即登入
                    </Button>
                  </div>
                ) : message.isAboutInkslap ? (
                  // 處理 Inkslap 簡介
                  <div className="about-inkslap-container">
                    <div className="about-header">
                      <h3>了解 Inkslap 禮贈平台</h3>
                    </div>

                    <div className="about-content">
                      <div className="about-section">
                        <h4>🎁 專業客製化禮贈品平台</h4>
                        <p>Inkslap 是台灣領先的客製化禮贈品平台，專為企業和個人提供高品質的客製化商品服務。</p>
                      </div>

                      <div className="about-section">
                        <h4>✨ 我們的服務特色</h4>
                        <ul>
                          <li>🎨 專業設計團隊，提供客製化設計服務</li>
                          <li>🏭 嚴選優質供應商，確保商品品質</li>
                          <li>📦 一站式服務，從設計到配送全程包辦</li>
                          <li>💰 透明化報價，無隱藏費用</li>
                          <li>⚡ 快速交期，滿足您的時程需求</li>
                        </ul>
                      </div>

                      <div className="about-section">
                        <h4>🛍️ 商品類別</h4>
                        <p>文具用品、生活雜貨、服飾配件、3C周邊、環保商品、節慶禮品等，超過千種商品任您選擇。</p>
                      </div>
                    </div>

                    <div className="action-buttons">
                      <Button
                        type="primary"
                        size="small"
                        className="action-btn"
                        onClick={handleViewAllProducts}
                      >
                        查看所有商品
                      </Button>
                      <Button
                        type="default"
                        size="small"
                        className="action-btn"
                        icon={<HomeOutlined />}
                        onClick={handleBackToMenu}
                      >
                        回主選單
                      </Button>
                    </div>
                  </div>
                ) : message.isProductSearch ? (
                  // 處理商品搜尋結果
                  (() => {
                    const { totalProducts, displayedCount, searchKeyword } = message.productData;
                    const displayedProducts = totalProducts.slice(0, displayedCount);
                    const hasMore = displayedCount < totalProducts.length;
                    const isAllDisplayed = displayedCount >= totalProducts.length;

                    return (
                      <div className="products-response">
                        <div className="response-intro">
                          {message.content}
                        </div>
                        <div className="products-grid">
                          {displayedProducts.map((product, idx) => (
                            <ProductCard
                              key={idx}
                              product={product}
                              onClick={handleProductClick}
                            />
                          ))}
                        </div>

                        {/* 顯示完成提示 */}
                        {isAllDisplayed && totalProducts.length > 3 && (
                          <div className="completion-message">
                            <div className="completion-text">
                              ✓ 已顯示全部查詢結果囉~
                            </div>
                          </div>
                        )}

                        <div className="response-footer">
                          {!isAllDisplayed ?
                            '這些產品都非常實用，適合用作禮品。如果您需要更多資訊或有其他需求，請隨時告訴我！' :
                            '以上就是所有符合條件的商品，如有其他需求請告訴我！'
                          }
                        </div>

                        <div className="action-buttons">
                          {hasMore && (
                            <Button
                              type="primary"
                              size="small"
                              className="action-btn"
                              onClick={() => handleLoadMore(index)}
                            >
                              查看更多
                            </Button>
                          )}
                          <Button
                            type="default"
                            size="small"
                            className="action-btn"
                            icon={<SearchOutlined />}
                            onClick={handleKeywordSearch}
                          >
                            其他關鍵字搜尋
                          </Button>
                          <Button
                            type="default"
                            size="small"
                            className="action-btn"
                            icon={<HomeOutlined />}
                            onClick={handleBackToMenu}
                          >
                            回主選單
                          </Button>
                        </div>
                      </div>
                    );
                  })()
                ) : message.isNoResult ? (
                  // 處理無搜尋結果
                  <div className="no-result-response">
                    <div className="no-result-content">
                      {message.content}
                    </div>
                    <div className="action-buttons">
                      <Button
                        type="default"
                        size="small"
                        className="action-btn"
                        icon={<SearchOutlined />}
                        onClick={handleKeywordSearch}
                      >
                        其他關鍵字搜尋
                      </Button>
                      <Button
                        type="default"
                        size="small"
                        className="action-btn"
                        icon={<HomeOutlined />}
                        onClick={handleBackToMenu}
                      >
                        回主選單
                      </Button>
                    </div>
                  </div>
                ) : (
                  (() => {
                    // 檢查是否為搜尋提示訊息
                    if (message.isSearchPrompt) {
                      return (
                        <div className="search-prompt">
                          <div className="search-prompt-text">{message.content}</div>
                        </div>
                      );
                    }

                    const products = parseProductInfo(message.content);
                    if (products && products.length > 0) {
                      // 初始化產品數據（如果還沒有的話）
                      if (!message.productData) {
                        message.productData = {
                          totalProducts: products,
                          displayedCount: 3,
                          searchKeyword: message.searchKeyword || ''
                        };
                      }

                      const { totalProducts, displayedCount, searchKeyword } = message.productData;
                      const displayedProducts = totalProducts.slice(0, displayedCount);
                      const hasMore = displayedCount < totalProducts.length;
                      const isAllDisplayed = displayedCount >= totalProducts.length;

                      return (
                        <div className="products-response">
                          <div className="response-intro">
                            {searchKeyword ?
                              `以下是「${searchKeyword}」的搜尋結果：` :
                              `以下是來自「包袋收納」類別的推薦商品，適合您的需求：`
                            }
                          </div>
                          <div className="products-grid">
                            {displayedProducts.map((product, idx) => (
                              <ProductCard key={idx} product={product} />
                            ))}
                          </div>

                          {/* 顯示完成提示 */}
                          {isAllDisplayed && totalProducts.length > 3 && (
                            <div className="completion-message">
                              <div className="completion-text">
                                ✓ 已顯示全部查詢結果囉~
                              </div>
                            </div>
                          )}

                          <div className="response-footer">
                            {!isAllDisplayed ?
                              '這些產品都非常實用，適合用作禮品。如果您需要更多資訊或有其他需求，請隨時告訴我！' :
                              '以上就是所有符合條件的商品，如有其他需求請告訴我！'
                            }
                          </div>

                          <div className="action-buttons">
                            {hasMore && (
                              <Button
                                type="primary"
                                size="small"
                                className="action-btn"
                                onClick={() => handleLoadMore(index)}
                              >
                                查看更多
                              </Button>
                            )}
                            <Button
                              type="default"
                              size="small"
                              className="action-btn"
                              icon={<SearchOutlined />}
                              onClick={handleKeywordSearch}
                            >
                              其他關鍵字搜尋
                            </Button>
                            <Button
                              type="default"
                              size="small"
                              className="action-btn"
                              icon={<HomeOutlined />}
                              onClick={handleBackToMenu}
                            >
                              回主選單
                            </Button>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          className="markdown-content"
                          dangerouslySetInnerHTML={{ __html: message.content }}
                        />
                      );
                    }
                  })()
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
    </div>
  );
};

export default ChatWindow;
