import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Box, Divider, Typography } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useFundSummary } from './hooks/useFundSummary';
import { FundSummaryTable } from './components/FundSummaryTable';
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
    const vaneck = useFundSummary(
        vaneckConfig.name,
        vaneckConfig.isin,
        vaneckConfig.pricesSheet,
        vaneckConfig.dividendsSheet,
        fiveYearsAgo,
        asOfDate,
        vaneckConfig.taxRate
    );

    const globalSelectConfig = getFundConfig('globalSelect');
    const globalSelect = useFundSummary(
        globalSelectConfig.name,
        globalSelectConfig.isin,
        globalSelectConfig.pricesSheet,
        globalSelectConfig.dividendsSheet,
        fiveYearsAgo,
        asOfDate,
        globalSelectConfig.taxRate
    );

    const vanguardConfig = getFundConfig('vanguard');
    const vanguard = useFundSummary(
        vanguardConfig.name,
        vanguardConfig.isin,
        vanguardConfig.pricesSheet,
        vanguardConfig.dividendsSheet,
        fiveYearsAgo,
        asOfDate,
        vanguardConfig.taxRate
    );

    const invescoEuConfig = getFundConfig('invescoEu');
    const invescoEu = useFundSummary(
        invescoEuConfig.name,
        invescoEuConfig.isin,
        invescoEuConfig.pricesSheet,
        invescoEuConfig.dividendsSheet,
        fiveYearsAgo,
        asOfDate,
        invescoEuConfig.taxRate
    );

    const ishareEuSelectConfig = getFundConfig('ishareEuSelect');
    const ishareEuSelect = useFundSummary(
        ishareEuSelectConfig.name,
        ishareEuSelectConfig.isin,
        ishareEuSelectConfig.pricesSheet,
        ishareEuSelectConfig.dividendsSheet,
        fiveYearsAgo,
        asOfDate,
        ishareEuSelectConfig.taxRate
    );

    const ishareEuBankConfig = getFundConfig('ishareEuBank');
    const ishareEuBank = useFundSummary(
        ishareEuBankConfig.name,
        ishareEuBankConfig.isin,
        ishareEuBankConfig.pricesSheet,
        ishareEuBankConfig.dividendsSheet,
        fiveYearsAgo,
        asOfDate,
        ishareEuBankConfig.taxRate
    );

    const ishareUkConfig = getFundConfig('ishareUk');
    const ishareUk = useFundSummary(
        ishareUkConfig.name,
        ishareUkConfig.isin,
        ishareUkConfig.pricesSheet,
        ishareUkConfig.dividendsSheet,
        fiveYearsAgo,
        asOfDate,
        ishareUkConfig.taxRate
    );

    const funds = useMemo(
        () => [
            { ...vaneck, id: vaneckConfig.id, tier: vaneckConfig.tier, value: vaneckConfig.value },
            { ...globalSelect, id: globalSelectConfig.id, tier: globalSelectConfig.tier, value: globalSelectConfig.value },
            { ...vanguard, id: vanguardConfig.id, tier: vanguardConfig.tier, value: vanguardConfig.value },
            { ...invescoEu, id: invescoEuConfig.id, tier: invescoEuConfig.tier, value: invescoEuConfig.value },
            { ...ishareEuSelect, id: ishareEuSelectConfig.id, tier: ishareEuSelectConfig.tier, value: ishareEuSelectConfig.value },
            { ...ishareEuBank, id: ishareEuBankConfig.id, tier: ishareEuBankConfig.tier, value: ishareEuBankConfig.value },
            { ...ishareUk, id: ishareUkConfig.id, tier: ishareUkConfig.tier, value: ishareUkConfig.value }
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
