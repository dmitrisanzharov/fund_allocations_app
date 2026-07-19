const TRADING_DAYS_PER_YEAR = 252;

export function calculateAnnualizedReturn(startValue: number, endValue: number, years: number): number | null {
    if (startValue <= 0 || years <= 0) {
        return null;
    }

    return Math.pow(endValue / startValue, 1 / years) - 1;
}

export function calculateAnnualizedVolatility(prices: number[]): number | null {
    if (prices.length < 3) {
        return null;
    }

    const dailyReturns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
    const mean = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const variance =
        dailyReturns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (dailyReturns.length - 1);

    return Math.sqrt(variance) * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

export function calculateReturnPerRisk(
    annualizedReturn: number | null,
    annualizedVolatility: number | null
): number | null {
    if (annualizedReturn === null || !annualizedVolatility) {
        return null;
    }

    return annualizedReturn / annualizedVolatility;
}
