import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
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
    const [showExtraRangePresets, setShowExtraRangePresets] = useState(false);

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

    const lgEuroConfig = getFundConfig('lgEuro');
    const lgEuro = useFundSummary(
        lgEuroConfig.name,
        lgEuroConfig.isin,
        lgEuroConfig.pricesSheet,
        lgEuroConfig.dividendsSheet,
        backDate,
        asOfDate,
        lgEuroConfig.taxRate
    );

    const wisdomTreEuConfig = getFundConfig('wisdomTreEu');
    const wisdomTreEu = useFundSummary(
        wisdomTreEuConfig.name,
        wisdomTreEuConfig.isin,
        wisdomTreEuConfig.pricesSheet,
        wisdomTreEuConfig.dividendsSheet,
        backDate,
        asOfDate,
        wisdomTreEuConfig.taxRate
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

    const funds = useMemo(() => {
        // here we add const name from the config
        const summaries = {
            vaneck,
            globalSelect,
            vanguard,
            lgEuro,
            wisdomTreEu,
            invescoEu,
            ishareEuSelect,
            ishareEuBank,
            ishareUk
        };

        return FUNDS.map((config) => ({
            ...summaries[config.id],
            id: config.id,
            tier: config.tier,
            value: config.value,
            lastValueUpdateDate: config.lastValueUpdateDate
        }));
    }, [vaneck, globalSelect, vanguard, lgEuro, wisdomTreEu, invescoEu, ishareEuSelect, ishareEuBank, ishareUk]);

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

    const analysisYears = asOfDate.diff(backDate, 'year', true).toFixed(2);

    const activeRangePreset = useMemo(() => {
        if (!asOfDate.isSame(maxSelectableDate, 'day')) {
            return null;
        }

        if (backDate.isSame(maxSelectableDate.startOf('year'), 'day')) {
            return 'ytd';
        }

        return ([5, 3, 1] as const).find((preset) =>
            backDate.isSame(maxSelectableDate.subtract(preset, 'year').startOf('day'), 'day')
        ) ?? null;
    }, [asOfDate, backDate, maxSelectableDate]);

    return (
        <Box sx={{ p: 4, width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
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
                    <Button
                        size="small"
                        variant="outlined"
                        sx={{
                            ...outlinedButtonSx,
                            backgroundColor: activeRangePreset === 5 ? '#f0f0f0' : undefined,
                            fontWeight: activeRangePreset === 5 ? 'bold' : undefined
                        }}
                        onClick={() => applyRangePreset(5)}
                    >
                        5 years
                    </Button>
                    {showExtraRangePresets && (
                        <>
                            <Button
                                size="small"
                                variant="outlined"
                                sx={{
                                    ...outlinedButtonSx,
                                    backgroundColor: activeRangePreset === 3 ? '#f0f0f0' : undefined,
                                    fontWeight: activeRangePreset === 3 ? 'bold' : undefined
                                }}
                                onClick={() => applyRangePreset(3)}
                            >
                                3 years
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                sx={{
                                    ...outlinedButtonSx,
                                    backgroundColor: activeRangePreset === 1 ? '#f0f0f0' : undefined,
                                    fontWeight: activeRangePreset === 1 ? 'bold' : undefined
                                }}
                                onClick={() => applyRangePreset(1)}
                            >
                                1 year
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                sx={{
                                    ...outlinedButtonSx,
                                    backgroundColor: activeRangePreset === 'ytd' ? '#f0f0f0' : undefined,
                                    fontWeight: activeRangePreset === 'ytd' ? 'bold' : undefined
                                }}
                                onClick={() => applyRangePreset('ytd')}
                            >
                                YTD
                            </Button>
                        </>
                    )}
                    <Tooltip title={showExtraRangePresets ? 'Hide 3 years / 1 year / YTD buttons' : 'Show 3 years / 1 year / YTD buttons'}>
                        <IconButton size="small" onClick={() => setShowExtraRangePresets((prev) => !prev)}>
                            {showExtraRangePresets ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    analysis from: {backDate.format('DD/MM/YYYY')} to: {asOfDate.format('DD/MM/YYYY')}, which is{' '}
                    {analysisYears} years | {asOfDate.diff(backDate, 'day')} days
                </Typography>
            </Box>
            <FundSummaryTable funds={funds} analysisYears={analysisYears} />
        </Box>
    );
}

export default App;
