import {
    calculateAnnualizedReturn,
    calculateAnnualizedVolatility,
    calculateReturnPerRisk,
} from './riskMetrics';

describe('calculateAnnualizedReturn', () => {
    it('computes CAGR for a known start/end value over 5 years', () => {
        // 100 -> 200 over 5 years is a well-known ~14.87% CAGR
        expect(calculateAnnualizedReturn(100, 200, 5)).toBeCloseTo(0.148698, 5);
    });

    it('returns null when startValue is zero or negative', () => {
        expect(calculateAnnualizedReturn(0, 200, 5)).toBeNull();
        expect(calculateAnnualizedReturn(-10, 200, 5)).toBeNull();
    });

    it('returns null when years is zero or negative', () => {
        expect(calculateAnnualizedReturn(100, 200, 0)).toBeNull();
        expect(calculateAnnualizedReturn(100, 200, -1)).toBeNull();
    });
});

describe('calculateAnnualizedVolatility', () => {
    it('returns null with fewer than 3 prices', () => {
        expect(calculateAnnualizedVolatility([])).toBeNull();
        expect(calculateAnnualizedVolatility([100])).toBeNull();
        expect(calculateAnnualizedVolatility([100, 101])).toBeNull();
    });

    it('computes annualized volatility from a small synthetic price series', () => {
        // daily returns: +2%, -2%, +2% -> sample stdev of [0.02, -0.02, 0.02] is 0.02309401...
        const prices = [100, 102, 99.96, 101.9592];
        const result = calculateAnnualizedVolatility(prices);

        expect(result).not.toBeNull();
        expect(result).toBeCloseTo(0.02309401 * Math.sqrt(252), 4);
    });
});

describe('calculateReturnPerRisk', () => {
    it('divides annualized return by annualized volatility', () => {
        expect(calculateReturnPerRisk(0.111, 0.117)).toBeCloseTo(0.9487, 4);
    });

    it('returns null when either input is null', () => {
        expect(calculateReturnPerRisk(null, 0.117)).toBeNull();
        expect(calculateReturnPerRisk(0.111, null)).toBeNull();
    });

    it('returns null when volatility is zero', () => {
        expect(calculateReturnPerRisk(0.111, 0)).toBeNull();
    });
});
