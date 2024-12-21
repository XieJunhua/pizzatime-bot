import axios from 'axios';
import { gunzipSync } from 'zlib';
import fs from 'fs';
export async function fetchGasData() {
    try {
        const url = "https://etherscan.io/datasourceHandler?q=gasguzzler&draw=3&columns%5B0%5D%5Bdata%5D=rank&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=address&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=false&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=txfee_3h&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=gasused_3h&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=txfee_24h&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=gasused_24h&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=analytics&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=false&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=2&order%5B0%5D%5Bdir%5D=desc&start=0&length=50&search%5Bvalue%5D=&search%5Bregex%5D=false"
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Referer': 'https://etherscan.io/',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept-Encoding': 'gzip'
            },
            responseType: 'arraybuffer'
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

        console.log('Gas 消耗排名:');
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

        console.log(formattedGuzzlers);

        return formattedGuzzlers;

    } catch (error) {
        console.error('获取 Gas 数据时出错:', error);
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

// 调用函数
fetchGasData();
// console.log(await getCurrentGasPrice());
