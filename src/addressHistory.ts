import fs from 'fs/promises';
import path from 'path';

interface AddressRecord {
    address: string;
    title: string;
    lastSeen: string;
    frequency: number;
}

export class AddressHistoryManager {
    private readonly dbPath: string;
    private addresses: Map<string, AddressRecord>;

    constructor() {
        this.dbPath = path.join(__dirname, '../data/address-history.json');
        this.addresses = new Map();
    }

    async init() {
        try {
            const data = await fs.readFile(this.dbPath, 'utf-8');
            const records = JSON.parse(data);
            this.addresses = new Map(records.map((record: AddressRecord) => [record.address, record]));
        } catch (error) {
            // 如果文件不存在，创建空的数据库
            await this.save();
            console.log('Address history database created');
        }
    }

    private async save() {
        await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
        await fs.writeFile(
            this.dbPath,
            JSON.stringify(Array.from(this.addresses.values()), null, 2)
        );
    }

    async updateAddresses(newAddresses: Array<{ address: string, title: string }>) {
        const now = new Date().toISOString();

        for (const { address, title } of newAddresses) {
            const record = this.addresses.get(address) || {
                address,
                title,
                lastSeen: now,
                frequency: 0
            };

            record.frequency += 1;
            record.lastSeen = now;
            this.addresses.set(address, record);
        }

        await this.save();
    }

    isAddressUncommon(address: string): boolean {
        const record = this.addresses.get(address);
        if (!record) return true;

        // 如果地址出现频率小于10次，认为是不常见地址
        return record.frequency < 10;
    }
} 