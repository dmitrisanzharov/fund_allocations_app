export const FUND_TIER_OBJ = {
    tier_1: {
        shortName: 'T1',
        longName: 'TIER 1: Global Core ... world / LARGE impact on the world',
        maxAllocation: 0.75
    },
    EU: {
        shortName: 'EU',
        longName: 'euro region',
        maxAllocation: 0.2
    },
    tier_2: {
        shortName: 'T2',
        longName: 'Tier 2: Regional, but NOT high impact on the world',
        maxAllocation: 0.05
    }
} as const;

export const TODAY_TIMESTAMP = '2026-07-15T18:00:00.780Z';

export type FundTierKey = keyof typeof FUND_TIER_OBJ;

export type FundConfig = {
    id: string;
    name: string;
    isin: string;
    symbol: string;
    value: number;
    lastValueUpdateDate: string;
    pricesSheet: string;
    dividendsSheet: string;
    tier: FundTierKey;
    taxRate?: number;
};

export const FUNDS = [
    {
        id: 'vaneck',
        name: 'VanEck Ms Developed Markets Div Lead UCITS ETF',
        isin: 'NL0011683594',
        symbol: 'VDIV',
        value: 308772.24,
        lastValueUpdateDate: '05/08/2026',
        pricesSheet: 'vaneck_NL0011683594',
        dividendsSheet: 'vaneck_NL0011683594_div',
        tier: 'tier_1',
        taxRate: 0.15
    },
    {
        id: 'globalSelect',
        name: 'iShares STOXX Global Select Dividend 100 UCITS (DE) ETF',
        isin: 'DE000A0F5UH1',
        symbol: 'ISPA',
        value: 234828.33,
        lastValueUpdateDate: '05/08/2026',
        pricesSheet: 'GlobalSelect_DE000A0F5UH1',
        dividendsSheet: 'GlobalSelect_DE000A0F5UH1_div',
        tier: 'tier_1'
    },
    {
        id: 'vanguard',
        name: 'Vanguard FTSE All-World High Dividend Yield UCITS ETF USD Dist',
        isin: 'IE00B8GKDB10',
        symbol: 'VG76',
        value: 227647.83,
        lastValueUpdateDate: '05/08/2026',
        pricesSheet: 'VanGuard_IE00B8GKDB10',
        dividendsSheet: 'VanGuard_IE00B8GKDB10_div',
        tier: 'tier_1'
    },
    {
        id: 'invescoEu',
        name: 'Invesco EURO STOXX Hi Div Low Vlty UCITS ETF Dist',
        isin: 'IE00BZ4BMM98',
        symbol: 'EHDV',
        value: 110409.48,
        lastValueUpdateDate: '05/08/2026',
        pricesSheet: 'InvescoEu_IE00BZ4BMM98',
        dividendsSheet: 'InvescoEu_IE00BZ4BMM98_div',
        tier: 'EU'
    },
    {
        id: 'ishareEuSelect',
        name: 'iShares EURO STOXX Select Dividend 30 UCITS (DE) EUR (Dist) ETF',
        isin: 'DE0002635281',
        symbol: 'EXSG',
        value: 90455.06,
        lastValueUpdateDate: '05/08/2026',
        pricesSheet: 'iShareEuSelect_DE0002635281',
        dividendsSheet: 'iShareEuSelect_DE0002635281_div',
        tier: 'EU'
    },
    {
        id: 'ishareEuBank',
        name: 'iShares STOXX Europe 600 Banks UCITS (DE) ETF',
        isin: 'DE000A0F5UJ7',
        symbol: 'EXV1',
        value: 34789.88,
        lastValueUpdateDate: '05/08/2026',
        pricesSheet: 'iSharesEuBank_DE000A0F5UJ7',
        dividendsSheet: 'iSharesEuBank_DE000A0F5UJ7_div',
        tier: 'tier_2'
    },
    {
        id: 'ishareUk',
        name: 'iShares UK Dividend UCITS ETF GBP (Dist)',
        isin: 'IE00B0M63060',
        symbol: 'IUKD',
        value: 32239.31,
        lastValueUpdateDate: '05/08/2026',
        pricesSheet: 'iSharesUK_IE00B0M63060',
        dividendsSheet: 'iSharesUK_IE00B0M63060_div',
        tier: 'tier_2'
    }
] as const satisfies readonly FundConfig[];
