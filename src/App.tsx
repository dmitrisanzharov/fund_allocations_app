import dayjs from 'dayjs';
import { useMemo } from 'react';
import { Box, Divider } from '@mui/material';
import { useFundSummary } from './hooks/useFundSummary';
import { FundSummaryTable } from './components/FundSummaryTable';
import { parseFundSheetName } from './utils/fundIdentifier';

export const TODAY_TIMESTAMP = '2026-07-15T18:00:00.780Z';

export const VANECK_PRICES_SHEET = 'vaneck_NL0011683594';
export const VANECK_DIVIDENDS_SHEET = 'vaneck_NL0011683594_div';
export const GLOBAL_SELECT_PRICES_SHEET = 'GlobalSelect_DE000A0F5UH1';
export const GLOBAL_SELECT_DIVIDENDS_SHEET = 'GlobalSelect_DE000A0F5UH1_div';
export const VANGUARD_PRICES_SHEET = 'VanGuard_IE00B8GKDB10';
export const VANGUARD_DIVIDENDS_SHEET = 'VanGuard_IE00B8GKDB10_div';
export const INVESCO_EU_PRICES_SHEET = 'InvescoEu_IE00BZ4BMM98';
export const INVESCO_EU_DIVIDENDS_SHEET = 'InvescoEu_IE00BZ4BMM98_div';
export const ISHARE_EU_SELECT_PRICES_SHEET = 'iShareEuSelect_DE0002635281';
export const ISHARE_EU_SELECT_DIVIDENDS_SHEET = 'iShareEuSelect_DE0002635281_div';

function App() {
    const lastWeekWednesday = useMemo(() => dayjs(TODAY_TIMESTAMP), []);
    const fiveYearsAgo = useMemo(
        () => lastWeekWednesday.subtract(5, 'year').startOf('day'),
        [lastWeekWednesday]
    );

    // funds
    const vaneckIdentifier = parseFundSheetName(VANECK_PRICES_SHEET);
    const vaneck = useFundSummary(
        vaneckIdentifier.name,
        vaneckIdentifier.isin,
        VANECK_PRICES_SHEET,
        VANECK_DIVIDENDS_SHEET,
        fiveYearsAgo,
        lastWeekWednesday,
        0.15
    );

    const globalSelectIdentifier = parseFundSheetName(GLOBAL_SELECT_PRICES_SHEET);
    const globalSelect = useFundSummary(
        globalSelectIdentifier.name,
        globalSelectIdentifier.isin,
        GLOBAL_SELECT_PRICES_SHEET,
        GLOBAL_SELECT_DIVIDENDS_SHEET,
        fiveYearsAgo,
        lastWeekWednesday
    );

    const vanguardIdentifier = parseFundSheetName(VANGUARD_PRICES_SHEET);
    const vanguard = useFundSummary(
        vanguardIdentifier.name,
        vanguardIdentifier.isin,
        VANGUARD_PRICES_SHEET,
        VANGUARD_DIVIDENDS_SHEET,
        fiveYearsAgo,
        lastWeekWednesday
    );

    const invescoEuIdentifier = parseFundSheetName(INVESCO_EU_PRICES_SHEET);
    const invescoEu = useFundSummary(
        invescoEuIdentifier.name,
        invescoEuIdentifier.isin,
        INVESCO_EU_PRICES_SHEET,
        INVESCO_EU_DIVIDENDS_SHEET,
        fiveYearsAgo,
        lastWeekWednesday
    );

    const ishareEuSelectIdentifier = parseFundSheetName(ISHARE_EU_SELECT_PRICES_SHEET);
    const ishareEuSelect = useFundSummary(
        ishareEuSelectIdentifier.name,
        ishareEuSelectIdentifier.isin,
        ISHARE_EU_SELECT_PRICES_SHEET,
        ISHARE_EU_SELECT_DIVIDENDS_SHEET,
        fiveYearsAgo,
        lastWeekWednesday
    );

    const funds = useMemo(
        () => [vaneck, globalSelect, vanguard, invescoEu, ishareEuSelect],
        [vaneck, globalSelect, vanguard, invescoEu, ishareEuSelect]
    );

    return (
        <Box sx={{ p: 4 }}>
            <FundSummaryTable funds={funds} />
        </Box>
    );
}

export default App;
