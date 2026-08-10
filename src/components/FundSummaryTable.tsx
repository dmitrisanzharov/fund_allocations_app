import { MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import chroma from 'chroma-js';
import {
    Alert,
    Box,
    Checkbox,
    Button,
    IconButton,
    ListItemText,
    Menu,
    MenuItem,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FundSummary } from '../hooks/useFundSummary';
import { FUND_TIER_OBJ, FundTierKey } from '../constants';
import { outlinedButtonSx } from '../styles';

dayjs.extend(customParseFormat);

type FundRow = FundSummary & { tier: FundTierKey; id: string; value: number; lastValueUpdateDate: string };

const AVERAGED_COLUMN_IDS = ['totalReturn', 'averageYield', 'returnPerRisk'] as const;

const STALE_DATA_THRESHOLD_DAYS = 14;
const STALE_DATA_BACKGROUND = '#ef9a9a';
const OLDEST_DATE_BACKGROUND = 'lightgray';

const COLUMN_VISIBILITY_STORAGE_KEY = 'fundSummaryTable.columnVisibility';
const COLUMN_ORDER_STORAGE_KEY = 'fundSummaryTable.columnOrder';
const DONE_FUNDS_STORAGE_KEY = 'fundSummaryTable.doneFunds';

const HEADER_BACKGROUND = 'lightgray';
const AVERAGED_HEADER_BACKGROUND = 'darkgray';
const ALLOCATION_HEADER_BACKGROUND = 'darkgoldenrod';
const FUND_SCORE_HEADER_BACKGROUND = 'green';

const HIGHLIGHTED_HEADER_BACKGROUNDS: Record<string, string> = {
    totalReturn: AVERAGED_HEADER_BACKGROUND,
    averageYield: AVERAGED_HEADER_BACKGROUND,
    returnPerRisk: AVERAGED_HEADER_BACKGROUND,
    finalAllocation: ALLOCATION_HEADER_BACKGROUND,
    idealAllocation: ALLOCATION_HEADER_BACKGROUND,
    allocationAmount: AVERAGED_HEADER_BACKGROUND,
    fundScore: FUND_SCORE_HEADER_BACKGROUND
};

const COLUMN_MIN_WIDTHS: Record<string, number> = {
    latestAvailableDate: 90
};

const HEADER_LABEL_TOOLTIPS: Record<string, string> = {
    totalReturn: 'Total Returns %, including dividends',
    valueToAdd: 'if in minus / green = over invested (so can sell here)... if in plus / red = under invested, need to add',
    idealAllocation: 'this is TOTAL PORTFOLIO VALUE * final allocation per cell'
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

const fundScoreColorScale = chroma.scale(['#ef5350', '#ffffff', '#66bb6a']);

function getColorScaleBackground(value: number, min: number, max: number): string {
    const t = max === min ? 0.5 : (value - min) / (max - min);
    return fundScoreColorScale(t).hex();
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

function calculateValueToAdd(row: FundRow, finalAllocation: string | null, totalValue: number): number | null {
    if (finalAllocation === null) {
        return null;
    }

    const targetShare = Number(finalAllocation) / 100;

    return targetShare * totalValue - row.value;
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

function SortableColumnMenuItem({
    id,
    label,
    checked,
    onToggle
}: {
    id: string;
    label: string;
    checked: boolean;
    onToggle: (event: MouseEvent<HTMLLIElement>) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    return (
        <MenuItem
            ref={setNodeRef}
            dense
            onClick={onToggle}
            style={{
                transform: CSS.Translate.toString(transform),
                transition,
                opacity: isDragging ? 0.5 : 1
            }}
        >
            <IconButton
                size='small'
                {...attributes}
                {...listeners}
                onClick={(event) => event.stopPropagation()}
                sx={{ cursor: 'grab', mr: 0.5 }}
            >
                <DragIndicatorIcon fontSize='small' />
            </IconButton>
            <Checkbox size='small' checked={checked} />
            <ListItemText primary={label} />
        </MenuItem>
    );
}

const COPIED_EVENT = 'fund-summary-table:copied';

function CopyableCell({ label, copyText }: { label: string; copyText: string }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, '&:hover .copy-icon-button': { opacity: 1 } }}>
            <span>{label}</span>
            <IconButton
                size='small'
                className='copy-icon-button'
                sx={{ opacity: 0, transition: 'opacity 0.15s', p: 0.25 }}
                onClick={(event) => {
                    event.stopPropagation();
                    navigator.clipboard.writeText(copyText);
                    window.dispatchEvent(new Event(COPIED_EVENT));
                }}
            >
                <ContentCopyIcon fontSize='inherit' />
            </IconButton>
        </Box>
    );
}

function EditableValueCell({
    value,
    valueToAdd,
    isOverridden,
    isEditing,
    onStartEdit,
    onSave,
    onCancel,
    onReset
}: {
    value: number;
    valueToAdd: number | null;
    isOverridden: boolean;
    isEditing: boolean;
    onStartEdit: () => void;
    onSave: (newValue: number) => void;
    onCancel: () => void;
    onReset: () => void;
}) {
    const [inputValue, setInputValue] = useState(String(value));

    useEffect(() => {
        if (isEditing) {
            setInputValue(String(value));
        }
    }, [isEditing, value]);

    if (isEditing) {
        const commit = () => {
            const parsed = Number(inputValue);
            if (!Number.isNaN(parsed)) {
                onSave(parsed);
            }
        };

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TextField
                    size='small'
                    type='number'
                    value={inputValue}
                    autoFocus
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            commit();
                        }
                        if (event.key === 'Escape') {
                            onCancel();
                        }
                    }}
                    sx={{ width: 130 }}
                />
                <Tooltip title='Save'>
                    <IconButton size='small' onClick={commit}>
                        <CheckIcon fontSize='small' />
                    </IconButton>
                </Tooltip>
                <Tooltip title='Cancel'>
                    <IconButton size='small' onClick={onCancel}>
                        <CloseIcon fontSize='small' />
                    </IconButton>
                </Tooltip>
                <Tooltip title='Reset to original value'>
                    <IconButton size='small' onClick={onReset}>
                        <RestartAltIcon fontSize='small' />
                    </IconButton>
                </Tooltip>
                {valueToAdd !== null && (
                    <Tooltip title='add all money to make Difference Zero'>
                        <IconButton size='small' onClick={() => onSave(value + valueToAdd)}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>€€</span>
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, '&:hover .edit-icon-button': { opacity: 1 } }}>
            <span>
                {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {isOverridden ? ' *' : ''}
            </span>
            <IconButton
                size='small'
                className='edit-icon-button'
                sx={{ opacity: 0, transition: 'opacity 0.15s', p: 0.25 }}
                onClick={onStartEdit}
            >
                <EditIcon fontSize='inherit' />
            </IconButton>
        </Box>
    );
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
    columnHelper.accessor('isin', {
        header: 'ISIN',
        cell: (info) => <CopyableCell label={info.getValue()} copyText={info.getValue()} />
    }),
    columnHelper.accessor((row) => (row.latestAvailableDate ? dayjs(row.latestAvailableDate).format('DD-MMM-YYYY') : null), {
        id: 'latestAvailableDate',
        header: 'Latest Price Date'
    }),
    columnHelper.accessor('id', {
        header: 'Fund',
        cell: (info) => (
            <Tooltip title={info.row.original.name} placement='top'>
                <span>
                    <CopyableCell label={info.getValue()} copyText={info.row.original.name} />
                </span>
            </Tooltip>
        )
    }),
    columnHelper.accessor((row) => row.oldest?.Price, { id: 'oldest', header: 'Oldest Price' }),
    columnHelper.accessor((row) => row.newest?.Price, { id: 'newest', header: 'Newest Price' }),
    columnHelper.accessor((row) => row.totalDividends.toFixed(2), { id: 'totalDividends', header: 'Total Dividends' }),
    columnHelper.accessor((row) => row.correctDifferenceAsPercent, {
        id: 'totalReturn',
        header: 'Total Returns %, incl. div'
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
    analysisYears: string;
}

const BASED_ON_PERIOD_COLUMN_IDS = ['currentAllocation', 'allocationDifference', 'valueToAdd'];

export function FundSummaryTable({ funds, analysisYears }: FundSummaryTableProps) {
    const [valueOverrides, setValueOverrides] = useState<Record<string, number>>({});
    const [editingFundId, setEditingFundId] = useState<string | null>(null);
    const [allocationInputAmount, setAllocationInputAmount] = useState('');
    const allocationAmountNumber = Number(allocationInputAmount) || 0;
    const [addMoneyAmounts, setAddMoneyAmounts] = useState<Record<string, string>>({});
    const [sorting, setSorting] = useState<SortingState>([]);

    const effectiveFunds = useMemo(
        () =>
            funds.map((fund) => {
                const baseValue = fund.id in valueOverrides ? valueOverrides[fund.id] : fund.value;
                const addAmount = Number(addMoneyAmounts[fund.id]) || 0;
                return { ...fund, value: baseValue + addAmount };
            }),
        [funds, valueOverrides, addMoneyAmounts]
    );

    const columnAverages = useMemo(
        () => ({
            totalReturn: averageOf(funds.map((fund) => fund.correctDifferenceAsPercent)),
            averageYield: averageOf(funds.map((fund) => fund.averageDividendYield)),
            returnPerRisk: averageOf(funds.map((fund) => fund.returnPerRisk))
        }),
        [funds]
    );

    const tierScoreSums = useMemo(() => calculateTierScoreSums(funds, columnAverages), [funds, columnAverages]);

    const fundScoreRange = useMemo(() => {
        const scores = funds
            .map((fund) => calculateFundScore(fund, columnAverages))
            .filter((score): score is string => score !== null)
            .map(Number);

        return scores.length === 0 ? null : { min: Math.min(...scores), max: Math.max(...scores) };
    }, [funds, columnAverages]);

    const totalValue = useMemo(() => effectiveFunds.reduce((sum, fund) => sum + fund.value, 0), [effectiveFunds]);

    // Read via refs inside column cell/accessor closures so typing into per-keystroke inputs
    // (Add Moneys, Allocation Amount) doesn't need to rebuild `columns` on every character —
    // rebuilding it would hand flexRender a new function identity and remount the inputs, dropping focus.
    const totalValueRef = useRef(totalValue);
    totalValueRef.current = totalValue;
    const allocationAmountRef = useRef(allocationAmountNumber);
    allocationAmountRef.current = allocationAmountNumber;
    const addMoneyAmountsRef = useRef(addMoneyAmounts);
    addMoneyAmountsRef.current = addMoneyAmounts;

    const oldestLatestAvailableDate = useMemo(() => {
        const dates = funds.map((fund) => fund.latestAvailableDate).filter((date): date is string => date !== null);

        return dates.length === 0
            ? null
            : dates.reduce((oldest, date) => (dayjs(date).isBefore(dayjs(oldest)) ? date : oldest));
    }, [funds]);

    const oldestValueUpdateDate = useMemo(() => {
        const dates = funds.map((fund) => dayjs(fund.lastValueUpdateDate, 'DD/MM/YYYY')).filter((date) => date.isValid());

        return dates.length === 0 ? null : dates.reduce((oldest, date) => (date.isBefore(oldest) ? date : oldest));
    }, [funds]);

    const isValueUpdateOutOfSync = useMemo(() => {
        const dates = funds.map((fund) => dayjs(fund.lastValueUpdateDate, 'DD/MM/YYYY')).filter((date) => date.isValid());

        return dates.length > 1 && !dates.every((date) => date.isSame(dates[0], 'day'));
    }, [funds]);

    const [doneFunds, setDoneFunds] = useState<Record<string, boolean>>(() => {
        try {
            const stored = localStorage.getItem(DONE_FUNDS_STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem(DONE_FUNDS_STORAGE_KEY, JSON.stringify(doneFunds));
    }, [doneFunds]);

    const columns = useMemo(
        () => [
            columnHelper.display({
                id: 'done',
                header: 'Done',
                cell: (info) => (
                    <Checkbox
                        size='small'
                        checked={doneFunds[info.row.original.id] ?? false}
                        onChange={(event) =>
                            setDoneFunds((prev) => ({ ...prev, [info.row.original.id]: event.target.checked }))
                        }
                    />
                )
            }),
            ...baseColumns,
            ...AVERAGED_COLUMN_IDS.map((id) =>
                columnHelper.accessor(
                    (row) => calculateScore(SCORE_COLUMN_CONFIG[id].getValue(row), columnAverages[id], COLUMN_WEIGHTS[id]),
                    { id: `${id}Score`, header: SCORE_COLUMN_CONFIG[id].header }
                )
            ),
            columnHelper.accessor((row) => calculateFundScore(row, columnAverages), {
                id: 'fundScore',
                header: 'Fund Score',
                enableSorting: true,
                sortDescFirst: true,
                sortingFn: (rowA, rowB, columnId) => {
                    const a = rowA.getValue<string | null>(columnId);
                    const b = rowB.getValue<string | null>(columnId);
                    if (a === null && b === null) return 0;
                    if (a === null) return -1;
                    if (b === null) return 1;
                    return Number(a) - Number(b);
                }
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
            columnHelper.display({
                id: 'idealAllocation',
                header: 'Ideal Allocation',
                cell: (info) => {
                    const finalAllocation = calculateFinalAllocation(info.row.original, columnAverages, tierScoreSums);
                    if (finalAllocation === null) {
                        return null;
                    }

                    const amount = (Number(finalAllocation) / 100) * totalValueRef.current;

                    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            }),
            columnHelper.display({
                id: 'allocationAmount',
                header: 'Allocation Amount',
                cell: (info) => {
                    const finalAllocation = calculateFinalAllocation(info.row.original, columnAverages, tierScoreSums);
                    if (finalAllocation === null) {
                        return null;
                    }

                    const amount = (Number(finalAllocation) / 100) * allocationAmountRef.current;

                    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            }),
            columnHelper.accessor((row) => row.value, {
                id: 'value',
                header: 'Current Value',
                cell: (info) => {
                    const fundId = info.row.original.id;
                    const finalAllocation = calculateFinalAllocation(info.row.original, columnAverages, tierScoreSums);
                    const valueToAdd = calculateValueToAdd(info.row.original, finalAllocation, totalValueRef.current);

                    return (
                        <EditableValueCell
                            value={info.getValue()}
                            valueToAdd={valueToAdd}
                            isOverridden={fundId in valueOverrides}
                            isEditing={editingFundId === fundId}
                            onStartEdit={() => setEditingFundId(fundId)}
                            onSave={(newValue) => {
                                setValueOverrides((prev) => ({ ...prev, [fundId]: newValue }));
                                setAddMoneyAmounts((prev) => {
                                    const next = { ...prev };
                                    delete next[fundId];
                                    return next;
                                });
                                setEditingFundId(null);
                            }}
                            onCancel={() => setEditingFundId(null)}
                            onReset={() => {
                                setValueOverrides((prev) => {
                                    const next = { ...prev };
                                    delete next[fundId];
                                    return next;
                                });
                                setAddMoneyAmounts((prev) => {
                                    const next = { ...prev };
                                    delete next[fundId];
                                    return next;
                                });
                                setEditingFundId(null);
                            }}
                        />
                    );
                }
            }),
            columnHelper.display({
                id: 'addMoney',
                header: 'Add Moneys',
                cell: (info) => {
                    const fundId = info.row.original.id;

                    return (
                        <TextField
                            size='small'
                            type='number'
                            placeholder='Add'
                            value={addMoneyAmountsRef.current[fundId] ?? ''}
                            onChange={(event) =>
                                setAddMoneyAmounts((prev) => ({ ...prev, [fundId]: event.target.value }))
                            }
                            sx={{ width: 110 }}
                        />
                    );
                }
            }),
            columnHelper.accessor((row) => calculateCurrentAllocation(row, totalValueRef.current), {
                id: 'currentAllocation',
                header: 'Current Allocation %'
            }),
            columnHelper.accessor(
                (row) =>
                    calculateAllocationDifference(
                        calculateFinalAllocation(row, columnAverages, tierScoreSums),
                        calculateCurrentAllocation(row, totalValueRef.current)
                    ),
                {
                    id: 'allocationDifference',
                    header: 'Difference %',
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
            ),
            columnHelper.accessor(
                (row) =>
                    calculateValueToAdd(row, calculateFinalAllocation(row, columnAverages, tierScoreSums), totalValueRef.current),
                {
                    id: 'valueToAdd',
                    header: 'Value to Add (€)',
                    cell: (info) => {
                        const valueToAdd = info.getValue();
                        if (valueToAdd === null) {
                            return null;
                        }

                        const formatted = `${valueToAdd > 0 ? '+' : ''}${valueToAdd.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}`;
                        const color = valueToAdd > 0 ? 'red' : valueToAdd < 0 ? 'green' : undefined;

                        return (
                            <Tooltip
                                title='if in minus / green = over invested (so can sell here)... if in plus / red = under invested, need to add'
                                placement='top'
                            >
                                <span style={{ color }}>{formatted}</span>
                            </Tooltip>
                        );
                    }
                }
            )
        ],
        // totalValue/allocationAmountNumber/addMoneyAmounts are intentionally excluded: they change on every
        // keystroke, and rebuilding `columns` would hand flexRender new cell function identities, remounting
        // the per-row inputs mid-typing. Cells read the current values via the refs above instead.
        [columnAverages, tierScoreSums, doneFunds, valueOverrides, editingFundId]
    );

    const finalAllocationSum = useMemo(
        () => sumOf(funds.map((fund) => calculateFinalAllocation(fund, columnAverages, tierScoreSums))),
        [funds, columnAverages, tierScoreSums]
    );

    const fundScoreAverage = useMemo(
        () => averageOf(funds.map((fund) => calculateFundScore(fund, columnAverages))),
        [funds, columnAverages]
    );

    const valueSum = useMemo(
        () => totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        [totalValue]
    );

    const idealAllocationTotal = useMemo(
        () =>
            funds.reduce((sum, fund) => {
                const finalAllocation = calculateFinalAllocation(fund, columnAverages, tierScoreSums);
                return finalAllocation === null ? sum : sum + (Number(finalAllocation) / 100) * totalValue;
            }, 0),
        [funds, columnAverages, tierScoreSums, totalValue]
    );

    const idealAllocationSum = useMemo(
        () => idealAllocationTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        [idealAllocationTotal]
    );

    const isIdealAllocationBalanced =
        totalValue === 0 || Math.abs(idealAllocationTotal - totalValue) <= Math.max(0.5, totalValue * 0.0005);

    const addMoneySum = useMemo(() => {
        const total = Object.values(addMoneyAmounts).reduce((sum, value) => sum + (Number(value) || 0), 0);
        return total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }, [addMoneyAmounts]);

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        try {
            const stored = localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });
    const [columnOrder, setColumnOrder] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem(COLUMN_ORDER_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });
    const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
    const [copiedSnackbarOpen, setCopiedSnackbarOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(columnVisibility));
    }, [columnVisibility]);

    useEffect(() => {
        localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(columnOrder));
    }, [columnOrder]);

    useEffect(() => {
        const handleCopied = () => setCopiedSnackbarOpen(true);
        window.addEventListener(COPIED_EVENT, handleCopied);
        return () => window.removeEventListener(COPIED_EVENT, handleCopied);
    }, []);

    const columnDragSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

    const table = useReactTable({
        data: effectiveFunds,
        columns,
        state: { columnVisibility, sorting, columnOrder },
        onColumnVisibilityChange: setColumnVisibility,
        onSortingChange: setSorting,
        onColumnOrderChange: setColumnOrder,
        enableSortingRemoval: false,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel()
    });

    const orderedLeafColumns = table.getAllLeafColumns();

    const handleColumnDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) {
            return;
        }

        const ids = orderedLeafColumns.map((column) => column.id);
        const oldIndex = ids.indexOf(String(active.id));
        const newIndex = ids.indexOf(String(over.id));
        setColumnOrder(arrayMove(ids, oldIndex, newIndex));
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Tooltip title='Show/hide columns' placement='top' arrow>
                    <Button variant='outlined' sx={outlinedButtonSx} size='small' onClick={(event) => setColumnMenuAnchor(event.currentTarget)}>
                        <ViewColumnIcon fontSize='small' />
                    </Button>
                </Tooltip>
                <Menu
                    anchorEl={columnMenuAnchor}
                    open={Boolean(columnMenuAnchor)}
                    onClose={() => setColumnMenuAnchor(null)}
                >
                    <DndContext sensors={columnDragSensors} onDragEnd={handleColumnDragEnd}>
                        <SortableContext
                            items={orderedLeafColumns.map((column) => column.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {orderedLeafColumns.map((column) => (
                                <SortableColumnMenuItem
                                    key={column.id}
                                    id={column.id}
                                    label={typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                                    checked={column.getIsVisible()}
                                    onToggle={column.getToggleVisibilityHandler()}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </Menu>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: HEADER_BACKGROUND }}>
                            {table.getFlatHeaders().map((header) => {
                                const isDone = header.column.id === 'done';
                                const isAveraged = (AVERAGED_COLUMN_IDS as readonly string[]).includes(header.column.id);
                                const isFundScore = header.column.id === 'fundScore';
                                const isFinalAllocation = header.column.id === 'finalAllocation';
                                const isIdealAllocation = header.column.id === 'idealAllocation';
                                const isAllocationAmount = header.column.id === 'allocationAmount';
                                const isValue = header.column.id === 'value';
                                const isAddMoney = header.column.id === 'addMoney';
                                const isLatestAvailableDate = header.column.id === 'latestAvailableDate';
                                const priceDataAgeDays =
                                    isLatestAvailableDate && oldestLatestAvailableDate
                                        ? dayjs().startOf('day').diff(dayjs(oldestLatestAvailableDate).startOf('day'), 'day')
                                        : null;
                                const isSummed = isFinalAllocation || isIdealAllocation || isValue || isAddMoney;
                                const isBasedOnPeriod = BASED_ON_PERIOD_COLUMN_IDS.includes(header.column.id);
                                const highlightBackground = HIGHLIGHTED_HEADER_BACKGROUNDS[header.column.id];
                                const value = isAveraged
                                    ? columnAverages[header.column.id as (typeof AVERAGED_COLUMN_IDS)[number]]
                                    : isFundScore
                                    ? fundScoreAverage
                                    : isFinalAllocation
                                    ? finalAllocationSum
                                    : isIdealAllocation
                                    ? idealAllocationSum
                                    : isValue
                                    ? valueSum
                                    : isAddMoney
                                    ? addMoneySum
                                    : null;
                                const tooltipTitle = isSummed ? 'sum of column' : 'average for column';

                                return (
                                    <TableCell
                                        key={header.id}
                                        sx={{
                                            fontWeight: 'bold',
                                            backgroundColor: highlightBackground,
                                            minWidth: COLUMN_MIN_WIDTHS[header.column.id]
                                        }}
                                    >
                                        {isDone && (
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title='Check all' placement='top'>
                                                    <IconButton
                                                        size='small'
                                                        onClick={() =>
                                                            setDoneFunds(
                                                                Object.fromEntries(funds.map((fund) => [fund.id, true]))
                                                            )
                                                        }
                                                    >
                                                        <CheckBoxIcon fontSize='small' />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title='Clear all' placement='top'>
                                                    <IconButton size='small' onClick={() => setDoneFunds({})}>
                                                        <CheckBoxOutlineBlankIcon fontSize='small' />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        )}
                                        {isAllocationAmount && (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                                                <Tooltip title='Copy each Allocation Amount into the Add Moneys column' placement='top'>
                                                    <Button
                                                        variant='outlined'
                                                        size='small'
                                                        sx={{ ...outlinedButtonSx, backgroundColor: 'white', minWidth: 0, px: 1 }}
                                                        onClick={() =>
                                                            setAddMoneyAmounts((prev) => {
                                                                const next = { ...prev };
                                                                funds.forEach((fund) => {
                                                                    const finalAllocation = calculateFinalAllocation(
                                                                        fund,
                                                                        columnAverages,
                                                                        tierScoreSums
                                                                    );
                                                                    if (finalAllocation === null) {
                                                                        return;
                                                                    }
                                                                    const amount =
                                                                        (Number(finalAllocation) / 100) * allocationAmountNumber;
                                                                    next[fund.id] = amount.toFixed(2);
                                                                });
                                                                return next;
                                                            })
                                                        }
                                                    >
                                                        +
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip title='Enter an amount to allocate using the Final Allocation %' placement='bottom'>
                                                    <TextField
                                                        size='small'
                                                        type='number'
                                                        placeholder='Amount'
                                                        value={allocationInputAmount}
                                                        onChange={(event) => setAllocationInputAmount(event.target.value)}
                                                        sx={{ width: 110, backgroundColor: 'white', borderRadius: 1 }}
                                                    />
                                                </Tooltip>
                                            </Box>
                                        )}
                                        {(isAveraged || isSummed || isFundScore) && (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, textAlign: 'center' }}>
                                                <Tooltip title={tooltipTitle} placement='top'>
                                                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                                        <span>{value}</span>
                                                        <InfoOutlinedIcon fontSize='small' />
                                                    </Box>
                                                </Tooltip>
                                                {isIdealAllocation &&
                                                    (isIdealAllocationBalanced ? (
                                                        <Tooltip title='Ideal Allocation total matches the Current Value total' placement='top'>
                                                            <span style={{ color: 'black', fontSize: '0.7rem' }}>(correct)</span>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip
                                                            title='Ideal Allocation total does NOT match the Current Value total'
                                                            placement='top'
                                                        >
                                                            <span style={{ color: 'red', fontWeight: 'bold', fontSize: '1.4rem' }}>
                                                                INCORRECT
                                                            </span>
                                                        </Tooltip>
                                                    ))}
                                            </Box>
                                        )}
                                        {isBasedOnPeriod && (
                                            <Tooltip
                                                title='These figures are calculated over the analysis period shown above the table'
                                                placement='top'
                                            >
                                                <span>based on: {analysisYears} years</span>
                                            </Tooltip>
                                        )}
                                        {isLatestAvailableDate && priceDataAgeDays !== null && (
                                            <Tooltip
                                                title="NOW - lowest fund date available; so I can NOT search for data that doesn't exist"
                                                placement='top'
                                            >
                                                <span>
                                                    Data age: {priceDataAgeDays} {priceDataAgeDays === 1 ? 'day' : 'days'}
                                                </span>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} sx={{ backgroundColor: HEADER_BACKGROUND }}>
                                {headerGroup.headers.map((header) => {
                                    const isValue = header.column.id === 'value';
                                    const highlightBackground = isValue && isValueUpdateOutOfSync
                                        ? STALE_DATA_BACKGROUND
                                        : HIGHLIGHTED_HEADER_BACKGROUNDS[header.column.id];
                                    const isAddMoney = header.column.id === 'addMoney';
                                    const headerLabelTooltip = HEADER_LABEL_TOOLTIPS[header.column.id];
                                    const valueUpdateDaysOld =
                                        isValue && oldestValueUpdateDate
                                            ? dayjs().startOf('day').diff(oldestValueUpdateDate.startOf('day'), 'day')
                                            : null;
                                    const canSort = header.column.id === 'fundScore' && header.column.getCanSort();
                                    const sortDirection = header.column.getIsSorted();

                                    return (
                                        <TableCell
                                            key={header.id}
                                            sx={{
                                                fontWeight: 'bold',
                                                backgroundColor: highlightBackground,
                                                minWidth: COLUMN_MIN_WIDTHS[header.column.id]
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                {isAddMoney && (
                                                    <Tooltip title='Clear all Add Moneys entries' placement='top'>
                                                        <Button
                                                            variant='outlined'
                                                            size='small'
                                                            sx={{ ...outlinedButtonSx, backgroundColor: 'white', minWidth: 0, px: 1, alignSelf: 'flex-start', mb: 0.5 }}
                                                            onClick={() => setAddMoneyAmounts({})}
                                                        >
                                                            -
                                                        </Button>
                                                    </Tooltip>
                                                )}
                                                {(() => {
                                                    const label = (
                                                        <Box
                                                            sx={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 0.25,
                                                                cursor: canSort ? 'pointer' : undefined
                                                            }}
                                                            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                                                        >
                                                            <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                                                            {canSort &&
                                                                (sortDirection === 'asc' ? (
                                                                    <ArrowUpwardIcon fontSize='inherit' />
                                                                ) : (
                                                                    <ArrowDownwardIcon
                                                                        fontSize='inherit'
                                                                        sx={{ opacity: sortDirection === 'desc' ? 1 : 0.3 }}
                                                                    />
                                                                ))}
                                                        </Box>
                                                    );

                                                    return headerLabelTooltip ? (
                                                        <Tooltip title={headerLabelTooltip} placement='top'>
                                                            {label}
                                                        </Tooltip>
                                                    ) : (
                                                        label
                                                    );
                                                })()}
                                                {isValue && oldestValueUpdateDate && valueUpdateDaysOld !== null && (
                                                    <Tooltip
                                                        title="Oldest fund value update date across funds"
                                                        placement='top'
                                                    >
                                                        <span>
                                                            ({oldestValueUpdateDate.format('DD-MMM-YYYY')}, {valueUpdateDaysOld}{' '}
                                                            {valueUpdateDaysOld === 1 ? 'day' : 'days'})
                                                        </span>
                                                    </Tooltip>
                                                )}
                                                {isValue && isValueUpdateOutOfSync && (
                                                    <Tooltip
                                                        title="One of the funds is OUT OF SYNC - not all Current Value figures were last updated on the same date"
                                                        placement='top'
                                                    >
                                                        <span style={{ color: 'red', fontWeight: 'bold' }}>OUT OF SYNC</span>
                                                    </Tooltip>
                                                )}
                                            </Box>
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
                                        const isOldestAcrossFunds =
                                            latestAvailableDate !== null &&
                                            oldestLatestAvailableDate !== null &&
                                            dayjs(latestAvailableDate).isSame(dayjs(oldestLatestAvailableDate), 'day');

                                        if (isOldestAcrossFunds) {
                                            return (
                                                <TableCell
                                                    key={cell.id}
                                                    sx={{ backgroundColor: OLDEST_DATE_BACKGROUND, minWidth: COLUMN_MIN_WIDTHS[cell.column.id] }}
                                                >
                                                    <Tooltip
                                                        title="This is the oldest latest-price date across all funds - it sets the app's 'as of date' and needs updating"
                                                        placement='top'
                                                    >
                                                        <span>{cellContent}</span>
                                                    </Tooltip>
                                                </TableCell>
                                            );
                                        }

                                        if (isStale) {
                                            return (
                                                <TableCell
                                                    key={cell.id}
                                                    sx={{ backgroundColor: STALE_DATA_BACKGROUND, minWidth: COLUMN_MIN_WIDTHS[cell.column.id] }}
                                                >
                                                    <Tooltip title={`Data is: ${daysOld} days old`} placement='top'>
                                                        <span>{cellContent}</span>
                                                    </Tooltip>
                                                </TableCell>
                                            );
                                        }
                                    }

                                    if (cell.column.id === 'fundScore') {
                                        const raw = cell.getValue<string | null>();
                                        if (raw !== null && fundScoreRange) {
                                            const backgroundColor = getColorScaleBackground(
                                                Number(raw),
                                                fundScoreRange.min,
                                                fundScoreRange.max
                                            );

                                            return (
                                                <TableCell key={cell.id} sx={{ backgroundColor }}>
                                                    {cellContent}
                                                </TableCell>
                                            );
                                        }
                                    }

                                    return (
                                        <TableCell key={cell.id} sx={{ minWidth: COLUMN_MIN_WIDTHS[cell.column.id] }}>
                                            {cellContent}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Snackbar
                open={copiedSnackbarOpen}
                autoHideDuration={2000}
                onClose={() => setCopiedSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setCopiedSnackbarOpen(false)} severity='success' variant='filled'>
                    Copied
                </Alert>
            </Snackbar>
        </Box>
    );
}
