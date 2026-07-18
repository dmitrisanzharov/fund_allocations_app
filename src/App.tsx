import dayjs from 'dayjs';
import { useMemo } from 'react';
import { Box, Divider } from '@mui/material';
import { useFundSummary } from './hooks/useFundSummary';

const VANECK_PRICES_SHEET = 'vaneck_NL0011683594';
const VANECK_DIVIDENDS_SHEET = 'vaneck_NL0011683594_dividends';
const GLOBAL_SELECT_PRICES_SHEET = 'GlobalSelect_DE000A0F5UH1';
const GLOBAL_SELECT_DIVIDENDS_SHEET = 'GlobalSelect_DE000A0F5UH1_dividends';

function App() {
    const sevenDaysAgo = useMemo(() => dayjs().subtract(7, 'day'), []);
    const fiveYearsAgo = useMemo(() => sevenDaysAgo.subtract(5, 'year'), [sevenDaysAgo]);

    const vaneck = useFundSummary(VANECK_PRICES_SHEET, VANECK_DIVIDENDS_SHEET, fiveYearsAgo, sevenDaysAgo);
    const globalSelect = useFundSummary(
        GLOBAL_SELECT_PRICES_SHEET,
        GLOBAL_SELECT_DIVIDENDS_SHEET,
        fiveYearsAgo,
        sevenDaysAgo
    );

    return (
        <Box sx={{ p: 4 }}>
            <Box>
                <Box sx={{ textDecoration: 'underline', mb: 1 }}>VanEck</Box>
                <Box>oldest: {vaneck.oldest?.Price}</Box>
                <Box>newest: {vaneck.newest?.Price}</Box>
                <Box sx={{ mb: 1 }}>total dividends: {vaneck.totalDividends.toFixed(2)}</Box>
                <Box>correct % change including dividends: {vaneck.correctDifferenceAsPercent}</Box>
                <Box>average dividend yield for this period: {vaneck.averageDividendYield}%</Box>
            </Box>
            <Divider sx={{ my: 4 }} />
            <Box>
                <Box sx={{ textDecoration: 'underline', mb: 1 }}>GlobalSelect</Box>
                <Box>oldest: {globalSelect.oldest?.Price}</Box>
                <Box>newest: {globalSelect.newest?.Price}</Box>
                <Box sx={{ mb: 1 }}>total dividends: {globalSelect.totalDividends.toFixed(2)}</Box>
                <Box>correct % change including dividends: {globalSelect.correctDifferenceAsPercent}</Box>
                <Box>average dividend yield for this period: {globalSelect.averageDividendYield}%</Box>
            </Box>
        </Box>
    );
}

export default App;
