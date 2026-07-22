import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Box, Divider, Typography } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useFundSummary } from './hooks/useFundSummary';
import { FundSummaryTable } from './components/FundSummaryTable';
import { parseFundSheetName } from './utils/fundIdentifier';
import { FUNDS, FundConfig } from './constants';

function getFundConfig(id: (typeof FUNDS)[number]['id']): FundConfig {
    const config = FUNDS.find((fund) => fund.id === id);
    if (!config) {
        throw new Error(`Missing fund config for id: ${id}`);
    }

    return config;
}

function App() {
    const [asOfDate, setAsOfDate] = useState<Dayjs>(() => dayjs().startOf('day'));
    const fiveYearsAgo = useMemo(() => asOfDate.subtract(5, 'year').startOf('day'), [asOfDate]);

    // funds
    const vaneckConfig = getFundConfig('vaneck');
    const vaneckIdentifier = parseFundSheetName(vaneckConfig.pricesSheet);
    const vaneck = useFundSummary(
        vaneckIdentifier.name,
        vaneckIdentifier.isin,
        vaneckConfig.pricesSheet,
        vaneckConfig.dividendsSheet,
        fiveYearsAgo,
        asOfDate,
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
        asOfDate,
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
        asOfDate,
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
        asOfDate,
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
        asOfDate,
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
        asOfDate,
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
        asOfDate,
        ishareUkConfig.taxRate
    );

    const funds = useMemo(
        () => [
            { ...vaneck, tier: vaneckConfig.tier },
            { ...globalSelect, tier: globalSelectConfig.tier },
            { ...vanguard, tier: vanguardConfig.tier },
            { ...invescoEu, tier: invescoEuConfig.tier },
            { ...ishareEuSelect, tier: ishareEuSelectConfig.tier },
            { ...ishareEuBank, tier: ishareEuBankConfig.tier },
            { ...ishareUk, tier: ishareUkConfig.tier }
        ],
        [vaneck, globalSelect, vanguard, invescoEu, ishareEuSelect, ishareEuBank, ishareUk]
    );

    // most recent date for which every fund has data, i.e. the lowest of each fund's latestAvailableDate
    const maxSelectableDate = useMemo(() => {
        const latestDates = funds
            .map((fund) => fund.latestAvailableDate)
            .filter((date): date is string => date !== null)
            .map((date) => dayjs(date).startOf('day'));

        const today = dayjs().startOf('day');
        if (latestDates.length === 0) {
            return today;
        }

        return latestDates.reduce((lowest, date) => (date.isBefore(lowest) ? date : lowest), today);
    }, [funds]);

    useEffect(() => {
        if (asOfDate.isAfter(maxSelectableDate)) {
            setAsOfDate(maxSelectableDate);
        }
    }, [asOfDate, maxSelectableDate]);

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ mb: 4 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        label="As of date"
                        format="DD/MM/YYYY"
                        value={asOfDate}
                        maxDate={maxSelectableDate}
                        onChange={(newDate) => {
                            if (newDate) {
                                setAsOfDate(newDate.startOf('day'));
                            }
                        }}
                    />
                </LocalizationProvider>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    analysis from: {fiveYearsAgo.format('DD/MM/YYYY')} to: {asOfDate.format('DD/MM/YYYY')}, which is{' '}
                    {asOfDate.diff(fiveYearsAgo, 'year')} years | {asOfDate.diff(fiveYearsAgo, 'day')} days
                </Typography>
            </Box>
            <FundSummaryTable funds={funds} />
        </Box>
    );
}

export default App;
