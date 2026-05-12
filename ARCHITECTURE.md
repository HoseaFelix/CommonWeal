# ComplianceHub - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COMPLIANCE HUB PLATFORM                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────── Frontend (Next.js) ──────────────────────────────┐
│                                                                                   │
│  ┌─ Navigation ─────────────────────────────────────────────────────────────┐   │
│  │ Logo           Wallet Button (MetaMask/Auto)                            │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
│  ┌─ Tab Navigation ──────────────────────────────────────────────────────────┐   │
│  │  Dashboard  │  Analyze  │  Compare  │  Benchmark  │  │  │   │
│  │               │              │             │                  │  │  │   │
│  │               │              │             │                  │  │  │   │
│  │ Audit Trail │  Reports                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                                   │
│  ┌─ Content Area ────────────────────────────────────────────────────────────┐   │
│  │                                                                           │   │
│  │  [Dynamic Component - Changes based on selected tab]                    │   │
│  │                                                                           │   │
│  │  Dashboard:      Portfolio metrics, recent analyses                     │   │
│  │  Analyze:        Policy submission form                                 │   │
│  │  Compare:        Dual policy selector                                   │   │
│  │  Benchmark:      Standard selector + policy picker                      │   │
│  │  Audit Trail:    Activity log with filters                              │   │
│  │  Reports:        Generate compliance report                             │   │
│  │                                                                           │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
                            [useContract Hook]
                                      ↓
┌───────────────────────────── GenLayer Network ──────────────────────────────┐
│                                                                             │
│  ┌──────────────────────── ComplianceHub Smart Contract ──────────────────┐ │
│  │                                                                        │ │
│  │  Write Methods (with AI Consensus):                                  │ │
│  │  ┌─ analyze_policy(text, name) ─────────────────────────────────┐    │ │
│  │  │  Leader: LLM analyzes policy                                │    │ │
│  │  │  Validators: Verify JSON schema, ranges, enums             │    │ │
│  │  │  Result: PolicyAnalysis stored                             │    │ │
│  │  └────────────────────────────────────────────────────────────┘    │ │
│  │                                                                        │ │
│  │  ┌─ compare_policies(id_a, id_b) ─────────────────────────────────┐ │
│  │  │  Leader: Analyzes divergences between 2 policies            │ │
│  │  │  Validators: Verify comparison logic, cross-refs            │ │
│  │  │  Result: PolicyComparison with divergence score             │ │
│  │  └────────────────────────────────────────────────────────────┘    │ │
│  │                                                                        │ │
│  │  ┌─ benchmark_against_standard(id, standard) ──────────────────────┐ │
│  │  │  Leader: Context-aware compliance analysis                  │ │
│  │  │  Validators: Standard-specific validation rules             │ │
│  │  │  Result: ComplianceBenchmark with score & gaps              │ │
│  │  └────────────────────────────────────────────────────────────┘    │ │
│  │                                                                        │ │
│  │  ┌─ generate_compliance_report() ──────────────────────────────────┐ │
│  │  │  Leader: Aggregate all user's analyses                     │ │
│  │  │  Validators: Verify aggregation, calculate metrics         │ │
│  │  │  Result: ComplianceReport with portfolio insights          │ │
│  │  └────────────────────────────────────────────────────────────┘    │ │
│  │                                                                        │ │
│  │  Read Methods (Query-only):                                         │ │
│  │  • get_analysis(id)                                                 │ │
│  │  • get_user_analyses(address)                                       │ │
│  │  • get_comparison(id)                                               │ │
│  │  • get_user_comparisons(address)                                    │ │
│  │  • get_benchmark(id)                                                │ │
│  │  • get_user_benchmarks(address)                                     │ │
│  │  • get_report(id)                                                   │ │
│  │  • get_user_audit_trail(address)                                    │ │
│  │                                                                        │ │
│  │  Storage Layer:                                                      │ │
│  │  ┌─────────────────────────────────────────────────────────────┐    │ │
│  │  │ TreeMap[analysis_id → PolicyAnalysis]                      │    │ │
│  │  │ TreeMap[user_addr → [analysis_ids]]                        │    │ │
│  │  │                                                               │    │ │
│  │  │ TreeMap[comparison_id → PolicyComparison]                  │    │ │
│  │  │ TreeMap[user_addr → [comparison_ids]]                      │    │ │
│  │  │                                                               │    │ │
│  │  │ TreeMap[benchmark_id → ComplianceBenchmark]                │    │ │
│  │  │ TreeMap[user_addr → [benchmark_ids]]                       │    │ │
│  │  │                                                               │    │ │
│  │  │ TreeMap[report_id → ComplianceReport]                      │    │ │
│  │  │                                                               │    │ │
│  │  │ TreeMap[audit_id → AuditTrail]                             │    │ │
│  │  │ TreeMap[user_addr → [audit_ids]]                           │    │ │
│  │  └─────────────────────────────────────────────────────────────┘    │ │
│  │                                                                        │ │
│  │  Data Models:                                                         │ │
│  │  • RiskyClause {clause, risk, reason}                               │ │
│  │  • PolicyAnalysis {id, text, author, score, level, ...}             │ │
│  │  • PolicyComparison {id, policy_a, policy_b, divergence, ...}       │ │
│  │  • ComplianceBenchmark {id, policy_id, standard, score, gaps, ...}  │ │
│  │  • ComplianceReport {id, owner, metrics, status, recommendations}   │ │
│  │  • AuditTrail {id, resource, author, action, timestamp, ...}        │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Validator Consensus Mechanism:                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 1. User submits write method → Leader executes LLM            │    │
│  │ 2. All validators receive result                              │    │
│  │ 3. Each validator verifies:                                   │    │
│  │    • JSON structure validation                                │    │
│  │    • Range validation (0-100 scores)                          │    │
│  │    • Enum validation (levels, standards)                      │    │
│  │    • Cross-reference validation                               │    │
│  │    • Semantic equivalence checking                            │    │
│  │ 4. Consensus reached (all validators agree)                   │    │
│  │ 5. Result stored permanently on-chain                         │    │
│  │ 6. Response sent to frontend                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                              Data Flow Diagram
                              
