
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/chat-window-element.js',
  performance: {
    hints: false, // 關閉性能提示警告
    maxEntrypointSize: 512000, // 增加入口點大小限制
    maxAssetSize: 512000 // 增加資源大小限制
  },
  output: {
    filename: 'chat-window-element.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'history.json', to: 'history.json' }
      ]
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 5533,
    host: '0.0.0.0',
    allowedHosts: 'all',
    // headers: {
    //   'Access-Control-Allow-Origin': '*',
    //   'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    //   'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    // },
    // 移除代理設定，使用setupProxy.js處理
    // proxy: [
    //   {
    //     context: ['/local_chat_history'],
    //     target: 'http://localhost:3000',
    //     pathRewrite: { '^/local_chat_history': '/local_chat_history' },
    //     changeOrigin: true
    //   },
    //   {
    //     context: ['/api'],
    //     target: 'https://bot.agatha-ai.com',
    //     pathRewrite: { '^/api': '' },
    //     changeOrigin: true,
    //     secure: false
    //   }
    // ]
  }
};