import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { fetchSheetData } from './services/googleSheets';

type SheetRow = Record<string, string>;

function App() {
    const [rows, setRows] = useState<SheetRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('rows', rows);
    }, [rows]);

    useEffect(() => {
        const sheetName = process.env.REACT_APP_GOOGLE_SHEET_NAME;

        fetchSheetData<SheetRow>(sheetName)
            .then(setRows)
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return (
        <Box sx={{ p: 4 }}>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell key={column}>{column}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row, index) => (
                            <TableRow key={index}>
                                {columns.map((column) => (
                                    <TableCell key={column}>{row[column]}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default App;
