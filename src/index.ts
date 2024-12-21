import { Bot } from "grammy";
import { fetchGasData, getCurrentGasPrice, detectAbnormalAddresses, initGasMonitoring } from './gas';
import dotenv from 'dotenv';
import { GasPriceHistory } from './gasPrice';

dotenv.config();

// Initialize Telegram bot with your bot token
const bot = new Bot(process.env.BOT_TOKEN as string);
const CHAT_ID = process.env.CHAT_ID as string; // Replace with your chat ID

const gasPriceHistory = new GasPriceHistory();

async function monitorGas() {
    try {
        const gasData = await fetchGasData();
        const currentGasPrice = await getCurrentGasPrice();
        const abnormalAddresses = await detectAbnormalAddresses(gasData);

        // 保存当前 gas price
        gasPriceHistory.addPrice(currentGasPrice);
        await gasPriceHistory.save();

        // 检查价格异常
        if (gasPriceHistory.hasEnoughData(30)) { // 检查是否有足够的30分钟数据
            const avgGasPrice = gasPriceHistory.getAveragePrice(30); // 获取30分钟平均价格
            const threshold = 1.5; // 设置50%涨幅作为警戒线

            if (currentGasPrice > avgGasPrice * threshold) {
                const percentageIncrease = ((currentGasPrice - avgGasPrice) / avgGasPrice * 100).toFixed(2);
                const message = `⚠️ Gas 价格异常上涨！\n` +
                    `当前价格: ${currentGasPrice} Gwei\n` +
                    `30分钟平均价格: ${avgGasPrice.toFixed(2)} Gwei\n` +
                    `涨幅: ${percentageIncrease}%\n` +
                    `时间: ${new Date().toLocaleString()}`;
                await bot.api.sendMessage(CHAT_ID, message);
            }
        }

        // 如果发现异常地址，发送警告
        if (abnormalAddresses.length > 0) {
            const message = `🚨 发现异常地址活动\n\n${abnormalAddresses.map(addr =>
                `地址: ${addr.title}\n` +
                `${addr.address}\n` +
                `3小时费用: ${addr.txFee3h} USDT\n` +
                `24小时费用: ${addr.txFee24h} USDT\n`
            ).join('\n')}\n更新时间: ${new Date().toLocaleString()}`;

            await bot.api.sendMessage(CHAT_ID, message);
        }

        // Gas 价格监控逻辑保持不变
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

// 添加初始化函数
async function initialize() {
    try {
        await initGasMonitoring();
        await gasPriceHistory.load(); // 加载历史数据
        console.log('Gas monitoring initialized successfully');

        // 初始化成功后才开始定时监控
        setInterval(monitorGas, 30000);
        monitorGas();
    } catch (error) {
        console.error('Failed to initialize gas monitoring:', error);
        process.exit(1);
    }
}



bot.command('status', async (ctx) => {
    try {
        const gasData = await fetchGasData();
        const currentGasPrice = await getCurrentGasPrice();
        const message = `📊 Gas 价格统计 (最近10条)\n\n当前价格: ${currentGasPrice} Gwei\n\n${gasData.slice(0, 10).map((data: any, index: number) =>
            `${index + 1}. 地址: ${data.address} | 3h费用: ${data.txFee3h} USDT | 24h费用: ${data.txFee24h} USDT`
        ).join('\n')
            }\n\n更新时间: ${new Date().toLocaleString()}`;
        await ctx.reply(message);
    } catch (error) {
        await ctx.reply(`获取状态失败: ${error instanceof Error ? error.message : String(error)}`);
    }
});

// 启动程序
initialize();
bot.start();


