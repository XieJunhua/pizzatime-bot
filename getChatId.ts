import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function getChatUpdates() {
    try {
        const BOT_TOKEN = process.env.BOT_TOKEN;

        if (!BOT_TOKEN) {
            throw new Error('BOT_TOKEN not found in .env file');
        }

        console.log('Fetching updates...');
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`;
        console.log('URL:', url);

        const response = await axios.get(url);

        // 打印完整响应以进行调试
        console.log('Raw Response:', JSON.stringify(response.data, null, 2));

        const updates = response.data.result;

        if (!updates || updates.length === 0) {
            console.log('\nNo updates found. Please follow these steps:');
            console.log('1. Make sure your bot token is correct');
            console.log('2. Add the bot to your group');
            console.log('3. Send a message in the group');
            console.log('4. If still no updates, try sending /start to your bot');
            console.log('5. You might need to reset the updates by calling:');
            console.log(`   https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);
            return;
        }

        console.log('\nRecent chat IDs found:');
        const chatIds = new Set();

        updates.forEach((update: any) => {
            const chatId = update.message?.chat?.id;
            if (chatId && !chatIds.has(chatId)) {
                chatIds.add(chatId);
                console.log('\nChat Details:');
                console.log(`- Chat ID: ${chatId}`);
                console.log(`- Chat Type: ${update.message.chat.type}`);
                console.log(`- Chat Title: ${update.message.chat.title || 'Private Chat'}`);
                if (update.message.from) {
                    console.log(`- Message From: ${update.message.from.first_name} (${update.message.from.id})`);
                }
            }
        });

    } catch (error) {
        console.error('\nError occurred:');
        if (axios.isAxiosError(error)) {
            console.error('API Error:', error.response?.data || error.message);
        } else {
            console.error('Error:', error instanceof Error ? error.message : String(error));
        }
    }
}

getChatUpdates(); 