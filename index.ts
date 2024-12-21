import { Bot } from "grammy";
import { fetchGasData, getCurrentGasPrice } from './gas';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Telegram bot with your bot token
const bot = new Bot(process.env.BOT_TOKEN as string);
const CHAT_ID = process.env.CHAT_ID as string; // Replace with your chat ID

async function monitorGas() {
    try {
        // Fetch gas data and current gas price
        const gasData = await fetchGasData();
        const currentGasPrice = await getCurrentGasPrice();
        if (currentGasPrice > 10) {
            const message = `⚠️ Gas 价格提醒\n当前价格: ${currentGasPrice} Gwei\n时间: ${new Date().toLocaleString()}`;
            await bot.api.sendMessage(CHAT_ID, message);
        }

        console.log('Gas monitoring running successfully');
    } catch (error) {
        // Send error message via Telegram bot
        const errorMessage = `Gas monitoring error: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);

        try {
            await bot.api.sendMessage(CHAT_ID, errorMessage);
        } catch (telegramError) {
            console.error('Failed to send Telegram message:', telegramError);
        }
    }
}

// Run the monitoring function every 30 seconds
setInterval(monitorGas, 30000);
monitorGas();

bot.command('status', async (ctx) => {
    try {
        const gasData = await fetchGasData();
        const message = `📊 Gas 价格统计 (最近10条)\n\n${gasData.slice(0, 10).map((data: any, index: number) =>
            `${index + 1}. 地址: ${data.address} | 3h费用: ${data.txFee3h} USDT | 24h费用: ${data.txFee24h} USDT`
        ).join('\n')
            }\n\n更新时间: ${new Date().toLocaleString()}`;
        await ctx.reply(message);
    } catch (error) {
        await ctx.reply(`获取状态失败: ${error instanceof Error ? error.message : String(error)}`);
    }
});

bot.start();

// Initial run


