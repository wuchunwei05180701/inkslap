const express = require('express');
const path = require('path');
const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// 提供 dist 目錄下的靜態檔案
app.use('/flowise', express.static(path.join(__dirname, 'dist')));

app.listen(5533, () => {
  console.log('✅ 正在從 http://localhost:5533/flowise 提供靜態檔案'); // <-- 修正顯示錯字
});
