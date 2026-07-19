import dayjs from 'dayjs';
import { useMemo } from 'react';
import { Box } from '@mui/material';
import { useFundSummary } from './hooks/useFundSummary';
import { FundSummaryTable } from './components/FundSummaryTable';
import { parseFundSheetName } from './utils/fundIdentifier';
import { TODAY_TIMESTAMP } from './App';

const VANECK_PRICES_SHEET = 'vaneck_NL0011683594';
const VANECK_DIVIDENDS_SHEET = 'vaneck_NL0011683594_dividends';
const GLOBAL_SELECT_PRICES_SHEET = 'GlobalSelect_DE000A0F5UH1';
const GLOBAL_SELECT_DIVIDENDS_SHEET = 'GlobalSelect_DE000A0F5UH1_dividends';


const VANECK_FINAL_OBJECT_MOCK = {
    name: 'vaneck',
    isin: 'NL0011683594',
    loading: false || true, // typeOf boolean
    error: 'error message', // typeOf string or null
    newestPrice: 53.6,
    oldestPrice: 28.88,
    totalDividends: 8.01,
    correctDifferenceAsPercent: '113.33%',
    averageDividendYield: '4.03%'
}

function AppManualTest() {
    const lastWeekWednesday = useMemo(() => dayjs(TODAY_TIMESTAMP), []);
    const fiveYearsAgo = useMemo(() => lastWeekWednesday.subtract(5, 'year'), [lastWeekWednesday]);

    // funds
    const vaneckIdentifier = parseFundSheetName(VANECK_PRICES_SHEET);
    const vaneck = useFundSummary(
        vaneckIdentifier.name,
        vaneckIdentifier.isin,
        VANECK_PRICES_SHEET,
        VANECK_DIVIDENDS_SHEET,
        fiveYearsAgo,
        lastWeekWednesday
    );
    console.log('vaneck', vaneck);

    const globalSelectIdentifier = parseFundSheetName(GLOBAL_SELECT_PRICES_SHEET);
    const globalSelect = useFundSummary(
        globalSelectIdentifier.name,
        globalSelectIdentifier.isin,
        GLOBAL_SELECT_PRICES_SHEET,
        GLOBAL_SELECT_DIVIDENDS_SHEET,
        fiveYearsAgo,
        lastWeekWednesday
    );

    const funds = useMemo(() => [vaneck, globalSelect], [vaneck, globalSelect]);

    return (
        <Box sx={{ p: 4 }}>
            
        </Box>
    );
}

export default AppManualTest;
