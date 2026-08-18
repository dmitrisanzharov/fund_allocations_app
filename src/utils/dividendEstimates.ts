import dayjs, { Dayjs } from 'dayjs';
import { DividendRow } from '../services/googleSheets';

export type QuarterKey = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export const QUARTER_KEYS: QuarterKey[] = ['Q1', 'Q2', 'Q3', 'Q4'];

const QUARTER_START_MONTH: Record<QuarterKey, number> = { Q1: 0, Q2: 3, Q3: 6, Q4: 9 };

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

// buckets historical payments by calendar quarter (any year) and, for each quarter, averages the
// net-of-tax Yield and projects the average historical day-of-quarter onto the next occurrence
export function calculateQuarterlyDividendEstimates(
    dividends: DividendRow[],
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

        const quarter = getQuarterKey(paymentDate.month());
        buckets[quarter].yields.push(parseFloat(row.Yield) * netOfTaxFactor);
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
