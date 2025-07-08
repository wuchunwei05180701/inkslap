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
`;

// 直接在Web Component中實現聊天窗口組件，避免CORS問題
const ChatWindowComponent = (props) => {
  // 從props中獲取屬性，如果沒有提供，則使用默認值
  const historyPath = props.historyPath || '/history.json';
  const apiUrl = props.apiUrl || '/api/chat';

  // 輸出 API URL，以便調試
  const [chatHistory, setChatHistory] = React.useState([]);
  const [userInput, setUserInput] = React.useState('');
  const [showOptions, setShowOptions] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(true);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const messagesEndRef = React.useRef(null);

  const welcomeMessage = "嘿，歡迎來到 Inkslap！我是 Inky 😄，今天可以怎麼幫您呢？請問是需要協助關於客製化商品的部分，還是有其他需求呢？";

  const options = [
    { key: 'gift', text: '尋找贈品', response: '請問您的送禮需求是什麼？（如送禮目的、數量、預算）' },
    { key: 'order', text: '查詢訂單', response: '想查詢甚麼訂單？' },
    { key: 'about', text: '了解 Inkslap 禮贈平台', response: '想了解 Inkslap的甚麼問題?' }
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

      const finalHistory = [
        ...updatedHistory,
        {
          role: 'assistant',
          content: cleanedContent,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isLoading: false
        }
      ];

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
    </React.Fragment>
  );
};

// 創建一個包裝組件，用於添加樣式
const ChatWindowWrapper = (props) => {
  return <ChatWindowComponent {...props} />;
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