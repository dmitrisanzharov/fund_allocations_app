import { FundSummary } from '../hooks/useFundSummary';

export type FundSummaryMock = {
    name: string;
    isin: string;
    loading: boolean;
    error: string | null;
    newestPrice: string;
    oldestPrice: string;
    totalDividends: number;
    correctDifferenceAsPercent: string;
    averageDividendYield: string;
};

export interface ComparisonRow {
    field: string;
    expected: string;
    actual: string;
    isMatch: boolean;
}

export function buildFundComparisonRows(mock: FundSummaryMock, actual: FundSummary): ComparisonRow[] {
    const totalDividendsExpected = mock.totalDividends.toFixed(2);
    const totalDividendsActual = actual.totalDividends.toFixed(2);

    return [
        { field: 'name', expected: mock.name, actual: actual.name, isMatch: mock.name === actual.name },
        { field: 'isin', expected: mock.isin, actual: actual.isin, isMatch: mock.isin === actual.isin },
        {
            field: 'loading',
            expected: 'boolean',
            actual: typeof actual.loading,
            isMatch: typeof actual.loading === 'boolean',
        },
        {
            field: 'error',
            expected: 'null | string',
            actual: actual.error === null ? 'null' : typeof actual.error,
            isMatch: actual.error === null || typeof actual.error === 'string',
        },
        {
            field: 'oldestPrice',
            expected: mock.oldestPrice,
            actual: actual.oldest?.Price ?? '',
            isMatch: mock.oldestPrice === actual.oldest?.Price,
        },
        {
            field: 'newestPrice',
            expected: mock.newestPrice,
            actual: actual.newest?.Price ?? '',
            isMatch: mock.newestPrice === actual.newest?.Price,
        },
        {
            field: 'totalDividends',
            expected: totalDividendsExpected,
            actual: totalDividendsActual,
            isMatch: totalDividendsExpected === totalDividendsActual,
        },
        {
            field: 'correctDifferenceAsPercent',
            expected: mock.correctDifferenceAsPercent,
            actual: actual.correctDifferenceAsPercent ?? '',
            isMatch: mock.correctDifferenceAsPercent === actual.correctDifferenceAsPercent,
        },
        {
            field: 'averageDividendYield',
            expected: mock.averageDividendYield,
            actual: actual.averageDividendYield ?? '',
            isMatch: mock.averageDividendYield === actual.averageDividendYield,
        },
    ];
}
