import Papa from 'papaparse';

const SHEET_ID = process.env.REACT_APP_GOOGLE_SHEET_ID;

export async function fetchSheetData<T = Record<string, string>>(
    sheetName?: string
): Promise<T[]> {
    if (!SHEET_ID) {
        throw new Error('Set REACT_APP_GOOGLE_SHEET_ID in .env.local to connect a sheet.');
    }

    const url = new URL(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`);
    url.searchParams.set('tqx', 'out:csv');
    if (sheetName) {
        url.searchParams.set('sheet', sheetName);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(
            `Failed to fetch sheet (${response.status}). Make sure it's shared with "Anyone with the link" as Viewer.`
        );
    }

    const csv = await response.text();
    const { data, errors } = Papa.parse<T>(csv, {
        header: true,
        skipEmptyLines: true,
    });

    if (errors.length > 0) {
        throw new Error(`Failed to parse sheet CSV: ${errors[0].message}`);
    }

    return data;
}
