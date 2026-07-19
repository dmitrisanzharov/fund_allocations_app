import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ComparisonRow } from '../utils/compareFundSummary';

interface ComparisonTableProps {
    rows: ComparisonRow[];
}

export function ComparisonTable({ rows }: ComparisonTableProps) {
    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: 'lightgray' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Field</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Mock Value</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Actual Value</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Match</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow
                            key={row.field}
                            sx={
                                row.isMatch
                                    ? undefined
                                    : { backgroundColor: (theme) => alpha(theme.palette.error.main, 0.08) }
                            }
                        >
                            <TableCell>{row.field}</TableCell>
                            <TableCell>{row.expected}</TableCell>
                            <TableCell>{row.actual}</TableCell>
                            <TableCell sx={{ color: row.isMatch ? 'success.main' : 'error.main' }}>
                                {row.isMatch ? 'match' : 'no match'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
