## funds database link
- https://docs.google.com/spreadsheets/d/1pXh3KriF1L5yaB8K2ERCe9Kw5i6vOwm1y_3bh_Ocfaw/edit?gid=1886461852#gid=1886461852 


## original google sheets allocations manager, where I manually did all this stuff
- https://docs.google.com/spreadsheets/d/1AAP8Db8sCn3AGQRb8OzSWZnDmxaotl_BYKToQq3C6QE/edit?gid=1014089358#gid=1014089358

## APP functionality notes:
- if 'latest price data' is older than 14 days, you get RED background and 'tooltip' to tell me how old is the data = this tells me I need to update it

## AI calls the FIRST header row as 'summary header'
- so we have 2 headers
- 1. Summary header - is the top header
- 2. title row header - is the main header



####################################################################
## How to add a new fund
####################################################################

- Ideally its faster to get AI to do it, but if you want manually then:


1. add it to the FUNDS array: src/constants.ts  -> FUNDS object

2. add it to the APP file as a fund: src/App.tsx  ->  see HOOKS that generate config:     

    const ishareUkConfig = getFundConfig('ishareUk');
    const ishareUk = useFundSummary(
        ishareUkConfig.name,
        ishareUkConfig.isin,
        ishareUkConfig.pricesSheet,
        ishareUkConfig.dividendsSheet,
        backDate,
        asOfDate,
        ishareUkConfig.taxRate
    );

3. add to the Summaries useMemo:

    const funds = useMemo(() => {
        const summaries = {
            vaneck,
            globalSelect,
            vanguard,
            lgEuro,
            wisdomTreEu,
            invescoEu,
            ishareEuSelect,
            ishareEuBank,
            ishareUk
            <!-- SHOULD GO HERE -->
        };


####################################################################
## How to change fund POSITION In the table
####################################################################

- in the FUNDS array: src/constants.ts  -> FUNDS object ... position here, determines them in the table

