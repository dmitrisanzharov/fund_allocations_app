import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useSheetData } from './hooks/useSheetData';
import { SheetTable } from './components/SheetTable';
import { DividendRow, PriceRow } from './services/googleSheets';

const VANECK_PRICES_SHEET = 'vaneck_NL0011683594';
const VANECK_DIVIDENDS_SHEET = 'vaneck_NL0011683594_dividends';
const GLOBAL_SELECT_PRICES_SHEET = 'GlobalSelect_DE000A0F5UH1';
const GLOBAL_SELECT_DIVIDENDS_SHEET = 'GlobalSelect_DE000A0F5UH1_dividends';

function App() {
    const sevenDaysAgo = useMemo(() => dayjs().subtract(7, 'day'), []);
    const fiveYearsAgo = useMemo(() => sevenDaysAgo.subtract(5, 'year'), [sevenDaysAgo]);

    console.log('============================');
    const vaneck_prices = useSheetData<PriceRow>(VANECK_PRICES_SHEET);
    console.log("vaneck_prices: ", vaneck_prices.rows);
    const vaneck_dividends = useSheetData<DividendRow>(VANECK_DIVIDENDS_SHEET);
    console.log("vaneck_dividends: ", vaneck_dividends.rows);

    // console.log('============================');
    // const global_select_prices = useSheetData<PriceRow>(GLOBAL_SELECT_PRICES_SHEET);
    // console.log("global_select_prices: ", global_select_prices.rows);
    // const global_select_dividends = useSheetData<DividendRow>(GLOBAL_SELECT_DIVIDENDS_SHEET);
    // console.log("global_select_dividends: ", global_select_dividends.rows);

    return (
        <>
        </>
    );
}

export default App;
