import { useEffect, useState } from 'react';
import { fetchSheetData } from '../services/googleSheets';

interface UseSheetDataResult<T> {
    rows: T[];
    loading: boolean;
    error: string | null;
}

export function useSheetData<T = Record<string, string>>(sheetName?: string): UseSheetDataResult<T> {
    const [rows, setRows] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        fetchSheetData<T>(sheetName)
            .then(setRows)
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, [sheetName]);

    return { rows, loading, error };
}
