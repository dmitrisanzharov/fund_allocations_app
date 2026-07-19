import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { FundSummary } from '../hooks/useFundSummary';

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

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableCell key={header.id}>
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
