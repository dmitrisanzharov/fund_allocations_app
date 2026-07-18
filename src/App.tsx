import { useSheetData } from './hooks/useSheetData';
import { SheetTable } from './components/SheetTable';

const PRICES_SHEET = 'vaneck_NL0011683594';
const DIVIDENDS_SHEET = 'vaneck_NL0011683594_dividends';

function App() {
    const prices = useSheetData(PRICES_SHEET);
    const dividends = useSheetData(DIVIDENDS_SHEET);

    return (
        <>
            <SheetTable title="Prices" {...prices} />
            <SheetTable title="Dividends" {...dividends} />
        </>
    );
}

export default App;
