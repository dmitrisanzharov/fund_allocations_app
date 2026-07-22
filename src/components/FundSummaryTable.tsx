import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
    Box,
    Checkbox,
    IconButton,
    ListItemText,
    Menu,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { FundSummary } from '../hooks/useFundSummary';
import { FUND_TIER_OBJ, FundTierKey } from '../constants';

type FundRow = FundSummary & { tier: FundTierKey; id: string; value: number };

const AVERAGED_COLUMN_IDS = ['totalReturn', 'averageYield', 'returnPerRisk'] as const;

const STALE_DATA_THRESHOLD_DAYS = 14;
const STALE_DATA_BACKGROUND = '#ef9a9a';

const HEADER_BACKGROUND = 'lightgray';
const AVERAGED_HEADER_BACKGROUND = 'darkgray';
const ALLOCATION_HEADER_BACKGROUND = 'darkgoldenrod';
const FUND_SCORE_HEADER_BACKGROUND = 'green';

const HIGHLIGHTED_HEADER_BACKGROUNDS: Record<string, string> = {
    totalReturn: AVERAGED_HEADER_BACKGROUND,
    averageYield: AVERAGED_HEADER_BACKGROUND,
    returnPerRisk: AVERAGED_HEADER_BACKGROUND,
    finalAllocation: ALLOCATION_HEADER_BACKGROUND,
    fundScore: FUND_SCORE_HEADER_BACKGROUND
};

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

