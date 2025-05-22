require('dotenv').config(); // 載入 .env 文件中的環境變數
const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// LINE Bot 憑證
const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// Gemini API 金鑰
const geminiApiKey = process.env.GEMINI_API_KEY;

// 初始化 LINE Bot 客戶端
const lineClient = new Client(lineConfig);

// 初始化 Gemini 產生式 AI 客戶端
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // 選擇 'gemini-pro' 模型

// LINE Webhook 中間件
// 確保 LINE 的簽章驗證正確
app.post('/callback', middleware(lineConfig), (req, res) => {
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

// 處理 LINE 訊息事件的函數
async function handleEvent(event) {
    // 只處理文字訊息
    if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
    }

    const userMessage = event.message.text;
    let geminiReply = '抱歉，發生錯誤。';

    try {
        // 呼叫 Gemini API
        // 如果需要多輪對話，這裡需要加入對話歷史邏輯
        const result = await model.generateContent(userMessage);
        const response = result.response;
        geminiReply = response.text();
    } catch (error) {
        console.error('Gemini API Error:', error);
        geminiReply = `抱歉，Gemini 處理您的請求時發生錯誤: ${error.message || error}`;
    }

    // 回覆 LINE 使用者
    return lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: geminiReply
    });
}

// 啟動伺服器
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});