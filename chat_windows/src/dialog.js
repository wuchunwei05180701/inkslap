export const loadChatHistory = async (historyPath = '/history.json') => {
  try {
    const response = await fetch(historyPath);
    
    // 檢查響應狀態
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 檢查內容類型
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // 返回默認的聊天歷史
      return [
        {
          role: 'assistant',
          content: '嘿，歡迎來到 Inkslap！我是 Inky 😄，今天可以怎麼幫您呢？請問是需要協助關於客製化商品的部分，還是有其他需求呢？'
        }
      ];
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // 返回默認的聊天歷史
    return [
      {
        role: 'assistant',
        content: '嘿，歡迎來到 Inkslap！我是 Inky 😄，今天可以怎麼幫您呢？請問是需要協助關於客製化商品的部分，還是有其他需求呢？'
      }
    ];
  }
};

export const saveChatHistory = async (chatHistory, historyPath = '/history.json') => {
  try {
    // 在 Web Component 環境中，我們無法直接寫入文件系統
    // 所以這裡只是模擬保存操作，實際上並沒有保存到文件
    // 在實際應用中，您需要實現一個服務器端 API 來處理保存操作
    
    const cleanedChatHistory = chatHistory.map(msg => ({
      role: msg.role,
      content: msg.role === 'assistant' ?
        msg.content.replace(/data:\s*/g, '') : msg.content
    }));
    
    
    // 將聊天歷史保存到 localStorage，作為臨時解決方案
    // 使用 historyPath 作為 key 的一部分，以便區分不同的聊天歷史
    const key = `inkslap_chat_history_${historyPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
    localStorage.setItem(key, JSON.stringify(cleanedChatHistory));
    
    return true;
  } catch (error) {
    return false;
  }
};