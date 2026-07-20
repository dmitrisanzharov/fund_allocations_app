import { useMemo } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { FundSummary } from '../hooks/useFundSummary';

const AVERAGED_COLUMN_IDS = ['totalReturn', 'averageYield', 'returnPerRisk'] as const;

const HEADER_BACKGROUND = 'lightgray';
const AVERAGED_HEADER_BACKGROUND = 'darkgray';

const COLUMN_WEIGHTS: Record<(typeof AVERAGED_COLUMN_IDS)[number], number> = {
    totalReturn: 1.5,
    averageYield: 1,
    returnPerRisk: 0.75
};

function averageOf(values: (string | null)[]): string | null {
    const numbers = values.filter((value): value is string => value !== null).map(Number);
    if (numbers.length === 0) {
        return null;
    }

    return (numbers.reduce((sum, value) => sum + value, 0) / numbers.length).toFixed(2);
}

function calculateRawScore(value: string | null, average: string | null, weight: number): number | null {
    if (value === null || average === null || Number(average) === 0) {
        return null;
    }

    return (Number(value) / Number(average)) * weight;
}

function calculateScore(value: string | null, average: string | null, weight: number): string | null {
    const rawScore = calculateRawScore(value, average, weight);
    return rawScore === null ? null : rawScore.toFixed(2);
}

const SCORE_COLUMN_CONFIG: Record<
    (typeof AVERAGED_COLUMN_IDS)[number],
    { getValue: (row: FundSummary) => string | null; header: string }
> = {
    totalReturn: { getValue: (row) => row.correctDifferenceAsPercent, header: 'Total Return Score' },
    averageYield: { getValue: (row) => row.averageDividendYield, header: 'Avg Dividend Yield Score' },
    returnPerRisk: { getValue: (row) => row.returnPerRisk, header: 'Return per Risk Score' }
};

const columnHelper = createColumnHelper<FundSummary>();

const baseColumns = [
    columnHelper.accessor('isin', { header: 'ISIN' }),
    columnHelper.accessor('name', { header: 'Fund' }),
    columnHelper.accessor((row) => row.oldest?.Price, { id: 'oldest', header: 'Oldest Price' }),
    columnHelper.accessor((row) => row.newest?.Price, { id: 'newest', header: 'Newest Price' }),
    columnHelper.accessor((row) => row.totalDividends.toFixed(2), { id: 'totalDividends', header: 'Total Dividends' }),
    columnHelper.accessor((row) => row.correctDifferenceAsPercent, {
        id: 'totalReturn',
        header: 'Total Return %'
    }),
    columnHelper.accessor((row) => row.averageDividendYield, {
        id: 'averageYield',
        header: 'Avg Dividend Yield %'
    }),
    columnHelper.accessor((row) => row.returnPerRisk, {
        id: 'returnPerRisk',
        header: 'Return per Risk'
    })
];

interface FundSummaryTableProps {
    funds: FundSummary[];
}

export function FundSummaryTable({ funds }: FundSummaryTableProps) {
    const columnAverages = useMemo(
        () => ({
            totalReturn: averageOf(funds.map((fund) => fund.correctDifferenceAsPercent)),
            averageYield: averageOf(funds.map((fund) => fund.averageDividendYield)),
            returnPerRisk: averageOf(funds.map((fund) => fund.returnPerRisk))
        }),
        [funds]
    );

    const columns = useMemo(
        () => [
            ...baseColumns,
            ...AVERAGED_COLUMN_IDS.map((id) =>
                columnHelper.accessor(
                    (row) => calculateScore(SCORE_COLUMN_CONFIG[id].getValue(row), columnAverages[id], COLUMN_WEIGHTS[id]),
                    { id: `${id}Score`, header: SCORE_COLUMN_CONFIG[id].header }
                )
            ),
            columnHelper.accessor(
                (row) => {
                    const scores = AVERAGED_COLUMN_IDS.map((id) =>
                        calculateRawScore(SCORE_COLUMN_CONFIG[id].getValue(row), columnAverages[id], COLUMN_WEIGHTS[id])
                    ).filter((score): score is number => score !== null);

                    return scores.length === 0 ? null : scores.reduce((sum, score) => sum + score, 0).toFixed(2);
                },
                { id: 'fundScore', header: 'Fund Score' }
            )
        ],
        [columnAverages]
    );

    const table = useReactTable({
        data: funds,
        columns,
        getCoreRowModel: getCoreRowModel()
    });

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: HEADER_BACKGROUND }}>
                        {table.getFlatHeaders().map((header) => {
                            const isAveraged = (AVERAGED_COLUMN_IDS as readonly string[]).includes(header.column.id);
                            const value =
                                isAveraged && columnAverages[header.column.id as (typeof AVERAGED_COLUMN_IDS)[number]];

                            return (
                                <TableCell
                                    key={header.id}
                                    sx={{
                                        fontWeight: 'bold',
                                        backgroundColor: isAveraged ? AVERAGED_HEADER_BACKGROUND : undefined
                                    }}
                                >
                                    {isAveraged && (
                                        <Tooltip title='average for column' placement='top'>
                                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                                <span>{value}</span>
                                                <InfoOutlinedIcon fontSize='small' />
                                            </Box>
                                        </Tooltip>
                                    )}
                                </TableCell>
                            );
                        })}
                    </TableRow>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} sx={{ backgroundColor: HEADER_BACKGROUND }}>
                            {headerGroup.headers.map((header) => {
                                const isAveraged = (AVERAGED_COLUMN_IDS as readonly string[]).includes(
                                    header.column.id
                                );

                                return (
                                    <TableCell
                                        key={header.id}
                                        sx={{
                                            fontWeight: 'bold',
                                            backgroundColor: isAveraged ? AVERAGED_HEADER_BACKGROUND : undefined
                                        }}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableCell>
                                );
                            })}
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
