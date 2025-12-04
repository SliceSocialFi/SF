import { parseUnits } from 'viem';
import { MAINNET_CHAINS } from '@slice/data/chains';

interface GeckoTerminalResponse {
    data: {
        id: string;
        type: string;
        attributes: {
            name: string;
            symbol: string;
            decimals: number;
            price_usd: string | null;
        };
    };
}

const GECKO_API_URL = 'https://api.geckoterminal.com/api/v2/networks/bsc/tokens';
const SIGNAL_TIMEOUT_MS = 5000;
const FALLBACK_VNDC_USD_RATE = 2700;

const getTokenByCurrency = (currency: string) => {
    if (currency.toUpperCase() === 'USDT') return MAINNET_CHAINS.bsc.usdt;
    return MAINNET_CHAINS.bsc.vndc;
};

const getPriceUsdFromGecko = async (address: string): Promise<number> => {
    try {
        const url = `${GECKO_API_URL}/${address}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(SIGNAL_TIMEOUT_MS)
        });

        if (!res.ok) {
            return 0;
        }

        const json = (await res.json()) as GeckoTerminalResponse;
        const priceString = json.data?.attributes?.price_usd;
        if (!priceString) return 0;

        const price = parseFloat(priceString);
        return isNaN(price) ? 0 : price;
    } catch (error) {
        return 0;
    }
};

// get exchange rates for RYF to USDT and VNDC
export const getRYFExchangeRates = async () => {
    try {
        const ryfPriceUsd = await getPriceUsdFromGecko(MAINNET_CHAINS.bsc.token.address);
        if (ryfPriceUsd === 0) {
            throw new Error('Unable to fetch RYF price from GeckoTerminal.');
        }

        const vndcPriceUsd = await getPriceUsdFromGecko(MAINNET_CHAINS.bsc.vndc.address);
        let vndcToUsdRate = FALLBACK_VNDC_USD_RATE;
        if (vndcPriceUsd !== 0) {
            vndcToUsdRate = 1 / vndcPriceUsd;
        }

        const usdtRate = ryfPriceUsd; // RYF to USDT
        const vndcRate = ryfPriceUsd * vndcToUsdRate; // RYF to VNDC

        return {
            usdtRate: usdtRate.toFixed(6),
            vndcRate: vndcRate.toFixed(0),
        };
    } catch (error: any) {
        throw new Error('Failed to get RYF exchange rates.');
    }
};