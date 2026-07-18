import dayjs from 'dayjs';
import { useMemo } from 'react';
import { Box } from '@mui/material';
import { useFundSummary } from './hooks/useFundSummary';
import { FundSummaryTable } from './components/FundSummaryTable';

const TODAY_TIMESTAMP = '2026-07-11T14:54:09.780Z';

const VANECK_PRICES_SHEET = 'vaneck_NL0011683594';
const VANECK_DIVIDENDS_SHEET = 'vaneck_NL0011683594_dividends';
const GLOBAL_SELECT_PRICES_SHEET = 'GlobalSelect_DE000A0F5UH1';
const GLOBAL_SELECT_DIVIDENDS_SHEET = 'GlobalSelect_DE000A0F5UH1_dividends';

function App() {
    const sevenDaysAgo = useMemo(() => dayjs(TODAY_TIMESTAMP), []);
    const fiveYearsAgo = useMemo(() => sevenDaysAgo.subtract(5, 'year'), [sevenDaysAgo]);

    const vaneck = useFundSummary(VANECK_PRICES_SHEET, VANECK_DIVIDENDS_SHEET, fiveYearsAgo, sevenDaysAgo);
    const globalSelect = useFundSummary(
        GLOBAL_SELECT_PRICES_SHEET,
        GLOBAL_SELECT_DIVIDENDS_SHEET,
        fiveYearsAgo,
        sevenDaysAgo
    );

    const funds = useMemo(
        () => [
            { name: 'VanEck', ...vaneck },
            { name: 'GlobalSelect', ...globalSelect },
        ],
        [vaneck, globalSelect]
    );

    return (
        <Box sx={{ p: 4 }}>
            <FundSummaryTable funds={funds} />
        </Box>
    );
}

export default App;
