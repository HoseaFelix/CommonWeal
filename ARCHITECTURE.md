# VendorLens Architecture

## Product Structure

VendorLens is organized around a vendor due diligence workflow rather than a general document analyzer.

### Frontend

- `Overview`: reviewed vendor metrics and recent dossiers
- `Vendor Intake`: vendor review submission form
- `Compare`: side-by-side vendor decision support
- `Frameworks`: trust framework benchmark runner
- `Activity`: permanent action ledger
- `Briefing`: portfolio summary generator

### Contract

`VendorTrustLedger` stores:

- `VendorReview`
- `VendorComparison`
- `FrameworkBenchmark`
- `ActivityEntry`
- `DueDiligenceReport`

## Core Methods

- `review_vendor(vendor_name, service_scope, materials)`
- `compare_vendors(review_a_id, review_b_id)`
- `benchmark_vendor(review_id, framework_type)`
- `generate_due_diligence_report()`

## Query Methods

- `get_review(review_id)`
- `get_user_reviews(user_address)`
- `get_comparison(comparison_id)`
- `get_user_comparisons(user_address)`
- `get_benchmark(benchmark_id)`
- `get_user_benchmarks(user_address)`
- `get_report(report_id)`
- `get_user_activity(user_address)`

## GenLayer Fit

- Vendor materials are messy and require non-deterministic judgment
- Structured outputs make validator checks practical
- Comparison and benchmark steps create multi-step reasoning
- Durable activity logs are useful for procurement workflows
- Portfolio reports turn individual reviews into operational decisions
