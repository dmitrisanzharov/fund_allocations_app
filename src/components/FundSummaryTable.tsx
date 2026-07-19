import { useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
} from '@mui/material';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { FundSummary } from '../hooks/useFundSummary';

const AVERAGED_COLUMN_IDS = ['totalReturn', 'averageYield', 'returnPerRisk'] as const;

function averageOf(values: (string | null)[]): string | null {
    const numbers = values.filter((value): value is string => value !== null).map(Number);
    if (numbers.length === 0) {
        return null;
    }

    return (numbers.reduce((sum, value) => sum + value, 0) / numbers.length).toFixed(2);
}

const columnHelper = createColumnHelper<FundSummary>();

const columns = [
    columnHelper.accessor('isin', { header: 'ISIN' }),
    columnHelper.accessor('name', { header: 'Fund' }),
    columnHelper.accessor((row) => row.oldest?.Price, { id: 'oldest', header: 'Oldest Price' }),
    columnHelper.accessor((row) => row.newest?.Price, { id: 'newest', header: 'Newest Price' }),
    columnHelper.accessor((row) => row.totalDividends.toFixed(2), { id: 'totalDividends', header: 'Total Dividends' }),
    columnHelper.accessor((row) => row.correctDifferenceAsPercent, {
        id: 'totalReturn',
        header: 'Total Return %',
    }),
    columnHelper.accessor((row) => row.averageDividendYield, {
        id: 'averageYield',
        header: 'Avg Dividend Yield %',
    }),
    columnHelper.accessor((row) => row.returnPerRisk, {
        id: 'returnPerRisk',
        header: 'Return per Risk',
    }),
];

interface FundSummaryTableProps {
    funds: FundSummary[];
}

export function FundSummaryTable({ funds }: FundSummaryTableProps) {
    const table = useReactTable({
        data: funds,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const columnAverages = useMemo(
        () => ({
            totalReturn: averageOf(funds.map((fund) => fund.correctDifferenceAsPercent)),
            averageYield: averageOf(funds.map((fund) => fund.averageDividendYield)),
            returnPerRisk: averageOf(funds.map((fund) => fund.returnPerRisk)),
        }),
        [funds]
    );

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: 'lightgray' }}>
                        {table.getFlatHeaders().map((header) => {
                            const isAveraged = (AVERAGED_COLUMN_IDS as readonly string[]).includes(header.column.id);
                            const value = isAveraged
                                ? columnAverages[header.column.id as (typeof AVERAGED_COLUMN_IDS)[number]] ?? ''
                                : '';

                            return (
                                <TableCell key={header.id} sx={{ fontWeight: 'bold' }}>
                                    {isAveraged ? (
                                        <Tooltip title="average for column" placement="top">
                                            <span>{value}</span>
                                        </Tooltip>
                                    ) : (
                                        value
                                    )}
                                </TableCell>
                            );
                        })}
                    </TableRow>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} sx={{ backgroundColor: 'lightgray' }}>
                            {headerGroup.headers.map((header) => (
                                <TableCell key={header.id} sx={{ fontWeight: 'bold' }}>
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableHead>
                <TableBody>
                    {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
