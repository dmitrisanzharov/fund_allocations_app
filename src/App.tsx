import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Divider, Typography } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useFundSummary } from './hooks/useFundSummary';
import { FundSummaryTable } from './components/FundSummaryTable';
import { FUNDS, FundConfig } from './constants';
import { outlinedButtonSx } from './styles';

function getFundConfig(id: (typeof FUNDS)[number]['id']): FundConfig {
    const config = FUNDS.find((fund) => fund.id === id);
    if (!config) {
        throw new Error(`Missing fund config for id: ${id}`);
    }

    return config;
}

function App() {
    const [asOfDate, setAsOfDate] = useState<Dayjs>(() => dayjs().startOf('day'));
    const [backDate, setBackDate] = useState<Dayjs>(() => dayjs().subtract(5, 'year').startOf('day'));
    const [isBackDateManual, setIsBackDateManual] = useState(false);

    // funds
    const vaneckConfig = getFundConfig('vaneck');
    const vaneck = useFundSummary(
        vaneckConfig.name,
        vaneckConfig.isin,
        vaneckConfig.pricesSheet,
        vaneckConfig.dividendsSheet,
        backDate,
        asOfDate,
        vaneckConfig.taxRate
    );

    const globalSelectConfig = getFundConfig('globalSelect');
    const globalSelect = useFundSummary(
        globalSelectConfig.name,
        globalSelectConfig.isin,
        globalSelectConfig.pricesSheet,
        globalSelectConfig.dividendsSheet,
        backDate,
        asOfDate,
        globalSelectConfig.taxRate
    );

    const vanguardConfig = getFundConfig('vanguard');
    const vanguard = useFundSummary(
        vanguardConfig.name,
        vanguardConfig.isin,
        vanguardConfig.pricesSheet,
        vanguardConfig.dividendsSheet,
        backDate,
        asOfDate,
        vanguardConfig.taxRate
    );

    const invescoEuConfig = getFundConfig('invescoEu');
    const invescoEu = useFundSummary(
        invescoEuConfig.name,
        invescoEuConfig.isin,
        invescoEuConfig.pricesSheet,
        invescoEuConfig.dividendsSheet,
        backDate,
        asOfDate,
        invescoEuConfig.taxRate
    );

    const ishareEuSelectConfig = getFundConfig('ishareEuSelect');
    const ishareEuSelect = useFundSummary(
        ishareEuSelectConfig.name,
        ishareEuSelectConfig.isin,
        ishareEuSelectConfig.pricesSheet,
        ishareEuSelectConfig.dividendsSheet,
        backDate,
        asOfDate,
        ishareEuSelectConfig.taxRate
    );

    const ishareEuBankConfig = getFundConfig('ishareEuBank');
    const ishareEuBank = useFundSummary(
        ishareEuBankConfig.name,
        ishareEuBankConfig.isin,
        ishareEuBankConfig.pricesSheet,
        ishareEuBankConfig.dividendsSheet,
        backDate,
        asOfDate,
        ishareEuBankConfig.taxRate
    );

    const ishareUkConfig = getFundConfig('ishareUk');
    const ishareUk = useFundSummary(
        ishareUkConfig.name,
        ishareUkConfig.isin,
        ishareUkConfig.pricesSheet,
        ishareUkConfig.dividendsSheet,
        backDate,
        asOfDate,
        ishareUkConfig.taxRate
    );

    const funds = useMemo(
        () => [
            {
                ...vaneck,
                id: vaneckConfig.id,
                tier: vaneckConfig.tier,
                value: vaneckConfig.value,
                lastValueUpdateDate: vaneckConfig.lastValueUpdateDate
            },
            {
                ...globalSelect,
                id: globalSelectConfig.id,
                tier: globalSelectConfig.tier,
                value: globalSelectConfig.value,
                lastValueUpdateDate: globalSelectConfig.lastValueUpdateDate
            },
            {
                ...vanguard,
                id: vanguardConfig.id,
                tier: vanguardConfig.tier,
                value: vanguardConfig.value,
                lastValueUpdateDate: vanguardConfig.lastValueUpdateDate
            },
            {
                ...invescoEu,
                id: invescoEuConfig.id,
                tier: invescoEuConfig.tier,
                value: invescoEuConfig.value,
                lastValueUpdateDate: invescoEuConfig.lastValueUpdateDate
            },
            {
                ...ishareEuSelect,
                id: ishareEuSelectConfig.id,
                tier: ishareEuSelectConfig.tier,
                value: ishareEuSelectConfig.value,
                lastValueUpdateDate: ishareEuSelectConfig.lastValueUpdateDate
            },
            {
                ...ishareEuBank,
                id: ishareEuBankConfig.id,
                tier: ishareEuBankConfig.tier,
                value: ishareEuBankConfig.value,
                lastValueUpdateDate: ishareEuBankConfig.lastValueUpdateDate
            },
            {
                ...ishareUk,
                id: ishareUkConfig.id,
                tier: ishareUkConfig.tier,
                value: ishareUkConfig.value,
                lastValueUpdateDate: ishareUkConfig.lastValueUpdateDate
            }
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

    const applyRangePreset = (preset: 5 | 3 | 1 | 'ytd') => {
        setAsOfDate(maxSelectableDate);

        if (preset === 'ytd') {
            setIsBackDateManual(true);
            setBackDate(maxSelectableDate.startOf('year'));
            return;
        }

        setIsBackDateManual(preset !== 5);
        setBackDate(maxSelectableDate.subtract(preset, 'year').startOf('day'));
    };

    useEffect(() => {
        if (isBackDateManual) {
            if (backDate.isAfter(asOfDate)) {
                setBackDate(asOfDate);
            }
            return;
        }

        const defaultBackDate = asOfDate.subtract(5, 'year').startOf('day');
        if (!backDate.isSame(defaultBackDate)) {
            setBackDate(defaultBackDate);
        }
    }, [asOfDate, backDate, isBackDateManual]);

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ mb: 4 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <DatePicker
                            label="As of date / today"
                            format="DD/MM/YYYY"
                            value={asOfDate}
                            maxDate={maxSelectableDate}
                            onChange={(newDate) => {
                                if (newDate) {
                                    setAsOfDate(newDate.startOf('day'));
                                }
                            }}
                        />
                        <DatePicker
                            label="Starting / back date (default 5 years)"
                            format="DD/MM/YYYY"
                            value={backDate}
                            maxDate={asOfDate}
                            onChange={(newDate) => {
                                if (newDate) {
                                    setIsBackDateManual(true);
                                    setBackDate(newDate.startOf('day'));
                                }
                            }}
                        />
                    </Box>
                </LocalizationProvider>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button size="small" variant="outlined" sx={outlinedButtonSx} onClick={() => applyRangePreset(5)}>
                        5 years
                    </Button>
                    <Button size="small" variant="outlined" sx={outlinedButtonSx} onClick={() => applyRangePreset(3)}>
                        3 years
                    </Button>
                    <Button size="small" variant="outlined" sx={outlinedButtonSx} onClick={() => applyRangePreset(1)}>
                        1 year
                    </Button>
                    <Button size="small" variant="outlined" sx={outlinedButtonSx} onClick={() => applyRangePreset('ytd')}>
                        YTD
                    </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    analysis from: {backDate.format('DD/MM/YYYY')} to: {asOfDate.format('DD/MM/YYYY')}, which is{' '}
                    {asOfDate.diff(backDate, 'year', true).toFixed(2)} years | {asOfDate.diff(backDate, 'day')} days
                </Typography>
            </Box>
            <FundSummaryTable funds={funds} />
        </Box>
    );
}

export default App;
