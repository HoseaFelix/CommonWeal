export const ComplianceHubABI = [
  {
    "type": "function",
    "name": "analyze_policy",
    "inputs": [
      { "name": "policy_text", "type": "string" },
      { "name": "policy_name", "type": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "compare_policies",
    "inputs": [
      { "name": "analysis_a_id", "type": "string" },
      { "name": "analysis_b_id", "type": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "benchmark_against_standard",
    "inputs": [
      { "name": "analysis_id", "type": "string" },
      { "name": "standard_type", "type": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "generate_compliance_report",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "get_analysis",
    "inputs": [{ "name": "analysis_id", "type": "string" }],
    "outputs": [
      {
        "type": "tuple",
        "components": [
          { "name": "analysis_id", "type": "string" },
          { "name": "policy_name", "type": "string" },
          { "name": "policy_text", "type": "string" },
          { "name": "author", "type": "string" },
          { "name": "risk_score", "type": "uint64" },
          { "name": "risk_level", "type": "string" },
          { "name": "summary", "type": "string" },
          { "name": "risky_clauses", "type": "tuple[]", "components": [
            { "name": "clause", "type": "string" },
            { "name": "risk", "type": "string" },
            { "name": "reason", "type": "string" }
          ]},
          { "name": "plain_english", "type": "string[]" },
          { "name": "compliance_flags", "type": "string[]" },
          { "name": "recommendations", "type": "string[]" },
          { "name": "timestamp", "type": "uint64" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "get_user_analyses",
    "inputs": [{ "name": "user_address", "type": "string" }],
    "outputs": [
      {
        "type": "tuple[]",
        "components": [
          { "name": "analysis_id", "type": "string" },
          { "name": "policy_name", "type": "string" },
          { "name": "policy_text", "type": "string" },
          { "name": "author", "type": "string" },
          { "name": "risk_score", "type": "uint64" },
          { "name": "risk_level", "type": "string" },
          { "name": "summary", "type": "string" },
          { "name": "risky_clauses", "type": "tuple[]", "components": [
            { "name": "clause", "type": "string" },
            { "name": "risk", "type": "string" },
            { "name": "reason", "type": "string" }
          ]},
          { "name": "plain_english", "type": "string[]" },
          { "name": "compliance_flags", "type": "string[]" },
          { "name": "recommendations", "type": "string[]" },
          { "name": "timestamp", "type": "uint64" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "get_comparison",
    "inputs": [{ "name": "comparison_id", "type": "string" }],
    "outputs": [
      {
        "type": "tuple",
        "components": [
          { "name": "comparison_id", "type": "string" },
          { "name": "policy_a_id", "type": "string" },
          { "name": "policy_b_id", "type": "string" },
          { "name": "author", "type": "string" },
          { "name": "divergence_score", "type": "uint64" },
          { "name": "key_differences", "type": "string[]" },
          { "name": "shared_risks", "type": "string[]" },
          { "name": "alignment_assessment", "type": "string" },
          { "name": "harmonization_suggestions", "type": "string[]" },
          { "name": "timestamp", "type": "uint64" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "get_user_comparisons",
    "inputs": [{ "name": "user_address", "type": "string" }],
    "outputs": [
      {
        "type": "tuple[]",
        "components": [
          { "name": "comparison_id", "type": "string" },
          { "name": "policy_a_id", "type": "string" },
          { "name": "policy_b_id", "type": "string" },
          { "name": "author", "type": "string" },
          { "name": "divergence_score", "type": "uint64" },
          { "name": "key_differences", "type": "string[]" },
          { "name": "shared_risks", "type": "string[]" },
          { "name": "alignment_assessment", "type": "string" },
          { "name": "harmonization_suggestions", "type": "string[]" },
          { "name": "timestamp", "type": "uint64" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "get_benchmark",
    "inputs": [{ "name": "benchmark_id", "type": "string" }],
    "outputs": [
      {
        "type": "tuple",
        "components": [
          { "name": "benchmark_id", "type": "string" },
          { "name": "policy_analysis_id", "type": "string" },
          { "name": "author", "type": "string" },
          { "name": "standard_type", "type": "string" },
          { "name": "compliance_score", "type": "uint64" },
          { "name": "gaps", "type": "string[]" },
          { "name": "strengths", "type": "string[]" },
          { "name": "improvement_priority", "type": "string" },
          { "name": "timeline_suggestion", "type": "string" },
          { "name": "timestamp", "type": "uint64" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "get_user_benchmarks",
    "inputs": [{ "name": "user_address", "type": "string" }],
    "outputs": [
      {
        "type": "tuple[]",
        "components": [
          { "name": "benchmark_id", "type": "string" },
          { "name": "policy_analysis_id", "type": "string" },
          { "name": "author", "type": "string" },
          { "name": "standard_type", "type": "string" },
          { "name": "compliance_score", "type": "uint64" },
          { "name": "gaps", "type": "string[]" },
          { "name": "strengths", "type": "string[]" },
          { "name": "improvement_priority", "type": "string" },
          { "name": "timeline_suggestion", "type": "string" },
          { "name": "timestamp", "type": "uint64" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "get_report",
    "inputs": [{ "name": "report_id", "type": "string" }],
    "outputs": [
      {
        "type": "tuple",
        "components": [
          { "name": "report_id", "type": "string" },
          { "name": "workspace_owner", "type": "string" },
          { "name": "author", "type": "string" },
          { "name": "total_policies", "type": "uint64" },
          { "name": "average_risk_score", "type": "uint64" },
          { "name": "high_risk_count", "type": "uint64" },
          { "name": "critical_risk_count", "type": "uint64" },
          { "name": "compliance_status", "type": "string" },
          { "name": "key_recommendations", "type": "string[]" },
          { "name": "generated_at", "type": "uint64" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "get_user_audit_trail",
    "inputs": [{ "name": "user_address", "type": "string" }],
    "outputs": [
      {
        "type": "tuple[]",
        "components": [
          { "name": "trail_id", "type": "string" },
          { "name": "policy_id", "type": "string" },
          { "name": "author", "type": "string" },
          { "name": "action", "type": "string" },
          { "name": "timestamp", "type": "uint64" },
          { "name": "change_details", "type": "string" }
        ]
      }
    ],
    "stateMutability": "view"
  }
];
