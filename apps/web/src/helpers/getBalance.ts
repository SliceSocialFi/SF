import { BalancesBulkQuery } from "@slice/indexer";

export const getTokenBalanceBulk = (balance: BalancesBulkQuery): string | 0 => {
    return balance?.balancesBulk[0].__typename === "Erc20Amount"
        ? Number(balance.balancesBulk[0].value).toFixed(2)
            : balance?.balancesBulk[0].__typename === "NativeAmount"
                ? Number(balance.balancesBulk[0].value).toFixed(2)
                : 0;
}