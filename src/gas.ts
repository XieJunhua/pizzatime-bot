import axios from 'axios';
import { gunzipSync } from 'zlib';
import fs from 'fs';
import { AddressHistoryManager } from './addressHistory';

const addressHistory = new AddressHistoryManager();
let isWarmupPeriod = true;  // 添加预热标志

export async function initGasMonitoring() {
    await addressHistory.init();

    // 添加预热逻辑
    console.log('Starting warmup period...');
    const warmupData = await fetchGasData();
    await addressHistory.updateAddresses(
        warmupData.map((item: any) => ({
            address: item.address,
            title: item.title
        }))
    );

    // 5分钟后结束预热期
    setTimeout(() => {
        isWarmupPeriod = false;
        console.log('Warmup period completed');
    }, 5 * 60 * 1000);
}

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/122.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
];

export async function fetchGasData(retryCount = 3) {
    try {
        // 随机延迟 2-5 秒
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

        const url = "https://etherscan.io/datasourceHandler?q=gasguzzler&draw=3&columns%5B0%5D%5Bdata%5D=rank&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=address&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=false&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=txfee_3h&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=gasused_3h&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=txfee_24h&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=gasused_24h&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=analytics&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=false&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=2&order%5B0%5D%5Bdir%5D=desc&start=0&length=50&search%5Bvalue%5D=&search%5Bregex%5D=false"
        const response = await axios.get(url, {
            headers: {
                'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://etherscan.io/gastracker',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept-Encoding': 'gzip',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Cookie': 'ASP.NET_SessionId=x; etherscan_cookieconsent=True',
                'Origin': 'https://etherscan.io',
                'Connection': 'keep-alive'
            },
            responseType: 'arraybuffer',
            timeout: 15000,
            withCredentials: true
        });

        let decompressedData;
        if (response.headers['content-encoding'] === 'gzip') {
            decompressedData = gunzipSync(response.data).toString('utf-8');
        } else {
            decompressedData = response.data.toString('utf-8');
        }

        const data = JSON.parse(decompressedData);
        // console.log(data);

        // 解析返回的数据
        const gasGuzzlers = data.data;
        // fs.writeFileSync('gas-result.json', JSON.stringify(gasGuzzlers, null, 2));

        // console.log('Gas 消耗排名:');
        const formattedGuzzlers = gasGuzzlers.map((guzzler: any, index: number) => {
            const addressMatch = guzzler.address.match(/address\/([^']+)/);
            const address = addressMatch ? addressMatch[1] : 'Address not found';
            const titleMatch = guzzler.address.match(/title="([^"]+?)(?:&#10;|")/);
            const title = titleMatch ? titleMatch[1] : address;

            return {
                "rank": index + 1,
                "title": title,
                "address": address,
                // "gasUsedPer3h": guzzler.gasused_3h_raw,
                "txFee3h": guzzler.txfee_3h_raw,
                // "gasUsedPercent24h": guzzler.gasused_24h_raw,
                "txFee24h": guzzler.txfee_24h_raw
            };
        });

        // console.log(formattedGuzzlers);

        return formattedGuzzlers;

    } catch (error) {
        console.error('获取 Gas 数据时出错:', error);
        if (retryCount > 0) {
            const waitTime = (4 - retryCount) * 10000; // 递增等待时间：10秒、20秒、30秒
            console.log(`Retrying in ${waitTime / 1000} seconds... (${retryCount} attempts remaining)`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return fetchGasData(retryCount - 1);
        }
        throw error;
    }
}

export async function getCurrentGasPrice() {
    try {
        const response = await axios.post('https://practical-silent-dawn.quiknode.pro/7248e701127f7d51657c065cbf133899a53028d2/', {
            method: 'eth_gasPrice',
            params: [],
            id: 1,
            jsonrpc: '2.0'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        // Convert hex string to number (Wei)
        const gasPriceHex = response.data.result;
        const gasPriceWei = parseInt(gasPriceHex, 16);
        // Convert Wei to Gwei (1 Gwei = 10^9 Wei)
        const gasPriceGwei = Number((gasPriceWei / 1e9).toFixed(3));
        return gasPriceGwei;
    } catch (error) {
        console.error('Error getting current gas price:', error);
        throw error;
    }
}

export async function detectAbnormalAddresses(gasData: any[]) {
    // 更新地址历史
    await addressHistory.updateAddresses(
        gasData.map(item => ({
            address: item.address,
            title: item.title
        }))
    );

    // 如果在预热期间，不报告异常
    if (isWarmupPeriod) {
        console.log('Still in warmup period, skipping abnormal address detection');
        return [];
    }

    // 筛选出不常见的高消耗地址
    const abnormalAddresses = gasData
        .slice(0, 10)
        .filter(item => addressHistory.isAddressUncommon(item.address))
        .map(item => ({
            address: item.address,
            title: item.title,
            txFee3h: item.txFee3h,
            txFee24h: item.txFee24h
        }));

    console.log('Abnormal addresses detected:', abnormalAddresses);

    return abnormalAddresses;
}

// 调用函数
// fetchGasData();
// console.log(await getCurrentGasPrice());
