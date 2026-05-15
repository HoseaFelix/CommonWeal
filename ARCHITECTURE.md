# Commonweal Architecture

## Product Structure

Commonweal is organized around a grant allocation workflow rather than a generic text analysis tool.

### Frontend

- `Signal`: live portfolio metrics and recent application activity
- `Intake`: application review submission form
- `Matchup`: side-by-side applicant comparison
- `Rubrics`: benchmark runner for funding criteria
- `Ledger`: permanent operational trail
- `Memo`: portfolio-level funding summary generator

### Contract

`GrantCouncilLedger` stores:

- `GrantApplication`
- `ApplicantComparison`
- `FundingBenchmark`
- `LedgerEntry`
- `FundingMemo`

## Core Methods

- `review_application(applicant_name, project_title, funding_request, application_materials)`
- `compare_applications(application_a_id, application_b_id)`
- `benchmark_application(application_id, rubric_type)`
- `generate_funding_memo()`

## Query Methods

- `get_application(application_id)`
- `get_user_applications(user_address)`
- `get_comparison(comparison_id)`
- `get_user_comparisons(user_address)`
- `get_benchmark(benchmark_id)`
- `get_user_benchmarks(user_address)`
- `get_memo(memo_id)`
- `get_user_ledger_entries(user_address)`

## GenLayer Fit

- Grant applications are messy and require non-deterministic judgment
- Structured outputs make validator checks practical
- Comparison and rubric review create multi-step reasoning
- Durable ledgers help committees defend release decisions
- Portfolio memos turn scattered reviews into capital allocation posture
