import dayjs from 'dayjs';
import { useMemo } from 'react';
import { Box } from '@mui/material';
import { useFundSummary } from './hooks/useFundSummary';
import { FundSummaryTable } from './components/FundSummaryTable';
import { parseFundSheetName } from './utils/fundIdentifier';

const TODAY_TIMESTAMP = '2026-07-11T17:00:00.780Z';

const VANECK_PRICES_SHEET = 'vaneck_NL0011683594';
const VANECK_DIVIDENDS_SHEET = 'vaneck_NL0011683594_dividends';
const GLOBAL_SELECT_PRICES_SHEET = 'GlobalSelect_DE000A0F5UH1';
const GLOBAL_SELECT_DIVIDENDS_SHEET = 'GlobalSelect_DE000A0F5UH1_dividends';


const VANECK_FINAL_OBJECT_MOCK = {
    name: 'vaneck',
    isin: 'NL0011683594',
    loading: false || true, // typeOf boolean
    error: 'error message', // typeOf string or null
    newestPrice: 52.95,
    oldestPrice: 123,
    totalDividends: 789,
    correctDifferenceAsPercent: '10%',
    averageDividendYield: '5%'
}

function AppManualTest() {
    const sevenDaysAgo = useMemo(() => dayjs(TODAY_TIMESTAMP), []);
    const fiveYearsAgo = useMemo(() => sevenDaysAgo.subtract(5, 'year'), [sevenDaysAgo]);

    // funds
    const vaneckIdentifier = parseFundSheetName(VANECK_PRICES_SHEET);
    const vaneck = useFundSummary(
        vaneckIdentifier.name,
        vaneckIdentifier.isin,
        VANECK_PRICES_SHEET,
        VANECK_DIVIDENDS_SHEET,
        fiveYearsAgo,
        sevenDaysAgo
    );
    console.log('vaneck', vaneck);

    const globalSelectIdentifier = parseFundSheetName(GLOBAL_SELECT_PRICES_SHEET);
    const globalSelect = useFundSummary(
        globalSelectIdentifier.name,
        globalSelectIdentifier.isin,
        GLOBAL_SELECT_PRICES_SHEET,
        GLOBAL_SELECT_DIVIDENDS_SHEET,
        fiveYearsAgo,
        sevenDaysAgo
    );

    const funds = useMemo(() => [vaneck, globalSelect], [vaneck, globalSelect]);

    return (
        <Box sx={{ p: 4 }}>
            
        </Box>
    );
}

export default AppManualTest;
