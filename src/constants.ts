export const FUND_TIER_OBJ = {
    tier_1: {
        shortName: 'T1',
        longName: 'TIER 1: Global Core ... world / LARGE impact on the world',
        maxAllocation: 0.7
    },
    EU: {
        shortName: 'EU',
        longName: 'euro region',
        maxAllocation: 0.2
    },
    tier_2: {
        shortName: 'T2',
        longName: 'Tier 2: Regional, but NOT high impact on the world',
        maxAllocation: 0.1
    }
} as const;

export const TODAY_TIMESTAMP = '2026-07-15T18:00:00.780Z';

export type FundTierKey = keyof typeof FUND_TIER_OBJ;

export type FundConfig = {
    id: string;
    pricesSheet: string;
    dividendsSheet: string;
    tier: FundTierKey;
    taxRate?: number;
};

export const FUNDS = [
    {
        id: 'vaneck',
        pricesSheet: 'vaneck_NL0011683594',
        dividendsSheet: 'vaneck_NL0011683594_div',
        tier: 'tier_1',
        taxRate: 0.15
    },
    {
        id: 'globalSelect',
        pricesSheet: 'GlobalSelect_DE000A0F5UH1',
        dividendsSheet: 'GlobalSelect_DE000A0F5UH1_div',
        tier: 'tier_1'
    },
    {
        id: 'vanguard',
        pricesSheet: 'VanGuard_IE00B8GKDB10',
        dividendsSheet: 'VanGuard_IE00B8GKDB10_div',
        tier: 'tier_1'
    },
    {
        id: 'invescoEu',
        pricesSheet: 'InvescoEu_IE00BZ4BMM98',
        dividendsSheet: 'InvescoEu_IE00BZ4BMM98_div',
        tier: 'EU'
    },
    {
        id: 'ishareEuSelect',
        pricesSheet: 'iShareEuSelect_DE0002635281',
        dividendsSheet: 'iShareEuSelect_DE0002635281_div',
        tier: 'EU'
    },
    {
        id: 'ishareEuBank',
        pricesSheet: 'iSharesEuBank_DE000A0F5UJ7',
        dividendsSheet: 'iSharesEuBank_DE000A0F5UJ7_div',
        tier: 'tier_2'
    },
    {
        id: 'ishareUk',
        pricesSheet: 'iSharesUK_IE00B0M63060',
        dividendsSheet: 'iSharesUK_IE00B0M63060_div',
        tier: 'tier_2'
    }
] as const satisfies readonly FundConfig[];
