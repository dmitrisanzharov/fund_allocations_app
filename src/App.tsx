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

    console.log('============================');
    const vaneck_prices = useSheetData<PriceRow>(VANECK_PRICES_SHEET);
    console.log("vaneck_prices: ", vaneck_prices.rows);
    const vaneck_dividends = useSheetData<DividendRow>(VANECK_DIVIDENDS_SHEET);
    console.log("vaneck_dividends: ", vaneck_dividends.rows);

    const filteredVaneckPrices = useMemo(
        () => vaneck_prices.rows.filter((row) => isWithinRange(row.date, fiveYearsAgo, sevenDaysAgo)),
        [vaneck_prices.rows, fiveYearsAgo, sevenDaysAgo]
    );
    const filteredVaneckDividends = useMemo(
        () => vaneck_dividends.rows.filter((row) => isWithinRange(row['Ex-Dividend Date'], fiveYearsAgo, sevenDaysAgo)),
        [vaneck_dividends.rows, fiveYearsAgo, sevenDaysAgo]
    );
    console.log('filteredVaneckPrices', filteredVaneckPrices);
    console.log('filteredVaneckDividends', filteredVaneckDividends);

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
    console.log('vaneckPriceDifference', vaneckPriceDifference);

    const vaneckTotalDividends = useMemo(
        () => filteredVaneckDividends.reduce((total, row) => total + Number(row.Dividend), 0),
        [filteredVaneckDividends]
    );
    console.log('vaneckTotalDividends', vaneckTotalDividends);

    const vaneckTotalValueIncludingDividends = useMemo(() => {
        if (!vaneckPriceDifference) {
            return null;
        }

        const newestPlusDividends = Number(vaneckPriceDifference.newest.Price) + vaneckTotalDividends;

        return {
            newestPlusDividends,
            differenceAsPercent: ((newestPlusDividends / Number(vaneckPriceDifference.oldest.Price)) * 100).toFixed(2),
        };
    }, [vaneckPriceDifference, vaneckTotalDividends]);
    console.log('vaneckTotalValueIncludingDividends', vaneckTotalValueIncludingDividends);

    // console.log('============================');
    // const global_select_prices = useSheetData<PriceRow>(GLOBAL_SELECT_PRICES_SHEET);
    // console.log("global_select_prices: ", global_select_prices.rows);
    // const global_select_dividends = useSheetData<DividendRow>(GLOBAL_SELECT_DIVIDENDS_SHEET);
    // console.log("global_select_dividends: ", global_select_dividends.rows);

    return (
        <Box sx={{ p: 4 }}>
            <Box>
                <Box>VanEck</Box>
                <Box>oldest: {vaneckPriceDifference?.oldest.Price}</Box>
                <Box>newest: {vaneckPriceDifference?.newest.Price}</Box>
                <Box>difference: {vaneckPriceDifference?.differenceAsPercent}</Box>
                <Box>total dividends: {vaneckTotalDividends.toFixed(2)}</Box>
                <Box>newest + dividends: {vaneckTotalValueIncludingDividends?.newestPlusDividends.toFixed(2)}</Box>
                <Box>difference including dividends: {vaneckTotalValueIncludingDividends?.differenceAsPercent}</Box>
            </Box>
            <Divider sx={{ my: 4 }} />
        </Box>
    );
}

export default App;
