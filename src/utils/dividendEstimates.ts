import dayjs, { Dayjs } from 'dayjs';
import { DividendRow, PriceRow } from '../services/googleSheets';

export type QuarterKey = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export const QUARTER_KEYS: QuarterKey[] = ['Q1', 'Q2', 'Q3', 'Q4'];

export const QUARTER_START_MONTH: Record<QuarterKey, number> = { Q1: 0, Q2: 3, Q3: 6, Q4: 9 };

// how many days away a price quote may be from a payment date before we consider it unreliable
const MAX_PRICE_LOOKUP_GAP_DAYS = 10;

export interface QuarterlyDividendEstimate {
    percentage: number;
    estimatedDate: string | null;
}

function getQuarterKey(month: number): QuarterKey {
    if (month < 3) return 'Q1';
    if (month < 6) return 'Q2';
    if (month < 9) return 'Q3';
    return 'Q4';
}

function quarterStartOfYear(date: Dayjs, quarter: QuarterKey): Dayjs {
    return date.startOf('year').month(QUARTER_START_MONTH[quarter]).startOf('day');
}

function findNearestPrice(prices: PriceRow[], target: Dayjs): PriceRow | null {
    let nearest: PriceRow | null = null;
    let nearestGapDays = Infinity;

    prices.forEach((price) => {
        const priceDate = dayjs(price.date);
        if (!priceDate.isValid()) {
            return;
        }

        const gapDays = Math.abs(priceDate.diff(target, 'day'));
        if (gapDays < nearestGapDays) {
            nearestGapDays = gapDays;
            nearest = price;
        }
    });

    return nearest && nearestGapDays <= MAX_PRICE_LOOKUP_GAP_DAYS ? nearest : null;
}

// buckets historical payments by calendar quarter (any year). For each payment, the actual
// quarterly yield is derived as (dividend amount / fund price around that payment date) - the
// sheet's own Yield column is an annualized figure, not the per-payment rate, so it isn't used here.
export function calculateQuarterlyDividendEstimates(
    dividends: DividendRow[],
    prices: PriceRow[],
    netOfTaxFactor: number,
    today: Dayjs = dayjs()
): Record<QuarterKey, QuarterlyDividendEstimate> {
    const buckets: Record<QuarterKey, { yields: number[]; dayOffsets: number[] }> = {
        Q1: { yields: [], dayOffsets: [] },
        Q2: { yields: [], dayOffsets: [] },
        Q3: { yields: [], dayOffsets: [] },
        Q4: { yields: [], dayOffsets: [] }
    };

    dividends.forEach((row) => {
        const paymentDate = dayjs(row['Payment Date']);
        if (!paymentDate.isValid() || paymentDate.isAfter(today, 'day')) {
            return;
        }

        const dividendAmount = Number(row.Dividend);
        const price = findNearestPrice(prices, paymentDate);
        const priceValue = price ? Number(price.Price) : NaN;
        if (Number.isNaN(dividendAmount) || !(priceValue > 0)) {
            return;
        }

        const quarter = getQuarterKey(paymentDate.month());
        const singlePaymentYield = ((dividendAmount * netOfTaxFactor) / priceValue) * 100;
        buckets[quarter].yields.push(singlePaymentYield);
        buckets[quarter].dayOffsets.push(paymentDate.diff(quarterStartOfYear(paymentDate, quarter), 'day'));
    });

    const result = {} as Record<QuarterKey, QuarterlyDividendEstimate>;

    QUARTER_KEYS.forEach((quarter) => {
        const { yields, dayOffsets } = buckets[quarter];
        if (yields.length === 0) {
            result[quarter] = { percentage: 0, estimatedDate: null };
            return;
        }

        const percentage = yields.reduce((sum, value) => sum + value, 0) / yields.length;
        const avgDayOffset = Math.round(dayOffsets.reduce((sum, value) => sum + value, 0) / dayOffsets.length);

        let estimatedDate = quarterStartOfYear(today, quarter).add(avgDayOffset, 'day');
        if (estimatedDate.isBefore(today, 'day')) {
            estimatedDate = quarterStartOfYear(today.add(1, 'year'), quarter).add(avgDayOffset, 'day');
        }

        result[quarter] = { percentage, estimatedDate: estimatedDate.toISOString() };
    });

    return result;
}