function sumOf(values: (string | null)[]): string | null {
    const numbers = values.filter((value): value is string => value !== null).map(Number);
    if (numbers.length === 0) {
        return null;
    }

    return numbers.reduce((sum, value) => sum + value, 0).toFixed(2);
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

function calculateFundScore(
    row: FundSummary,
    columnAverages: Record<(typeof AVERAGED_COLUMN_IDS)[number], string | null>
): string | null {
    const scores = AVERAGED_COLUMN_IDS.map((id) =>
        calculateRawScore(SCORE_COLUMN_CONFIG[id].getValue(row), columnAverages[id], COLUMN_WEIGHTS[id])
    ).filter((score): score is number => score !== null);

    return scores.length === 0 ? null : scores.reduce((sum, score) => sum + score, 0).toFixed(2);
}

function calculateTierScoreSums(
    funds: FundRow[],
    columnAverages: Record<(typeof AVERAGED_COLUMN_IDS)[number], string | null>
): Partial<Record<FundTierKey, number>> {
    const sums: Partial<Record<FundTierKey, number>> = {};

    funds.forEach((fund) => {
        const score = calculateFundScore(fund, columnAverages);
        if (score === null) {
            return;
        }

        sums[fund.tier] = (sums[fund.tier] ?? 0) + Number(score);
    });

    return sums;
}

function calculateAllocationDifference(finalAllocation: string | null, currentAllocation: string | null): number | null {
    if (finalAllocation === null || currentAllocation === null) {
        return null;
    }

    return Number(currentAllocation) - Number(finalAllocation);
}

function calculateFinalAllocation(
    row: FundRow,
    columnAverages: Record<(typeof AVERAGED_COLUMN_IDS)[number], string | null>,
    tierScoreSums: Partial<Record<FundTierKey, number>>
): string | null {
    const score = calculateFundScore(row, columnAverages);
    const tierMax = tierScoreSums[row.tier];
    if (score === null || tierMax === undefined || tierMax === 0) {
        return null;
    }

    const maxAllocation = FUND_TIER_OBJ[row.tier].maxAllocation;

    return ((Number(score) / tierMax) * maxAllocation * 100).toFixed(2);
}

function calculateCurrentAllocation(row: FundRow, totalValue: number): string | null {
    return totalValue > 0 ? ((row.value / totalValue) * 100).toFixed(2) : null;
}

const columnHelper = createColumnHelper<FundRow>();

const baseColumns = [
    columnHelper.accessor('tier', {
        header: 'Tier',
        cell: (info) => {
            const tierInfo = FUND_TIER_OBJ[info.getValue()];

            return (
                <Tooltip title={tierInfo.longName} placement='top'>
                    <span>{tierInfo.shortName}</span>
                </Tooltip>
            );
        }
    }),
    columnHelper.accessor('isin', { header: 'ISIN' }),
    columnHelper.accessor((row) => (row.latestAvailableDate ? dayjs(row.latestAvailableDate).format('DD/MM/YYYY') : null), {
        id: 'latestAvailableDate',
        header: 'Latest Price Date'
    }),
    columnHelper.accessor('id', {
        header: 'Fund',
        cell: (info) => (
            <Tooltip title={info.row.original.name} placement='top'>
                <span>{info.getValue()}</span>
            </Tooltip>
        )
    }),
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
    funds: FundRow[];
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

    const tierScoreSums = useMemo(() => calculateTierScoreSums(funds, columnAverages), [funds, columnAverages]);

    const totalValue = useMemo(() => funds.reduce((sum, fund) => sum + fund.value, 0), [funds]);

    const columns = useMemo(
        () => [
            ...baseColumns,
            ...AVERAGED_COLUMN_IDS.map((id) =>
                columnHelper.accessor(
                    (row) => calculateScore(SCORE_COLUMN_CONFIG[id].getValue(row), columnAverages[id], COLUMN_WEIGHTS[id]),
                    { id: `${id}Score`, header: SCORE_COLUMN_CONFIG[id].header }
                )
            ),
            columnHelper.accessor((row) => calculateFundScore(row, columnAverages), {
                id: 'fundScore',
                header: 'Fund Score'
            }),
            columnHelper.accessor((row) => (FUND_TIER_OBJ[row.tier].maxAllocation * 100).toFixed(2), {
                id: 'maxAllocation',
                header: 'Max Allocation %'
            }),
            columnHelper.accessor((row) => tierScoreSums[row.tier]?.toFixed(2) ?? null, {
                id: 'tierMax',
                header: 'Tier Max'
            }),
            columnHelper.accessor((row) => calculateFinalAllocation(row, columnAverages, tierScoreSums), {
                id: 'finalAllocation',
                header: 'Final Allocation %'
            }),
            columnHelper.accessor((row) => row.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), {
                id: 'value',
                header: 'Current Value'
            }),
            columnHelper.accessor((row) => calculateCurrentAllocation(row, totalValue), {
                id: 'currentAllocation',
                header: 'Current Allocation %'
            }),
            columnHelper.accessor(
                (row) =>
                    calculateAllocationDifference(
                        calculateFinalAllocation(row, columnAverages, tierScoreSums),
                        calculateCurrentAllocation(row, totalValue)
                    ),
                {
                    id: 'allocationDifference',
                    header: 'Difference',
                    cell: (info) => {
                        const difference = info.getValue();
                        if (difference === null) {
                            return null;
                        }

                        const formatted = `${difference > 0 ? '+' : ''}${difference.toFixed(2)}`;
                        const color = difference > 0 ? 'green' : difference < 0 ? 'red' : undefined;

                        return <span style={{ color }}>{formatted}</span>;
                    }
                }
            )
        ],
        [columnAverages, tierScoreSums, totalValue]
    );

    const finalAllocationSum = useMemo(
        () => sumOf(funds.map((fund) => calculateFinalAllocation(fund, columnAverages, tierScoreSums))),
        [funds, columnAverages, tierScoreSums]
    );

    const valueSum = useMemo(
        () => totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        [totalValue]
    );

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
    const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);

    const table = useReactTable({
        data: funds,
        columns,
        state: { columnVisibility },
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel()
    });

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Tooltip title='Show/hide columns'>
                    <IconButton size='small' onClick={(event) => setColumnMenuAnchor(event.currentTarget)}>
                        <ViewColumnIcon fontSize='small' />
                    </IconButton>
                </Tooltip>
                <Menu
                    anchorEl={columnMenuAnchor}
                    open={Boolean(columnMenuAnchor)}
                    onClose={() => setColumnMenuAnchor(null)}
                >
                    {table.getAllLeafColumns().map((column) => (
                        <MenuItem key={column.id} dense onClick={column.getToggleVisibilityHandler()}>
                            <Checkbox size='small' checked={column.getIsVisible()} />
                            <ListItemText
                                primary={typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                            />
                        </MenuItem>
                    ))}
                </Menu>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: HEADER_BACKGROUND }}>
                            {table.getFlatHeaders().map((header) => {
                                const isAveraged = (AVERAGED_COLUMN_IDS as readonly string[]).includes(header.column.id);
                                const isFinalAllocation = header.column.id === 'finalAllocation';
                                const isValue = header.column.id === 'value';
                                const isSummed = isFinalAllocation || isValue;
                                const highlightBackground = HIGHLIGHTED_HEADER_BACKGROUNDS[header.column.id];
                                const value = isAveraged
                                    ? columnAverages[header.column.id as (typeof AVERAGED_COLUMN_IDS)[number]]
                                    : isFinalAllocation
                                    ? finalAllocationSum
                                    : isValue
                                    ? valueSum
                                    : null;
                                const tooltipTitle = isSummed ? 'sum of column' : 'average for column';

                                return (
                                    <TableCell
                                        key={header.id}
                                        sx={{
                                            fontWeight: 'bold',
                                            backgroundColor: highlightBackground
                                        }}
                                    >
                                        {(isAveraged || isSummed) && (
                                            <Tooltip title={tooltipTitle} placement='top'>
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
                                    const highlightBackground = HIGHLIGHTED_HEADER_BACKGROUNDS[header.column.id];

                                    return (
                                        <TableCell
                                            key={header.id}
                                            sx={{
                                                fontWeight: 'bold',
                                                backgroundColor: highlightBackground
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
                                {row.getVisibleCells().map((cell) => {
                                    const cellContent = flexRender(cell.column.columnDef.cell, cell.getContext());

                                    if (cell.column.id === 'latestAvailableDate') {
                                        const latestAvailableDate = row.original.latestAvailableDate;
                                        const daysOld = latestAvailableDate
                                            ? dayjs().startOf('day').diff(dayjs(latestAvailableDate).startOf('day'), 'day')
                                            : null;
                                        const isStale = daysOld !== null && daysOld > STALE_DATA_THRESHOLD_DAYS;

                                        if (isStale) {
                                            return (
                                                <TableCell
                                                    key={cell.id}
                                                    sx={{ backgroundColor: STALE_DATA_BACKGROUND }}
                                                >
                                                    <Tooltip title={`Data is: ${daysOld} days old`} placement='top'>
                                                        <span>{cellContent}</span>
                                                    </Tooltip>
                                                </TableCell>
                                            );
                                        }
                                    }

                                    return <TableCell key={cell.id}>{cellContent}</TableCell>;
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
