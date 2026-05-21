# AI Requirements

## Model
- Claude Sonnet (claude-sonnet-4-6, latest stable Sonnet)

## Classification Strategy
Hybrid, applied in order:
1. **Rule-based** — keyword/pattern matching against known merchants and categories
2. **Claude API fallback** — for transactions that do not match any rule
3. **User correction learning** — user corrections are stored and applied before rule-based on future uploads

## AI Features
- Transaction categorization
- Subscription detection (recurring transactions at regular intervals)
- Spending analysis
- Monthly financial summaries

## Cost Control
- Classify in batches of up to 50 transactions per API request
- Cache classification results by transaction fingerprint
- Skip reclassification for transactions with unchanged data
- Do not send raw file data to the API — send normalized transaction fields only

## Data Integrity Constraints
- Never overwrite raw transaction data with AI-generated values
- Preserve original amount, date, and description fields at all times
- Store AI-generated category separately from raw data
- Always include confidence level with each classification result
- Never hallucinate or infer amounts not present in source data

## User Correction
- User corrections are saved per merchant name or pattern
- Corrections take priority over rule-based and AI classification on future runs
