export interface FundIdentifier {
    name: string;
    isin: string;
}

export function parseFundSheetName(sheetName: string): FundIdentifier {
    const [name, isin] = sheetName.split('_');
    return { name, isin };
}