┌─────────────┐
│   Browser   │
│   (User)    │
└──────┬──────┘
       │ Connect Wallet
       ↓
┌──────────────────┐
│  Wallet Button   │
│ (MetaMask/Auto)  │
└────────┬─────────┘
         │ Account Address
         ↓
   ┌─────────────┐
   │   useHook   │
   │  useContract│
   └─────┬───────┘
         │
    ┌────┴─────┐
    │           │
    ↓           ↓
┌────────┐   ┌────────────────────┐
│ Write  │   │ Read (Query-only)   │
│Methods │   │                     │
│        │   │ • get_analyses      │
│ • a... │   │ • get_comparisons   │
│ • c... │   │ • get_benchmarks    │
│ • b... │   │ • get_audit_trail   │
│ • g... │   │ • get_report        │
└────┬───┘   └────────┬────────────┘
     │                │
     └────────┬───────┘
              │
              ↓
    ┌──────────────────┐
    │ GenLayer Network │
    │ Validators       │
    │ Consensus        │
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ On-Chain Storage │
    │ (Permanent)      │
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ Response to UI   │
    │ (via useHook)    │
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ Update Component │
    │ State            │
    └────────┬─────────┘
             │
             ↓
    ┌──────────────────┐
    │ Render Results   │
    │ to User          │
    └──────────────────┘
```

## Complexity Pyramid

```
                          ┌─────────────┐
                          │  Enterprise │
                          │  Reporting  │
                          │  & Insights │
                          └──────┬──────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ↓            ↓            ↓
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ Portfolio│ │Compliance│ │   Audit  │
              │ Metrics  │ │ Status   │ │  Trail   │
              └────┬─────┘ └────┬─────┘ └────┬─────┘
                   │            │            │
        ┌──────────┼────────────┼────────────┼──────────┐
        │          │            │            │          │
        ↓          ↓            ↓            ↓          ↓
    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
    │Analyze │ │Compare │ │Benchmark Compare│ │Audit   │
    │Policy  │ │Policies│ │Standard│ │Trail   │
    └───┬────┘ └───┬────┘ └───┬────┘ └────────┘
        │          │          │
        └──────────┼──────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │ GenLayer Validators  │
        │ & Consensus Engine   │
        └──────────────────────┘
```

## Validation Complexity Levels

```
Level 1: Basic Validation (Original)
├─ Type checking (dict, list)
└─ Range checking (0-100 integers)

Level 2: Intermediate Validation (Some new methods)
├─ JSON schema validation
├─ Enum validation (High/Medium/Low/Critical)
├─ Array validation (list of clauses)
└─ Required field checking

Level 3: Advanced Validation (All new methods)
├─ Nested JSON structures
├─ Cross-reference validation (policy IDs exist)
├─ Semantic equivalence checking
├─ Multi-step validation logic
└─ Domain-specific rules (GDPR, CCPA, ISO27001, HIPAA)

Level 4: Complex Consensus (All methods)
├─ Multiple validators must agree
├─ Equivalence principle applied
├─ Validator timeout & retry logic
└─ On-chain result storage
```

## Service Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                              │
│  Dashboard │ Analyze │ Compare │ Benchmark │ Audit │ Reports   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYSIS ENGINE                               │
│                  (Smart Contract)                                │
│                                                                  │
│  Analyze      Compare          Benchmark      Report    Audit   │
│  Policy  ──→  Policies    ──→  Standard  ──→  Generate ──→ Trail │
│                 │                │                │              │
│                 └────────────────┴────────────────┘              │
│                      (Uses previous results)                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    VALIDATION LAYER                              │
│        (Strict JSON, enums, ranges, cross-refs)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   CONSENSUS MECHANISM                            │
│            (All validators must agree)                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   ON-CHAIN STORAGE                               │
│            (Permanent, immutable records)                        │
└─────────────────────────────────────────────────────────────────┘
```

## Why This Is Complex

### Validator Workload Per Method

**analyze_policy():**
1. Receive policy text
2. Run LLM analysis (non-deterministic)
3. Parse JSON response
4. Validate structure (5+ checks)
5. Validate ranges (score 0-100)
6. Validate enums (risk level)
7. Validate arrays (clauses, flags)
8. Store result
9. Update audit trail

**compare_policies():**
1. Fetch 2 previous analyses
2. Run LLM comparison analysis
3. Parse JSON response
4. Validate structure (5+ checks)
5. Validate ranges (divergence 0-100)
6. Cross-reference policy IDs
7. Validate recommendations
8. Store result
9. Update audit trail

**benchmark_against_standard():**
1. Fetch previous analysis
2. Validate standard type (enum)
3. Run context-aware LLM analysis
4. Parse JSON response
5. Validate structure (6+ checks)
6. Validate ranges (compliance 0-100)
7. Validate enums (priority)
8. Validate timeline format
9. Store result
10. Update audit trail

**generate_compliance_report():**
1. Fetch all user analyses
2. Aggregate metrics
3. Calculate averages
4. Determine compliance status
5. Extract key recommendations
6. Run synthesis LLM
7. Validate structure
8. Store result
9. Update audit trail

---

