import dayjs from 'dayjs';
import { calculateQuarterlyDividendEstimates } from './dividendEstimates';
import { DividendRow } from '../services/googleSheets';

function makeRow(paymentDate: string, yieldValue: string): DividendRow {
    return {
        'Ex-Dividend Date': paymentDate,
        Dividend: '1',
        Type: 'Cash',
        'Payment Date': paymentDate,
        Yield: yieldValue
    };
}

describe('calculateQuarterlyDividendEstimates', () => {
    it('returns 0% and a null date for quarters with no history', () => {
        const today = dayjs('2026-08-18');
        const result = calculateQuarterlyDividendEstimates([], 1, today);

        expect(result.Q1).toEqual({ percentage: 0, estimatedDate: null });
        expect(result.Q2).toEqual({ percentage: 0, estimatedDate: null });
        expect(result.Q3).toEqual({ percentage: 0, estimatedDate: null });
        expect(result.Q4).toEqual({ percentage: 0, estimatedDate: null });
    });

    it('averages Yield across years for the same calendar quarter, net of tax', () => {
        const today = dayjs('2026-08-18');
        const dividends = [makeRow('2024-02-15', '2.0'), makeRow('2025-02-15', '4.0')];

        const result = calculateQuarterlyDividendEstimates(dividends, 0.85, today);

        expect(result.Q1.percentage).toBeCloseTo((2.0 * 0.85 + 4.0 * 0.85) / 2, 5);
    });

    it('ignores payments dated after today', () => {
        const today = dayjs('2026-08-18');
        const dividends = [makeRow('2027-02-15', '10.0')];

        const result = calculateQuarterlyDividendEstimates(dividends, 1, today);

        expect(result.Q1).toEqual({ percentage: 0, estimatedDate: null });
    });

    it('projects the average day-of-quarter onto the next upcoming occurrence', () => {
        const today = dayjs('2026-08-18');
        // Q1 (Jan-Mar) historically paid on day 14 (index 14 from Jan 1) -> Feb 15
        const dividends = [makeRow('2024-02-15', '3.0'), makeRow('2025-02-15', '3.0')];

        const result = calculateQuarterlyDividendEstimates(dividends, 1, today);

        // today is in Q3 2026, so the next Q1 occurrence is Q1 2027
        expect(result.Q1.estimatedDate).toBe(dayjs('2027-02-15').startOf('day').toISOString());
    });

    it('rolls the estimated date to next year when the quarter already passed this year', () => {
        const today = dayjs('2026-08-18');
        // Q3 (Jul-Sep) historically paid on day 14 -> Jul 15, which already passed this year
        const dividends = [makeRow('2024-07-15', '1.5'), makeRow('2025-07-15', '1.5')];

        const result = calculateQuarterlyDividendEstimates(dividends, 1, today);

        expect(result.Q3.estimatedDate).toBe(dayjs('2027-07-15').startOf('day').toISOString());
    });

    it('keeps the estimated date in the current year when the quarter has not happened yet', () => {
        const today = dayjs('2026-08-18');
        // Q4 (Oct-Dec) historically paid on day 14 -> Nov 15, still upcoming this year
        const dividends = [makeRow('2024-11-15', '1.0'), makeRow('2025-11-15', '1.0')];

        const result = calculateQuarterlyDividendEstimates(dividends, 1, today);

        expect(result.Q4.estimatedDate).toBe(dayjs('2026-11-15').startOf('day').toISOString());
    });
});
