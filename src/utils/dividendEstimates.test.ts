import dayjs from 'dayjs';
import { calculateQuarterlyDividendEstimates } from './dividendEstimates';
import { DividendRow, PriceRow } from '../services/googleSheets';

function makeDividendRow(paymentDate: string, dividend: string, yieldValue = '999'): DividendRow {
    return {
        'Ex-Dividend Date': paymentDate,
        Dividend: dividend,
        Type: 'Cash',
        'Payment Date': paymentDate,
        Yield: yieldValue
    };
}

function makePriceRow(date: string, price: string): PriceRow {
    return { date, Price: price, Open: price, High: price, Low: price, 'Vol.': '0', 'Change %': '0' };
}

describe('calculateQuarterlyDividendEstimates', () => {
    it('returns 0% and a null date for quarters with no history', () => {
        const today = dayjs('2026-08-18');
        const result = calculateQuarterlyDividendEstimates([], [], 1, today);

        expect(result.Q1).toEqual({ percentage: 0, estimatedDate: null });
        expect(result.Q2).toEqual({ percentage: 0, estimatedDate: null });
        expect(result.Q3).toEqual({ percentage: 0, estimatedDate: null });
        expect(result.Q4).toEqual({ percentage: 0, estimatedDate: null });
    });

    it('derives the yield from dividend / price at the payment date, ignoring the Yield column', () => {
        const today = dayjs('2026-08-18');
        const dividends = [makeDividendRow('2025-02-15', '2', '999')];
        const prices = [makePriceRow('2025-02-15', '100')];

        const result = calculateQuarterlyDividendEstimates(dividends, prices, 1, today);

        expect(result.Q1.percentage).toBeCloseTo(2, 5);
    });

    it('applies the net-of-tax factor to the dividend amount before dividing by price', () => {
        const today = dayjs('2026-08-18');
        const dividends = [makeDividendRow('2025-02-15', '2')];
        const prices = [makePriceRow('2025-02-15', '100')];

        const result = calculateQuarterlyDividendEstimates(dividends, prices, 0.85, today);

        expect(result.Q1.percentage).toBeCloseTo(1.7, 5);
    });

    it('uses the nearest available price when there is no exact match for the payment date', () => {
        const today = dayjs('2026-08-18');
        const dividends = [makeDividendRow('2025-02-16', '2')];
        const prices = [makePriceRow('2025-02-14', '100'), makePriceRow('2025-02-20', '50')];

        const result = calculateQuarterlyDividendEstimates(dividends, prices, 1, today);

        // 16th is 2 days from the 14th and 4 days from the 20th -> nearest is the 14th's price of 100
        expect(result.Q1.percentage).toBeCloseTo(2, 5);
    });

    it('skips a payment when no price is available within the lookup window', () => {
        const today = dayjs('2026-08-18');
        const dividends = [makeDividendRow('2025-02-15', '2')];
        const prices = [makePriceRow('2025-01-01', '100')];

        const result = calculateQuarterlyDividendEstimates(dividends, prices, 1, today);

        expect(result.Q1).toEqual({ percentage: 0, estimatedDate: null });
    });

    it('averages the derived yield across years for the same calendar quarter', () => {
        const today = dayjs('2026-08-18');
        const dividends = [makeDividendRow('2024-02-15', '2'), makeDividendRow('2025-02-15', '5')];
        const prices = [makePriceRow('2024-02-15', '100'), makePriceRow('2025-02-15', '100')];

        const result = calculateQuarterlyDividendEstimates(dividends, prices, 1, today);

        expect(result.Q1.percentage).toBeCloseTo((2 + 5) / 2, 5);
    });

    it('ignores payments dated after today', () => {
        const today = dayjs('2026-08-18');
        const dividends = [makeDividendRow('2027-02-15', '10')];
        const prices = [makePriceRow('2027-02-15', '100')];

        const result = calculateQuarterlyDividendEstimates(dividends, prices, 1, today);

        expect(result.Q1).toEqual({ percentage: 0, estimatedDate: null });
    });

    it('projects the average day-of-quarter onto the next upcoming occurrence', () => {
        const today = dayjs('2026-08-18');
        const dividends = [makeDividendRow('2024-02-15', '3'), makeDividendRow('2025-02-15', '3')];
        const prices = [makePriceRow('2024-02-15', '100'), makePriceRow('2025-02-15', '100')];

        const result = calculateQuarterlyDividendEstimates(dividends, prices, 1, today);

        // today is in Q3 2026, so the next Q1 occurrence is Q1 2027
        expect(result.Q1.estimatedDate).toBe(dayjs('2027-02-15').startOf('day').toISOString());
    });

    it('rolls the estimated date to next year when the quarter already passed this year', () => {
        const today = dayjs('2026-08-18');
        const dividends = [makeDividendRow('2024-07-15', '1.5'), makeDividendRow('2025-07-15', '1.5')];
        const prices = [makePriceRow('2024-07-15', '100'), makePriceRow('2025-07-15', '100')];

        const result = calculateQuarterlyDividendEstimates(dividends, prices, 1, today);

        expect(result.Q3.estimatedDate).toBe(dayjs('2027-07-15').startOf('day').toISOString());
    });

    it('keeps the estimated date in the current year when the quarter has not happened yet', () => {
        const today = dayjs('2026-08-18');
        const dividends = [makeDividendRow('2024-11-15', '1'), makeDividendRow('2025-11-15', '1')];
        const prices = [makePriceRow('2024-11-15', '100'), makePriceRow('2025-11-15', '100')];

        const result = calculateQuarterlyDividendEstimates(dividends, prices, 1, today);

        expect(result.Q4.estimatedDate).toBe(dayjs('2026-11-15').startOf('day').toISOString());
    });
});
