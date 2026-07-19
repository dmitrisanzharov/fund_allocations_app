import { useMemo } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useSheetData } from './useSheetData';
import { DividendRow, PriceRow } from '../services/googleSheets';
import { isWithinRange } from '../utils/dateRange';
import { calculateAnnualizedReturn, calculateAnnualizedVolatility, calculateReturnPerRisk } from '../utils/riskMetrics';

export interface FundSummary {
    name: string;
    isin: string;
    loading: boolean;
    error: string | null;
    oldest: PriceRow | null;
    newest: PriceRow | null;
    totalDividends: number;
    newestPlusDividends: number | null;
    correctDifferenceAsPercent: string | null;
    averageDividendYield: string | null;
    returnPerRisk: string | null;
}

export function useFundSummary(
    name: string,
    isin: string,
    pricesSheet: string,
    dividendsSheet: string,
    start: Dayjs,
    end: Dayjs,
    taxRate?: number
): FundSummary {
    const prices = useSheetData<PriceRow>(pricesSheet); // this is price sheet data
    const dividends = useSheetData<DividendRow>(dividendsSheet); // this is dividends sheet data
    const netOfTaxFactor = 1 - (taxRate ?? 0); // this is if fund is taxed

    // filter by date, i.e. last 5 years and NOW is (today - 7 days)
    const filteredPrices = useMemo(
        () => prices.rows.filter((row) => isWithinRange(row.date, start, end)),
        [prices.rows, start, end]
    );
    const filteredDividends = useMemo(
        () => dividends.rows.filter((row) => isWithinRange(row['Ex-Dividend Date'], start, end)),
        [dividends.rows, start, end]
    );

    const sortedPrices = useMemo(
        () => [...filteredPrices].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()),
        [filteredPrices]
    );

    // oldest is 'starting' value and newest is 'ending' value, so we can calculate 'how much it grew' in 5 years
    const priceDifference = useMemo(() => {
        if (sortedPrices.length === 0) {
            return null;
        }

        return { oldest: sortedPrices[0], newest: sortedPrices[sortedPrices.length - 1] };
    }, [sortedPrices]);

    // calculate total dividends for the 5 year period, net of tax
    const totalDividends = useMemo(
        () => filteredDividends.reduce((total, row) => total + Number(row.Dividend) * netOfTaxFactor, 0),
        [filteredDividends, netOfTaxFactor]
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

    // here we take filteredDividends data, take 'yield' column and calculate average, net of tax
    const averageDividendYield = useMemo(() => {
        if (filteredDividends.length === 0) {
            return null;
        }

        const total = filteredDividends.reduce((sum, row) => sum + parseFloat(row.Yield) * netOfTaxFactor, 0);

        return (total / filteredDividends.length).toFixed(2);
    }, [filteredDividends, netOfTaxFactor]);

    // annualized total return (incl. dividends) divided by annualized volatility of daily prices
    const returnPerRisk = useMemo(() => {
        if (!priceDifference || !totalValueIncludingDividends || sortedPrices.length < 3) {
            return null;
        }

        const years = dayjs(priceDifference.newest.date).diff(priceDifference.oldest.date, 'day') / 365.25;
        const annualizedReturn = calculateAnnualizedReturn(
            Number(priceDifference.oldest.Price),
            totalValueIncludingDividends.newestPlusDividends,
            years
        );
        const annualizedVolatility = calculateAnnualizedVolatility(
            sortedPrices.map((row) => Number(row.Price))
        );
        const ratio = calculateReturnPerRisk(annualizedReturn, annualizedVolatility);

        return ratio !== null ? ratio.toFixed(2) : null;
    }, [priceDifference, totalValueIncludingDividends, sortedPrices]);

    // return summary
    return {
        name,
        isin,
        loading: prices.loading || dividends.loading,
        error: prices.error ?? dividends.error,
        oldest: priceDifference?.oldest ?? null,
        newest: priceDifference?.newest ?? null,
        totalDividends,
        newestPlusDividends: totalValueIncludingDividends?.newestPlusDividends ?? null,
        correctDifferenceAsPercent: totalValueIncludingDividends?.correctDifferenceAsPercent ?? null,
        averageDividendYield,
        returnPerRisk,
    };
}
