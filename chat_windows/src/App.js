import React from 'react';
import ChatWindow from './ChatWindow';

function App() {
  return (
    <div className="App" style={{
      position: 'relative',
      height: '100vh',
      backgroundColor: '#f0f2f5'
    }}>
      <ChatWindow />
    </div>
  );
}

export default App;