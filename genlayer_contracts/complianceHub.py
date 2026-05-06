# { "Depends": "py-genlayer:test" }
from genlayer import *
from dataclasses import dataclass
import json

@allow_storage
@dataclass
class RiskyClause:
    clause: str
    risk: str
    reason: str

@allow_storage
@dataclass
class PolicyAnalysis:
    analysis_id: str
    policy_name: str
    policy_text: str
    author: str
    risk_score: u64
    risk_level: str
    summary: str
    risky_clauses: DynArray[RiskyClause]
    plain_english: DynArray[str]
    compliance_flags: DynArray[str]
    recommendations: DynArray[str]
    timestamp: u64

@allow_storage
@dataclass
class PolicyComparison:
    comparison_id: str
    policy_a_id: str
    policy_b_id: str
    author: str
    divergence_score: u64
    key_differences: DynArray[str]
    shared_risks: DynArray[str]
    alignment_assessment: str
    harmonization_suggestions: DynArray[str]
    timestamp: u64

@allow_storage
@dataclass
class ComplianceBenchmark:
    benchmark_id: str
    policy_analysis_id: str
    author: str
    standard_type: str
    compliance_score: u64
    gaps: DynArray[str]
    strengths: DynArray[str]
    improvement_priority: str
    timeline_suggestion: str
    timestamp: u64

@allow_storage
@dataclass
class AuditTrail:
    trail_id: str
    policy_id: str
    author: str
    action: str
    timestamp: u64
    change_details: str

@allow_storage
@dataclass
class ComplianceReport:
    report_id: str
    workspace_owner: str
    author: str
    total_policies: u64
    average_risk_score: u64
    high_risk_count: u64
    critical_risk_count: u64
    compliance_status: str
    key_recommendations: DynArray[str]
    generated_at: u64

