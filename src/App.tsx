import dayjs from 'dayjs';
import { useMemo } from 'react';
import { Box, Divider } from '@mui/material';
import { useSheetData } from './hooks/useSheetData';
import { SheetTable } from './components/SheetTable';
import { DividendRow, PriceRow } from './services/googleSheets';
import { isWithinRange } from './utils/dateRange';

const VANECK_PRICES_SHEET = 'vaneck_NL0011683594';
const VANECK_DIVIDENDS_SHEET = 'vaneck_NL0011683594_dividends';
const GLOBAL_SELECT_PRICES_SHEET = 'GlobalSelect_DE000A0F5UH1';
const GLOBAL_SELECT_DIVIDENDS_SHEET = 'GlobalSelect_DE000A0F5UH1_dividends';

function App() {
    const sevenDaysAgo = useMemo(() => dayjs().subtract(7, 'day'), []); // 10-Jul-2026
    const fiveYearsAgo = useMemo(() => sevenDaysAgo.subtract(5, 'year'), [sevenDaysAgo]);


    // VANECK FUND start

    const vaneck_prices = useSheetData<PriceRow>(VANECK_PRICES_SHEET);
    const vaneck_dividends = useSheetData<DividendRow>(VANECK_DIVIDENDS_SHEET);

    const filteredVaneckPrices = useMemo(
        () => vaneck_prices.rows.filter((row) => isWithinRange(row.date, fiveYearsAgo, sevenDaysAgo)),
        [vaneck_prices.rows, fiveYearsAgo, sevenDaysAgo]
    );
    const filteredVaneckDividends = useMemo(
        () => vaneck_dividends.rows.filter((row) => isWithinRange(row['Ex-Dividend Date'], fiveYearsAgo, sevenDaysAgo)),
        [vaneck_dividends.rows, fiveYearsAgo, sevenDaysAgo]
    );
    const vaneckPriceDifference = useMemo(() => {
        if (filteredVaneckPrices.length === 0) {
            return null;
        }

        const sortedByDate = [...filteredVaneckPrices].sort(
            (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
        );
        const oldest = sortedByDate[0];
        const newest = sortedByDate[sortedByDate.length - 1];

        return {
            oldest,
            newest,
            differenceAsPercent: ((Number(newest.Price) / Number(oldest.Price))*100).toFixed(2),
        };
    }, [filteredVaneckPrices]);
    const vaneckTotalDividends = useMemo(
        () => filteredVaneckDividends.reduce((total, row) => total + Number(row.Dividend), 0),
        [filteredVaneckDividends]
    );
    const vaneckTotalValueIncludingDividends = useMemo(() => {
        if (!vaneckPriceDifference) {
            return null;
        }

        const newestPlusDividends = Number(vaneckPriceDifference.newest.Price) + vaneckTotalDividends;

        const oldestPrice = Number(vaneckPriceDifference.oldest.Price);

        return {
            newestPlusDividends,
            differenceAsPercent: ((newestPlusDividends / oldestPrice) * 100).toFixed(2),
            correctDifferenceAsPercent: (((newestPlusDividends - oldestPrice) / oldestPrice) * 100).toFixed(2),
        };
    }, [vaneckPriceDifference, vaneckTotalDividends]);
    const vaneckAverageDividendYield = useMemo(() => {
        if (filteredVaneckDividends.length === 0) {
            return null;
        }

        const total = filteredVaneckDividends.reduce((sum, row) => sum + parseFloat(row.Yield), 0);

        return (total / filteredVaneckDividends.length).toFixed(2);
    }, [filteredVaneckDividends]);

    // VANECK FUND end

    //* ****************************************************************************************************** */

    // GLOBAL SELECT FUND start

    const global_select_prices = useSheetData<PriceRow>(GLOBAL_SELECT_PRICES_SHEET);
    const global_select_dividends = useSheetData<DividendRow>(GLOBAL_SELECT_DIVIDENDS_SHEET);

    const filteredGlobalSelectPrices = useMemo(
        () => global_select_prices.rows.filter((row) => isWithinRange(row.date, fiveYearsAgo, sevenDaysAgo)),
        [global_select_prices.rows, fiveYearsAgo, sevenDaysAgo]
    );
    const filteredGlobalSelectDividends = useMemo(
        () => global_select_dividends.rows.filter((row) => isWithinRange(row['Ex-Dividend Date'], fiveYearsAgo, sevenDaysAgo)),
        [global_select_dividends.rows, fiveYearsAgo, sevenDaysAgo]
    );
    const globalSelectPriceDifference = useMemo(() => {
        if (filteredGlobalSelectPrices.length === 0) {
            return null;
        }

        const sortedByDate = [...filteredGlobalSelectPrices].sort(
            (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
        );
        const oldest = sortedByDate[0];
        const newest = sortedByDate[sortedByDate.length - 1];

        return {
            oldest,
            newest,
            differenceAsPercent: ((Number(newest.Price) / Number(oldest.Price))*100).toFixed(2),
        };
    }, [filteredGlobalSelectPrices]);
    const globalSelectTotalDividends = useMemo(
        () => filteredGlobalSelectDividends.reduce((total, row) => total + Number(row.Dividend), 0),
        [filteredGlobalSelectDividends]
    );
    const globalSelectTotalValueIncludingDividends = useMemo(() => {
        if (!globalSelectPriceDifference) {
            return null;
        }

        const newestPlusDividends = Number(globalSelectPriceDifference.newest.Price) + globalSelectTotalDividends;

        const oldestPrice = Number(globalSelectPriceDifference.oldest.Price);

        return {
            newestPlusDividends,
            differenceAsPercent: ((newestPlusDividends / oldestPrice) * 100).toFixed(2),
            correctDifferenceAsPercent: (((newestPlusDividends - oldestPrice) / oldestPrice) * 100).toFixed(2),
        };
    }, [globalSelectPriceDifference, globalSelectTotalDividends]);
    const globalSelectAverageDividendYield = useMemo(() => {
        if (filteredGlobalSelectDividends.length === 0) {
            return null;
        }

        const total = filteredGlobalSelectDividends.reduce((sum, row) => sum + parseFloat(row.Yield), 0);

        return (total / filteredGlobalSelectDividends.length).toFixed(2);
    }, [filteredGlobalSelectDividends]);

    // GLOBAL SELECT FUND end

    return (
        <Box sx={{ p: 4 }}>
            <Box>
                <Box sx={{ textDecoration: 'underline', mb: 1 }}>VanEck</Box>
                <Box>oldest: {vaneckPriceDifference?.oldest.Price}</Box>
                <Box>newest: {vaneckPriceDifference?.newest.Price}</Box>
                <Box sx={{ mb: 1}}>total dividends: {vaneckTotalDividends.toFixed(2)}</Box>
                <Box>correct % change including dividends: {vaneckTotalValueIncludingDividends?.correctDifferenceAsPercent}</Box>
                <Box>average dividend yield for this period: {vaneckAverageDividendYield}%</Box>
            </Box>
            <Divider sx={{ my: 4 }} />
            <Box>
                <Box sx={{ textDecoration: 'underline', mb: 1 }}>GlobalSelect</Box>
                <Box>oldest: {globalSelectPriceDifference?.oldest.Price}</Box>
                <Box>newest: {globalSelectPriceDifference?.newest.Price}</Box>
                <Box sx={{ mb: 1}}>total dividends: {globalSelectTotalDividends.toFixed(2)}</Box>
                <Box>correct % change including dividends: {globalSelectTotalValueIncludingDividends?.correctDifferenceAsPercent}</Box>
                <Box>average dividend yield for this period: {globalSelectAverageDividendYield}%</Box>
            </Box>
        </Box>
    );
}

export default App;
