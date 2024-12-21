import fs from 'fs/promises';
import path from 'path';

interface GasPriceRecord {

    timestamp: number;
    price: number;
}

export class GasPriceHistory {
    private static readonly HISTORY_FILE = './data/gas_price_history.json';
    private static readonly MAX_HISTORY_LENGTH = 2880; // 24小时的数据点 (24 * 60 * 2)
    private history: GasPriceRecord[] = [];

    async load() {
        try {
            const data = await fs.readFile(path.join(process.cwd(), GasPriceHistory.HISTORY_FILE), 'utf-8');
            this.history = JSON.parse(data);
            // 清理超过24小时的数据
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            this.history = this.history.filter(record => record.timestamp > oneDayAgo);
        } catch (error) {
            this.history = [];
        }
    }

    async save() {
        await fs.writeFile(
            path.join(process.cwd(), GasPriceHistory.HISTORY_FILE),
            JSON.stringify(this.history),
            'utf-8'
        );
    }

    addPrice(price: number) {
        this.history.unshift({
            price,
            timestamp: Date.now()
        });

        if (this.history.length > GasPriceHistory.MAX_HISTORY_LENGTH) {
            this.history.pop();
        }
    }

    getAveragePrice(minutes: number = 30): number {
        const timeThreshold = Date.now() - minutes * 60 * 1000;
        const recentPrices = this.history
            .filter(record => record.timestamp > timeThreshold)
            .map(record => record.price);

        if (recentPrices.length === 0) return 0;
        return recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
    }

    hasEnoughData(minutes: number = 30): boolean {
        const timeThreshold = Date.now() - minutes * 60 * 1000;
        return this.history.filter(record => record.timestamp > timeThreshold).length >= 3;
    }
} 