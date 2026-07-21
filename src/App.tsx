import dayjs from 'dayjs';
import { useMemo } from 'react';
import { Box, Divider } from '@mui/material';
import { useFundSummary } from './hooks/useFundSummary';
import { FundSummaryTable } from './components/FundSummaryTable';
import { parseFundSheetName } from './utils/fundIdentifier';
import { FUNDS, FundConfig, TODAY_TIMESTAMP } from './constants';

function getFundConfig(id: (typeof FUNDS)[number]['id']): FundConfig {
    const config = FUNDS.find((fund) => fund.id === id);
    if (!config) {
        throw new Error(`Missing fund config for id: ${id}`);
    }

    return config;
}

function App() {
    const lastWeekWednesday = useMemo(() => dayjs(TODAY_TIMESTAMP), []);
    const fiveYearsAgo = useMemo(
        () => lastWeekWednesday.subtract(5, 'year').startOf('day'),
        [lastWeekWednesday]
    );

    // funds
    const vaneckConfig = getFundConfig('vaneck');
    const vaneckIdentifier = parseFundSheetName(vaneckConfig.pricesSheet);
    const vaneck = useFundSummary(
        vaneckIdentifier.name,
        vaneckIdentifier.isin,
        vaneckConfig.pricesSheet,
        vaneckConfig.dividendsSheet,
        fiveYearsAgo,
        lastWeekWednesday,
        vaneckConfig.taxRate
    );

    const globalSelectConfig = getFundConfig('globalSelect');
    const globalSelectIdentifier = parseFundSheetName(globalSelectConfig.pricesSheet);
    const globalSelect = useFundSummary(
        globalSelectIdentifier.name,
        globalSelectIdentifier.isin,
        globalSelectConfig.pricesSheet,
        globalSelectConfig.dividendsSheet,
        fiveYearsAgo,
        lastWeekWednesday,
        globalSelectConfig.taxRate
    );

    const vanguardConfig = getFundConfig('vanguard');
    const vanguardIdentifier = parseFundSheetName(vanguardConfig.pricesSheet);
    const vanguard = useFundSummary(
        vanguardIdentifier.name,
        vanguardIdentifier.isin,
        vanguardConfig.pricesSheet,
        vanguardConfig.dividendsSheet,
        fiveYearsAgo,
        lastWeekWednesday,
        vanguardConfig.taxRate
    );

    const invescoEuConfig = getFundConfig('invescoEu');
    const invescoEuIdentifier = parseFundSheetName(invescoEuConfig.pricesSheet);
    const invescoEu = useFundSummary(
        invescoEuIdentifier.name,
        invescoEuIdentifier.isin,
        invescoEuConfig.pricesSheet,
        invescoEuConfig.dividendsSheet,
        fiveYearsAgo,
        lastWeekWednesday,
        invescoEuConfig.taxRate
    );

    const ishareEuSelectConfig = getFundConfig('ishareEuSelect');
    const ishareEuSelectIdentifier = parseFundSheetName(ishareEuSelectConfig.pricesSheet);
    const ishareEuSelect = useFundSummary(
        ishareEuSelectIdentifier.name,
        ishareEuSelectIdentifier.isin,
        ishareEuSelectConfig.pricesSheet,
        ishareEuSelectConfig.dividendsSheet,
        fiveYearsAgo,
        lastWeekWednesday,
        ishareEuSelectConfig.taxRate
    );

    const ishareEuBankConfig = getFundConfig('ishareEuBank');
    const ishareEuBankIdentifier = parseFundSheetName(ishareEuBankConfig.pricesSheet);
    const ishareEuBank = useFundSummary(
        ishareEuBankIdentifier.name,
        ishareEuBankIdentifier.isin,
        ishareEuBankConfig.pricesSheet,
        ishareEuBankConfig.dividendsSheet,
        fiveYearsAgo,
        lastWeekWednesday,
        ishareEuBankConfig.taxRate
    );

    const ishareUkConfig = getFundConfig('ishareUk');
    const ishareUkIdentifier = parseFundSheetName(ishareUkConfig.pricesSheet);
    const ishareUk = useFundSummary(
        ishareUkIdentifier.name,
        ishareUkIdentifier.isin,
        ishareUkConfig.pricesSheet,
        ishareUkConfig.dividendsSheet,
        fiveYearsAgo,
        lastWeekWednesday,
        ishareUkConfig.taxRate
    );

    const funds = useMemo(
        () => [vaneck, globalSelect, vanguard, invescoEu, ishareEuSelect, ishareEuBank, ishareUk],
        [vaneck, globalSelect, vanguard, invescoEu, ishareEuSelect, ishareEuBank, ishareUk]
    );

    return (
        <Box sx={{ p: 4 }}>
            <FundSummaryTable funds={funds} />
        </Box>
    );
}

export default App;
