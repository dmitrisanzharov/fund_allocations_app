import { parseFundSheetName } from './fundIdentifier';

const VANECK_PRICES_SHEET = 'vaneck_NL0011683594';
const GLOBAL_SELECT_PRICES_SHEET = 'GlobalSelect_DE000A0F5UH1';

describe('parseFundSheetName', () => {
    it('splits the VanEck sheet name into name and isin', () => {
        expect(parseFundSheetName(VANECK_PRICES_SHEET)).toEqual({
            name: 'vaneck',
            isin: 'NL0011683594',
        });
    });

    it('splits the GlobalSelect sheet name into name and isin', () => {
        expect(parseFundSheetName(GLOBAL_SELECT_PRICES_SHEET)).toEqual({
            name: 'GlobalSelect',
            isin: 'DE000A0F5UH1',
        });
    });
});
