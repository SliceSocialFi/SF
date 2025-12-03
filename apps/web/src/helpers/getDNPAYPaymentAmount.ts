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

export const getPaymentAmount = async (amountRYF: string, currency: string) => {
    const paymentToken = getTokenByCurrency(currency);
    const isVNDC = currency.toUpperCase() === 'VNDC';

    try {
        const ryfPriceUsd = await getPriceUsdFromGecko(MAINNET_CHAINS.bsc.token.address);
        
        if (ryfPriceUsd === 0) {
            throw new Error('Unable to fetch RYF price from GeckoTerminal.');
        }

        let rateToPaymentToken = 1; // Mặc định USDT = 1 USD
        if (isVNDC) {
            const vndcPriceUsd = await getPriceUsdFromGecko(MAINNET_CHAINS.bsc.vndc.address);
            if (vndcPriceUsd === 0) {
                rateToPaymentToken = FALLBACK_VNDC_USD_RATE; 
            } else {
                rateToPaymentToken = 1 / vndcPriceUsd;
            }
        }

        const totalUsdNeeded = Number(amountRYF) * ryfPriceUsd;
        const totalPay = totalUsdNeeded * rateToPaymentToken;
        const rate = totalPay / Number(amountRYF);

        const displayDecimals = isVNDC ? 0 : 6;
        const formattedAmount = totalPay.toFixed(displayDecimals);
        const rawAmount = parseUnits(totalPay.toFixed(paymentToken.decimals), paymentToken.decimals);
        const finalRate = rate.toFixed(displayDecimals);

        return {
            rawAmount,
            formattedAmount,
            rate: finalRate,
            currency: currency,
            ryfPriceUsd
        };
    } catch (error: any) {
        throw new Error('Failed to get payment amount from price oracle.');
    }
};

// Convert from payment currency (USDT/VNDC) to RYF
export const convertPaymentToRYF = async (paymentAmount: string, currency: string) => {
    const isVNDC = currency.toUpperCase() === 'VNDC';

    try {
        const ryfPriceUsd = await getPriceUsdFromGecko(MAINNET_CHAINS.bsc.token.address);
        
        if (ryfPriceUsd === 0) {
            throw new Error('Unable to fetch RYF price from GeckoTerminal.');
        }

        let paymentTokenPriceUsd = 1; // Default USDT = 1 USD
        if (isVNDC) {
            const vndcPriceUsd = await getPriceUsdFromGecko(MAINNET_CHAINS.bsc.vndc.address);
            if (vndcPriceUsd === 0) {
                paymentTokenPriceUsd = 1 / FALLBACK_VNDC_USD_RATE;
            } else {
                paymentTokenPriceUsd = vndcPriceUsd;
            }
        }

        const usdValue = Number(paymentAmount) * paymentTokenPriceUsd;
        const ryfAmount = usdValue / ryfPriceUsd;

        const displayDecimals = 6;
        const formattedAmount = ryfAmount.toFixed(displayDecimals);

        return {
            formattedAmount,
            rate: ryfAmount / Number(paymentAmount),
            ryfPriceUsd
        };
    } catch (error: any) {
        throw new Error('Failed to convert payment to RYF.');
    }
};

// Get RYF price in USD
export const getRYFPriceUSD = async () => {
    try {
        const ryfPriceUsd = await getPriceUsdFromGecko(MAINNET_CHAINS.bsc.token.address);
        
        if (ryfPriceUsd === 0) {
            throw new Error('Unable to fetch RYF price from GeckoTerminal.');
        }

        return ryfPriceUsd;
    } catch (error: any) {
        throw new Error('Failed to get RYF price.');
    }
};