class ComplianceHub(gl.Contract):
    analyses: TreeMap[str, PolicyAnalysis]
    comparisons: TreeMap[str, PolicyComparison]
    benchmarks: TreeMap[str, ComplianceBenchmark]
    audit_trails: TreeMap[str, AuditTrail]
    reports: TreeMap[str, ComplianceReport]
    
    user_analyses: TreeMap[str, DynArray[str]]
    user_comparisons: TreeMap[str, DynArray[str]]
    user_benchmarks: TreeMap[str, DynArray[str]]
    user_audit_trails: TreeMap[str, DynArray[str]]
    
    analysis_count: u64
    comparison_count: u64
    benchmark_count: u64
    audit_count: u64
    report_count: u64

    def __init__(self):
        pass

    def _normalize_address(self, address: str) -> str:
        addr = address.lower()
        if not addr.startswith("0x"):
            addr = "0x" + addr
        return addr

    def _extract_json_object(self, raw: str) -> dict:
        cleaned = raw.replace("```json", "").replace("```", "").strip()

        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict):
                return parsed
        except:
            pass

        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            candidate = cleaned[start:end + 1]
            parsed = json.loads(candidate)
            if isinstance(parsed, dict):
                return parsed

        raise Exception("Model did not return valid JSON object")

    def _normalize_risk_level(self, risk_level: str) -> str:
        value = str(risk_level).strip().lower()
        if value == "critical":
            return "Critical"
        if value == "high":
            return "High"
        if value == "medium":
            return "Medium"
        return "Low"

    def _normalize_score(self, value) -> int:
        try:
            score = int(float(value))
        except:
            score = 0

        if score < 0:
            return 0
        if score > 100:
            return 100
        return score

    def _normalize_string_list(self, value) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(item).strip() for item in value if str(item).strip()]

    # ========== POLICY ANALYSIS ==========
    @gl.public.write
    def analyze_policy(self, policy_text: str, policy_name: str = ""):
        if not policy_text or len(policy_text.strip()) == 0:
            raise Exception("Policy text cannot be empty")

        normalized_policy_text = policy_text.strip()
        normalized_policy_name = policy_name.strip() if policy_name else "Untitled Policy"

        prompt = f"""
You are an expert compliance and risk analyst. Analyze this policy with rigor and return structured output.

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{{
  "risk_score": 0,
  "risk_level": "Low",
  "summary": "concise summary",
  "risky_clauses": [
    {{"clause": "specific text", "risk": "High", "reason": "detailed explanation"}}
  ],
  "plain_english": ["point 1", "point 2"],
  "compliance_flags": ["GDPR concern", "liability risk"],
  "recommendations": ["action 1", "action 2"]
}}

Policy:
"{normalized_policy_text}"
"""

        def leader_fn():
            data = gl.nondet.exec_prompt(prompt, response_format="json")

            risky_clauses = []
            if isinstance(data.get("risky_clauses", []), list):
                for item in data.get("risky_clauses", []):
                    if isinstance(item, dict):
                        risky_clauses.append(
                            {
                                "clause": str(item.get("clause", "")).strip(),
                                "risk": self._normalize_risk_level(str(item.get("risk", "Medium"))),
                                "reason": str(item.get("reason", "")).strip(),
                            }
                        )

            return {
                "risk_score": self._normalize_score(data.get("risk_score", 0)),
                "risk_level": self._normalize_risk_level(str(data.get("risk_level", "Low"))),
                "summary": str(data.get("summary", "")).strip(),
                "risky_clauses": risky_clauses,
                "plain_english": self._normalize_string_list(data.get("plain_english", [])),
                "compliance_flags": self._normalize_string_list(data.get("compliance_flags", [])),
                "recommendations": self._normalize_string_list(data.get("recommendations", [])),
            }

        def validator_fn(res: gl.vm.Result) -> bool:
            if not isinstance(res, gl.vm.Return):
                return False
            data = res.calldata
            if not isinstance(data, dict):
                return False
            required = ["risk_score", "risk_level", "summary", "risky_clauses", "plain_english", "compliance_flags", "recommendations"]
            if not all(k in data for k in required):
                return False
            try:
                score = int(float(data["risk_score"]))
                if score < 0 or score > 100:
                    return False
            except:
                return False
            if str(data["risk_level"]).lower() not in ["low", "medium", "high", "critical"]:
                return False
            if not isinstance(data["risky_clauses"], list):
                return False
            if not isinstance(data["plain_english"], list):
                return False
            if not isinstance(data["compliance_flags"], list):
                return False
            if not isinstance(data["recommendations"], list):
                return False
            return True

        analysis = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        self.analysis_count = u64(int(self.analysis_count) + 1)
        analysis_id = f"analysis_{self.analysis_count}"
        sender = self._normalize_address(str(gl.message.sender_address))

        risky_clauses_value: list[RiskyClause] = []
        for item in analysis.get("risky_clauses", []):
            risky_clauses_value.append(
                RiskyClause(
                    clause=str(item.get("clause", "")).strip(),
                    risk=str(item.get("risk", "Medium")).strip(),
                    reason=str(item.get("reason", "")).strip(),
                )
            )

        result = PolicyAnalysis(
            analysis_id=analysis_id,
            policy_name=normalized_policy_name,
            policy_text=normalized_policy_text,
            author=sender,
            risk_score=u64(int(float(analysis.get("risk_score", 0)))),
            risk_level=str(analysis.get("risk_level", "Low")).strip(),
            summary=str(analysis.get("summary", "")).strip(),
            risky_clauses=risky_clauses_value,
            plain_english=[str(x) for x in analysis.get("plain_english", [])],
            compliance_flags=[str(x) for x in analysis.get("compliance_flags", [])],
            recommendations=[str(x) for x in analysis.get("recommendations", [])],
            timestamp=self.analysis_count,
        )

        self.analyses[analysis_id] = result

        if sender in self.user_analyses:
            arr = self.user_analyses[sender]
            arr.append(analysis_id)
            self.user_analyses[sender] = arr
        else:
            self.user_analyses[sender] = [analysis_id]

        # Audit trail
        self._create_audit_trail(analysis_id, sender, "ANALYSIS_CREATED", f"Policy analyzed: {normalized_policy_name}")

    # ========== POLICY COMPARISON ==========
    @gl.public.write
    def compare_policies(self, analysis_a_id: str, analysis_b_id: str):
        if analysis_a_id not in self.analyses or analysis_b_id not in self.analyses:
            raise Exception("One or both analyses not found")

        analysis_a = self.analyses[analysis_a_id]
        analysis_b = self.analyses[analysis_b_id]

        prompt = f"""
You are a policy comparison expert. Compare these two policies and provide structured analysis.

Policy A Summary: {analysis_a.summary}
Policy A Risk Level: {analysis_a.risk_level}
Policy A Compliance Flags: {', '.join(analysis_a.compliance_flags)}

Policy B Summary: {analysis_b.summary}
Policy B Risk Level: {analysis_b.risk_level}
Policy B Compliance Flags: {', '.join(analysis_b.compliance_flags)}

Return ONLY valid JSON:
{{
  "divergence_score": 0,
  "key_differences": ["diff 1", "diff 2"],
  "shared_risks": ["risk 1"],
  "alignment_assessment": "summary of alignment",
  "harmonization_suggestions": ["suggestion 1"]
}}

Divergence score: 0-100 (how different are they)
"""

        def leader_fn():
            data = gl.nondet.exec_prompt(prompt, response_format="json")
            return {
                "divergence_score": self._normalize_score(data.get("divergence_score", 0)),
                "key_differences": self._normalize_string_list(data.get("key_differences", [])),
                "shared_risks": self._normalize_string_list(data.get("shared_risks", [])),
                "alignment_assessment": str(data.get("alignment_assessment", "")).strip(),
                "harmonization_suggestions": self._normalize_string_list(data.get("harmonization_suggestions", [])),
            }

        def validator_fn(res: gl.vm.Result) -> bool:
            if not isinstance(res, gl.vm.Return):
                return False
            data = res.calldata
            if not isinstance(data, dict):
                return False
            required = ["divergence_score", "key_differences", "shared_risks", "alignment_assessment"]
            if not all(k in data for k in required):
                return False
            try:
                score = int(float(data["divergence_score"]))
                if score < 0 or score > 100:
                    return False
            except:
                return False
            return True

        comparison_result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        self.comparison_count = u64(int(self.comparison_count) + 1)
        comparison_id = f"comparison_{self.comparison_count}"
        sender = self._normalize_address(str(gl.message.sender_address))

        result = PolicyComparison(
            comparison_id=comparison_id,
            policy_a_id=analysis_a_id,
            policy_b_id=analysis_b_id,
            author=sender,
            divergence_score=u64(int(float(comparison_result.get("divergence_score", 0)))),
            key_differences=[str(x) for x in comparison_result.get("key_differences", [])],
            shared_risks=[str(x) for x in comparison_result.get("shared_risks", [])],
            alignment_assessment=str(comparison_result.get("alignment_assessment", "")).strip(),
            harmonization_suggestions=[str(x) for x in comparison_result.get("harmonization_suggestions", [])],
            timestamp=self.comparison_count,
        )

        self.comparisons[comparison_id] = result

        if sender in self.user_comparisons:
            arr = self.user_comparisons[sender]
            arr.append(comparison_id)
            self.user_comparisons[sender] = arr
        else:
            self.user_comparisons[sender] = [comparison_id]

        self._create_audit_trail(comparison_id, sender, "COMPARISON_CREATED", f"Compared {analysis_a_id} vs {analysis_b_id}")

    # ========== COMPLIANCE BENCHMARKING ==========
    @gl.public.write
    def benchmark_against_standard(self, analysis_id: str, standard_type: str):
        if analysis_id not in self.analyses:
            raise Exception("Analysis not found")

        analysis = self.analyses[analysis_id]
        standard_context = {
            "GDPR": "GDPR compliance requirements: data protection, consent, DPO, data breach reporting",
            "CCPA": "CCPA requirements: consumer rights, opt-out, data transparency, security",
            "ISO27001": "ISO 27001: information security management, controls, risk assessment",
            "HIPAA": "HIPAA: health data protection, privacy rules, security rules, breach notification",
        }

        standard_desc = standard_context.get(standard_type, f"Standard {standard_type}")

        prompt = f"""
You are a compliance certification auditor. Benchmark this policy against {standard_type}.

Policy Risk Level: {analysis.risk_level}
Policy Risk Score: {analysis.risk_score}/100
Compliance Flags: {', '.join(analysis.compliance_flags)}

Standard: {standard_desc}

Return ONLY valid JSON:
{{
  "compliance_score": 0,
  "gaps": ["gap 1 - specific missing control"],
  "strengths": ["strength 1"],
  "improvement_priority": "High/Medium/Low",
  "timeline_suggestion": "3 months / 6 months / immediate"
}}

Compliance score: 0-100
"""

        def leader_fn():
            data = gl.nondet.exec_prompt(prompt, response_format="json")
            return {
                "compliance_score": self._normalize_score(data.get("compliance_score", 0)),
                "gaps": self._normalize_string_list(data.get("gaps", [])),
                "strengths": self._normalize_string_list(data.get("strengths", [])),
                "improvement_priority": str(data.get("improvement_priority", "Medium")).strip(),
                "timeline_suggestion": str(data.get("timeline_suggestion", "")).strip(),
            }

        def validator_fn(res: gl.vm.Result) -> bool:
            if not isinstance(res, gl.vm.Return):
                return False
            data = res.calldata
            if not isinstance(data, dict):
                return False
            required = ["compliance_score", "gaps", "strengths", "improvement_priority"]
            if not all(k in data for k in required):
                return False
            try:
                score = int(float(data["compliance_score"]))
                if score < 0 or score > 100:
                    return False
            except:
                return False
            return True

        benchmark_result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        self.benchmark_count = u64(int(self.benchmark_count) + 1)
        benchmark_id = f"benchmark_{self.benchmark_count}"
        sender = self._normalize_address(str(gl.message.sender_address))

        result = ComplianceBenchmark(
            benchmark_id=benchmark_id,
            policy_analysis_id=analysis_id,
            author=sender,
            standard_type=standard_type,
            compliance_score=u64(int(float(benchmark_result.get("compliance_score", 0)))),
            gaps=[str(x) for x in benchmark_result.get("gaps", [])],
            strengths=[str(x) for x in benchmark_result.get("strengths", [])],
            improvement_priority=str(benchmark_result.get("improvement_priority", "Medium")).strip(),
            timeline_suggestion=str(benchmark_result.get("timeline_suggestion", "")).strip(),
            timestamp=self.benchmark_count,
        )

        self.benchmarks[benchmark_id] = result

        if sender in self.user_benchmarks:
            arr = self.user_benchmarks[sender]
            arr.append(benchmark_id)
            self.user_benchmarks[sender] = arr
        else:
            self.user_benchmarks[sender] = [benchmark_id]

        self._create_audit_trail(benchmark_id, sender, "BENCHMARK_CREATED", f"Benchmarked against {standard_type}")

    # ========== COMPLIANCE REPORTING ==========
    @gl.public.write
    def generate_compliance_report(self):
        sender = self._normalize_address(str(gl.message.sender_address))

        if sender not in self.user_analyses:
            raise Exception("No analyses found for this user")

        analysis_ids = self.user_analyses[sender]
        if len(analysis_ids) == 0:
            raise Exception("No analyses to report")

        analyses = []
        total_risk = 0
        high_count = 0
        critical_count = 0

        for analysis_id in analysis_ids:
            if analysis_id in self.analyses:
                analysis = self.analyses[analysis_id]
                analyses.append(analysis)
                total_risk = total_risk + int(analysis.risk_score)
                if str(analysis.risk_level).lower() == "high":
                    high_count = high_count + 1
                if str(analysis.risk_level).lower() == "critical":
                    critical_count = critical_count + 1

        avg_risk = total_risk / len(analyses) if len(analyses) > 0 else 0

        all_recommendations = []
        for analysis in analyses:
            all_recommendations.extend(analysis.recommendations)

        top_recommendations = all_recommendations[:5]

        self.report_count = u64(int(self.report_count) + 1)
        report_id = f"report_{self.report_count}"

        compliance_status = "CRITICAL" if critical_count > 0 else ("WARNING" if high_count > 1 else "GOOD")

        result = ComplianceReport(
            report_id=report_id,
            workspace_owner=sender,
            author=sender,
            total_policies=u64(len(analyses)),
            average_risk_score=u64(int(avg_risk)),
            high_risk_count=u64(high_count),
            critical_risk_count=u64(critical_count),
            compliance_status=compliance_status,
            key_recommendations=[str(x) for x in top_recommendations],
            generated_at=self.report_count,
        )

        self.reports[report_id] = result

        self._create_audit_trail(report_id, sender, "REPORT_GENERATED", "Compliance report created")

    # ========== AUDIT TRAIL ==========
    def _create_audit_trail(self, resource_id: str, author: str, action: str, details: str):
        self.audit_count = u64(int(self.audit_count) + 1)
        trail_id = f"audit_{self.audit_count}"

        trail = AuditTrail(
            trail_id=trail_id,
            policy_id=resource_id,
            author=author,
            action=action,
            timestamp=self.audit_count,
            change_details=details,
        )

        self.audit_trails[trail_id] = trail

        if author in self.user_audit_trails:
            arr = self.user_audit_trails[author]
            arr.append(trail_id)
            self.user_audit_trails[author] = arr
        else:
            self.user_audit_trails[author] = [trail_id]

    # ========== QUERIES ==========
    @gl.public.view
    def get_analysis(self, analysis_id: str) -> PolicyAnalysis:
        if analysis_id not in self.analyses:
            raise Exception("Analysis not found")
        return self.analyses[analysis_id]

    @gl.public.view
    def get_user_analyses(self, user_address: str) -> DynArray[PolicyAnalysis]:
        addr = self._normalize_address(user_address)
        if addr not in self.user_analyses:
            return []
        result = []
        for analysis_id in self.user_analyses[addr]:
            if analysis_id in self.analyses:
                result.append(self.analyses[analysis_id])
        return result

    @gl.public.view
    def get_comparison(self, comparison_id: str) -> PolicyComparison:
        if comparison_id not in self.comparisons:
            raise Exception("Comparison not found")
        return self.comparisons[comparison_id]

    @gl.public.view
    def get_user_comparisons(self, user_address: str) -> DynArray[PolicyComparison]:
        addr = self._normalize_address(user_address)
        if addr not in self.user_comparisons:
            return []
        result = []
        for comp_id in self.user_comparisons[addr]:
            if comp_id in self.comparisons:
                result.append(self.comparisons[comp_id])
        return result

    @gl.public.view
    def get_benchmark(self, benchmark_id: str) -> ComplianceBenchmark:
        if benchmark_id not in self.benchmarks:
            raise Exception("Benchmark not found")
        return self.benchmarks[benchmark_id]

    @gl.public.view
    def get_user_benchmarks(self, user_address: str) -> DynArray[ComplianceBenchmark]:
        addr = self._normalize_address(user_address)
        if addr not in self.user_benchmarks:
            return []
        result = []
        for bench_id in self.user_benchmarks[addr]:
            if bench_id in self.benchmarks:
                result.append(self.benchmarks[bench_id])
        return result

    @gl.public.view
    def get_report(self, report_id: str) -> ComplianceReport:
        if report_id not in self.reports:
            raise Exception("Report not found")
        return self.reports[report_id]

    @gl.public.view
    def get_user_audit_trail(self, user_address: str) -> DynArray[AuditTrail]:
        addr = self._normalize_address(user_address)
        if addr not in self.user_audit_trails:
            return []
        result = []
        for trail_id in self.user_audit_trails[addr]:
            if trail_id in self.audit_trails:
                result.append(self.audit_trails[trail_id])
        return result
