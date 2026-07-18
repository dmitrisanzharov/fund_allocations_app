import { useMemo } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useSheetData } from './useSheetData';
import { DividendRow, PriceRow } from '../services/googleSheets';
import { isWithinRange } from '../utils/dateRange';

export interface FundSummary {
    loading: boolean;
    error: string | null;
    oldest: PriceRow | null;
    newest: PriceRow | null;
    totalDividends: number;
    newestPlusDividends: number | null;
    correctDifferenceAsPercent: string | null;
    averageDividendYield: string | null;
}

export function useFundSummary(
    pricesSheet: string,
    dividendsSheet: string,
    start: Dayjs,
    end: Dayjs
): FundSummary {
    const prices = useSheetData<PriceRow>(pricesSheet); // this is price sheet data
    const dividends = useSheetData<DividendRow>(dividendsSheet); // this is dividends sheet data

    // filter by date, i.e. last 5 years and NOW is (today - 7 days)
    const filteredPrices = useMemo(
        () => prices.rows.filter((row) => isWithinRange(row.date, start, end)),
        [prices.rows, start, end]
    );
    const filteredDividends = useMemo(
        () => dividends.rows.filter((row) => isWithinRange(row['Ex-Dividend Date'], start, end)),
        [dividends.rows, start, end]
    );

    // oldest is 'starting' value and newest is 'ending' value, so we can calculate 'how much it grew' in 5 years
    const priceDifference = useMemo(() => {
        if (filteredPrices.length === 0) {
            return null;
        }

        const sortedByDate = [...filteredPrices].sort(
            (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
        );

        return { oldest: sortedByDate[0], newest: sortedByDate[sortedByDate.length - 1] };
    }, [filteredPrices]);

    // calculate total dividends for the 5 year period
    const totalDividends = useMemo(
        () => filteredDividends.reduce((total, row) => total + Number(row.Dividend), 0),
        [filteredDividends]
    );

    // calculate growth in 5 years including dividends
    const totalValueIncludingDividends = useMemo(() => {
        if (!priceDifference) {
            return null;
        }

        const newestPlusDividends = Number(priceDifference.newest.Price) + totalDividends;
        const oldestPrice = Number(priceDifference.oldest.Price);

        return {
            newestPlusDividends,
            correctDifferenceAsPercent: (((newestPlusDividends - oldestPrice) / oldestPrice) * 100).toFixed(2),
        };
    }, [priceDifference, totalDividends]);

    // here we take filteredDividends data, take 'yield' column and calculate average
    const averageDividendYield = useMemo(() => {
        if (filteredDividends.length === 0) {
            return null;
        }

        const total = filteredDividends.reduce((sum, row) => sum + parseFloat(row.Yield), 0);

        return (total / filteredDividends.length).toFixed(2);
    }, [filteredDividends]);

    // return summary
    return {
        loading: prices.loading || dividends.loading,
        error: prices.error ?? dividends.error,
        oldest: priceDifference?.oldest ?? null,
        newest: priceDifference?.newest ?? null,
        totalDividends,
        newestPlusDividends: totalValueIncludingDividends?.newestPlusDividends ?? null,
        correctDifferenceAsPercent: totalValueIncludingDividends?.correctDifferenceAsPercent ?? null,
        averageDividendYield,
    };
}
