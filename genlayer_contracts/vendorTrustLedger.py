# { "Depends": "py-genlayer:test" }
from genlayer import *
from dataclasses import dataclass


@allow_storage
@dataclass
class CriticalFinding:
    area: str
    severity: str
    rationale: str


@allow_storage
@dataclass
class VendorReview:
    review_id: str
    vendor_name: str
    service_scope: str
    materials: str
    author: str
    trust_score: u64
    decision: str
    summary: str
    critical_findings: DynArray[CriticalFinding]
    strengths: DynArray[str]
    follow_up_questions: DynArray[str]
    recommended_controls: DynArray[str]
    timestamp: u64


@allow_storage
@dataclass
class VendorComparison:
    comparison_id: str
    review_a_id: str
    review_b_id: str
    author: str
    differentiation_score: u64
    standout_strengths: DynArray[str]
    shared_exposures: DynArray[str]
    recommendation: str
    decision_rationale: str
    timestamp: u64


@allow_storage
@dataclass
class FrameworkBenchmark:
    benchmark_id: str
    review_id: str
    author: str
    framework_type: str
    coverage_score: u64
    uncovered_gaps: DynArray[str]
    evidence_signals: DynArray[str]
    remediation_priority: str
    approval_posture: str
    timestamp: u64


@allow_storage
@dataclass
class ActivityEntry:
    entry_id: str
    resource_id: str
    author: str
    action: str
    timestamp: u64
    details: str


@allow_storage
@dataclass
class DueDiligenceReport:
    report_id: str
    workspace_owner: str
    author: str
    total_vendors: u64
    average_trust_score: u64
    escalated_count: u64
    conditional_count: u64
    portfolio_posture: str
    key_actions: DynArray[str]
    generated_at: u64


class VendorTrustLedger(gl.Contract):
    reviews: TreeMap[str, VendorReview]
    comparisons: TreeMap[str, VendorComparison]
    benchmarks: TreeMap[str, FrameworkBenchmark]
    activity_log: TreeMap[str, ActivityEntry]
    reports: TreeMap[str, DueDiligenceReport]

    user_reviews: TreeMap[str, DynArray[str]]
    user_comparisons: TreeMap[str, DynArray[str]]
    user_benchmarks: TreeMap[str, DynArray[str]]
    user_activity: TreeMap[str, DynArray[str]]

    review_count: u64
    comparison_count: u64
    benchmark_count: u64
    activity_count: u64
    report_count: u64

    def __init__(self):
        pass

    def _normalize_address(self, address: str) -> str:
        normalized = address.lower()
        if not normalized.startswith("0x"):
            normalized = "0x" + normalized
        return normalized

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

    def _normalize_decision(self, value: str) -> str:
        lowered = str(value).strip().lower()
        if lowered == "approve":
            return "Approve"
        if lowered == "conditional":
            return "Conditional"
        return "Escalate"

    def _normalize_severity(self, value: str) -> str:
        lowered = str(value).strip().lower()
        if lowered == "critical":
            return "Critical"
        if lowered == "high":
            return "High"
        if lowered == "medium":
            return "Medium"
        return "Low"

    def _normalize_priority(self, value: str) -> str:
        lowered = str(value).strip().lower()
        if lowered == "immediate":
            return "Immediate"
        if lowered == "high":
            return "High"
        if lowered == "medium":
            return "Medium"
        return "Low"

    def _normalize_posture(self, value: str) -> str:
        lowered = str(value).strip().lower()
        if lowered == "ready":
            return "Ready"
        if lowered == "conditional":
            return "Conditional"
        return "Blocked"

    @gl.public.write
    def review_vendor(self, vendor_name: str, service_scope: str, materials: str):
        if len(vendor_name.strip()) == 0:
            raise Exception("Vendor name cannot be empty")
        if len(materials.strip()) == 0:
            raise Exception("Vendor materials cannot be empty")

        normalized_vendor_name = vendor_name.strip()
        normalized_scope = service_scope.strip() if len(service_scope.strip()) > 0 else "Unspecified service scope"
        normalized_materials = materials.strip()

        prompt = f"""
You are a third-party risk analyst running vendor due diligence.

Review the vendor materials and return ONLY valid JSON:
{{
  "trust_score": 0,
  "decision": "Approve",
  "summary": "concise diligence summary",
  "critical_findings": [
    {{"area": "security controls", "severity": "High", "rationale": "why it matters"}}
  ],
  "strengths": ["strength 1", "strength 2"],
  "follow_up_questions": ["question 1", "question 2"],
  "recommended_controls": ["control 1", "control 2"]
}}

Decision must be one of: Approve, Conditional, Escalate.

Vendor name: {normalized_vendor_name}
Service scope: {normalized_scope}
Vendor materials:
{normalized_materials}
"""

        def leader_fn():
            data = gl.nondet.exec_prompt(prompt, response_format="json")
            findings = []
            if isinstance(data.get("critical_findings", []), list):
                for item in data.get("critical_findings", []):
                    if isinstance(item, dict):
                        findings.append(
                            {
                                "area": str(item.get("area", "")).strip(),
                                "severity": self._normalize_severity(str(item.get("severity", "Medium"))),
                                "rationale": str(item.get("rationale", "")).strip(),
                            }
                        )

            return {
                "trust_score": self._normalize_score(data.get("trust_score", 0)),
                "decision": self._normalize_decision(str(data.get("decision", "Escalate"))),
                "summary": str(data.get("summary", "")).strip(),
                "critical_findings": findings,
                "strengths": self._normalize_string_list(data.get("strengths", [])),
                "follow_up_questions": self._normalize_string_list(data.get("follow_up_questions", [])),
                "recommended_controls": self._normalize_string_list(data.get("recommended_controls", [])),
            }

        def validator_fn(res: gl.vm.Result) -> bool:
            if not isinstance(res, gl.vm.Return):
                return False
            data = res.calldata
            if not isinstance(data, dict):
                return False
            required = ["trust_score", "decision", "summary", "critical_findings", "strengths", "follow_up_questions", "recommended_controls"]
            if not all(key in data for key in required):
                return False
            try:
                score = int(float(data["trust_score"]))
                if score < 0 or score > 100:
                    return False
            except:
                return False
            if str(data["decision"]).lower() not in ["approve", "conditional", "escalate"]:
                return False
            if not isinstance(data["critical_findings"], list):
                return False
            return True

        review_result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        self.review_count = u64(int(self.review_count) + 1)
        review_id = f"review_{self.review_count}"
        sender = self._normalize_address(str(gl.message.sender_address))

        stored_findings: list[CriticalFinding] = []
        for item in review_result.get("critical_findings", []):
            stored_findings.append(
                CriticalFinding(
                    area=str(item.get("area", "")).strip(),
                    severity=str(item.get("severity", "Medium")).strip(),
                    rationale=str(item.get("rationale", "")).strip(),
                )
            )

        result = VendorReview(
            review_id=review_id,
            vendor_name=normalized_vendor_name,
            service_scope=normalized_scope,
            materials=normalized_materials,
            author=sender,
            trust_score=u64(int(review_result.get("trust_score", 0))),
            decision=str(review_result.get("decision", "Escalate")).strip(),
            summary=str(review_result.get("summary", "")).strip(),
            critical_findings=stored_findings,
            strengths=[str(item) for item in review_result.get("strengths", [])],
            follow_up_questions=[str(item) for item in review_result.get("follow_up_questions", [])],
            recommended_controls=[str(item) for item in review_result.get("recommended_controls", [])],
            timestamp=self.review_count,
        )

        self.reviews[review_id] = result

        if sender in self.user_reviews:
            existing = self.user_reviews[sender]
            existing.append(review_id)
            self.user_reviews[sender] = existing
        else:
            self.user_reviews[sender] = [review_id]

        self._create_activity(review_id, sender, "REVIEW_CREATED", f"Reviewed vendor: {normalized_vendor_name}")

    @gl.public.write
    def compare_vendors(self, review_a_id: str, review_b_id: str):
        if review_a_id not in self.reviews or review_b_id not in self.reviews:
            raise Exception("One or both vendor reviews were not found")

        review_a = self.reviews[review_a_id]
        review_b = self.reviews[review_b_id]

        prompt = f"""
You are a procurement review lead comparing two vendors.

Vendor A: {review_a.vendor_name}
Scope A: {review_a.service_scope}
Decision A: {review_a.decision}
Summary A: {review_a.summary}
Controls A: {', '.join(review_a.recommended_controls)}

Vendor B: {review_b.vendor_name}
Scope B: {review_b.service_scope}
Decision B: {review_b.decision}
Summary B: {review_b.summary}
Controls B: {', '.join(review_b.recommended_controls)}

Return ONLY valid JSON:
{{
  "differentiation_score": 0,
  "standout_strengths": ["strength 1"],
  "shared_exposures": ["exposure 1"],
  "recommendation": "which vendor is more decision-ready",
  "decision_rationale": "why the recommendation makes sense"
}}
"""

        def leader_fn():
            data = gl.nondet.exec_prompt(prompt, response_format="json")
            return {
                "differentiation_score": self._normalize_score(data.get("differentiation_score", 0)),
                "standout_strengths": self._normalize_string_list(data.get("standout_strengths", [])),
                "shared_exposures": self._normalize_string_list(data.get("shared_exposures", [])),
                "recommendation": str(data.get("recommendation", "")).strip(),
                "decision_rationale": str(data.get("decision_rationale", "")).strip(),
            }

        def validator_fn(res: gl.vm.Result) -> bool:
            if not isinstance(res, gl.vm.Return):
                return False
            data = res.calldata
            if not isinstance(data, dict):
                return False
            required = ["differentiation_score", "standout_strengths", "shared_exposures", "recommendation", "decision_rationale"]
            if not all(key in data for key in required):
                return False
            try:
                score = int(float(data["differentiation_score"]))
                if score < 0 or score > 100:
                    return False
            except:
                return False
            return True

        comparison_result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        self.comparison_count = u64(int(self.comparison_count) + 1)
        comparison_id = f"comparison_{self.comparison_count}"
        sender = self._normalize_address(str(gl.message.sender_address))

        result = VendorComparison(
            comparison_id=comparison_id,
            review_a_id=review_a_id,
            review_b_id=review_b_id,
            author=sender,
            differentiation_score=u64(int(comparison_result.get("differentiation_score", 0))),
            standout_strengths=[str(item) for item in comparison_result.get("standout_strengths", [])],
            shared_exposures=[str(item) for item in comparison_result.get("shared_exposures", [])],
            recommendation=str(comparison_result.get("recommendation", "")).strip(),
            decision_rationale=str(comparison_result.get("decision_rationale", "")).strip(),
            timestamp=self.comparison_count,
        )

        self.comparisons[comparison_id] = result

        if sender in self.user_comparisons:
            existing = self.user_comparisons[sender]
            existing.append(comparison_id)
            self.user_comparisons[sender] = existing
        else:
            self.user_comparisons[sender] = [comparison_id]

        self._create_activity(comparison_id, sender, "COMPARISON_CREATED", f"Compared {review_a.vendor_name} against {review_b.vendor_name}")

    @gl.public.write
    def benchmark_vendor(self, review_id: str, framework_type: str):
        if review_id not in self.reviews:
            raise Exception("Vendor review not found")

        review = self.reviews[review_id]
        framework_context = {
            "SOC2": "SOC 2 vendor expectations: controls, monitoring, incident management, access discipline",
            "ISO27001": "ISO 27001 expectations: ISMS maturity, control coverage, governance, risk treatment",
            "GDPR": "GDPR vendor expectations: lawful processing, retention, data subject rights, subprocessors",
            "HIPAA": "HIPAA vendor expectations: PHI handling, safeguards, breach processes, access accountability",
        }
        context = framework_context.get(framework_type, framework_type)

        prompt = f"""
You are a due diligence framework assessor.

Vendor: {review.vendor_name}
Scope: {review.service_scope}
Decision: {review.decision}
Summary: {review.summary}
Follow-up questions: {', '.join(review.follow_up_questions)}

Framework context: {context}

Return ONLY valid JSON:
{{
  "coverage_score": 0,
  "uncovered_gaps": ["gap 1"],
  "evidence_signals": ["signal 1"],
  "remediation_priority": "High",
  "approval_posture": "Conditional"
}}
"""

        def leader_fn():
            data = gl.nondet.exec_prompt(prompt, response_format="json")
            return {
                "coverage_score": self._normalize_score(data.get("coverage_score", 0)),
                "uncovered_gaps": self._normalize_string_list(data.get("uncovered_gaps", [])),
                "evidence_signals": self._normalize_string_list(data.get("evidence_signals", [])),
                "remediation_priority": self._normalize_priority(str(data.get("remediation_priority", "Medium"))),
                "approval_posture": self._normalize_posture(str(data.get("approval_posture", "Conditional"))),
            }

        def validator_fn(res: gl.vm.Result) -> bool:
            if not isinstance(res, gl.vm.Return):
                return False
            data = res.calldata
            if not isinstance(data, dict):
                return False
            required = ["coverage_score", "uncovered_gaps", "evidence_signals", "remediation_priority", "approval_posture"]
            if not all(key in data for key in required):
                return False
            try:
                score = int(float(data["coverage_score"]))
                if score < 0 or score > 100:
                    return False
            except:
                return False
            return True

        benchmark_result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        self.benchmark_count = u64(int(self.benchmark_count) + 1)
        benchmark_id = f"benchmark_{self.benchmark_count}"
        sender = self._normalize_address(str(gl.message.sender_address))

        result = FrameworkBenchmark(
            benchmark_id=benchmark_id,
            review_id=review_id,
            author=sender,
            framework_type=framework_type,
            coverage_score=u64(int(benchmark_result.get("coverage_score", 0))),
            uncovered_gaps=[str(item) for item in benchmark_result.get("uncovered_gaps", [])],
            evidence_signals=[str(item) for item in benchmark_result.get("evidence_signals", [])],
            remediation_priority=str(benchmark_result.get("remediation_priority", "Medium")).strip(),
            approval_posture=str(benchmark_result.get("approval_posture", "Conditional")).strip(),
            timestamp=self.benchmark_count,
        )

        self.benchmarks[benchmark_id] = result

        if sender in self.user_benchmarks:
            existing = self.user_benchmarks[sender]
            existing.append(benchmark_id)
            self.user_benchmarks[sender] = existing
        else:
            self.user_benchmarks[sender] = [benchmark_id]

        self._create_activity(benchmark_id, sender, "BENCHMARK_CREATED", f"Benchmarked {review.vendor_name} against {framework_type}")

    @gl.public.write
    def generate_due_diligence_report(self):
        sender = self._normalize_address(str(gl.message.sender_address))
        if sender not in self.user_reviews or len(self.user_reviews[sender]) == 0:
            raise Exception("No vendor reviews found for this wallet")

        total_trust = 0
        escalated_count = 0
        conditional_count = 0
        actions = []
        collected_reviews = []

        for review_id in self.user_reviews[sender]:
            if review_id in self.reviews:
                review = self.reviews[review_id]
                collected_reviews.append(review)
                total_trust = total_trust + int(review.trust_score)
                if str(review.decision).lower() == "escalate":
                    escalated_count = escalated_count + 1
                if str(review.decision).lower() == "conditional":
                    conditional_count = conditional_count + 1
                actions.extend(review.follow_up_questions[:2])

        average_trust = total_trust / len(collected_reviews) if len(collected_reviews) > 0 else 0

        if escalated_count > 0:
            posture = "Escalated"
        elif conditional_count > 1:
            posture = "Guarded"
        else:
            posture = "Operational"

        self.report_count = u64(int(self.report_count) + 1)
        report_id = f"report_{self.report_count}"

        result = DueDiligenceReport(
            report_id=report_id,
            workspace_owner=sender,
            author=sender,
            total_vendors=u64(len(collected_reviews)),
            average_trust_score=u64(int(average_trust)),
            escalated_count=u64(escalated_count),
            conditional_count=u64(conditional_count),
            portfolio_posture=posture,
            key_actions=[str(item) for item in actions[:6]],
            generated_at=self.report_count,
        )

        self.reports[report_id] = result
        self._create_activity(report_id, sender, "REPORT_CREATED", "Generated due diligence report")

    def _create_activity(self, resource_id: str, author: str, action: str, details: str):
        self.activity_count = u64(int(self.activity_count) + 1)
        entry_id = f"activity_{self.activity_count}"

        entry = ActivityEntry(
            entry_id=entry_id,
            resource_id=resource_id,
            author=author,
            action=action,
            timestamp=self.activity_count,
            details=details,
        )

        self.activity_log[entry_id] = entry

        if author in self.user_activity:
            existing = self.user_activity[author]
            existing.append(entry_id)
            self.user_activity[author] = existing
        else:
            self.user_activity[author] = [entry_id]

    @gl.public.view
    def get_review(self, review_id: str) -> VendorReview:
        if review_id not in self.reviews:
            raise Exception("Vendor review not found")
        return self.reviews[review_id]

    @gl.public.view
    def get_user_reviews(self, user_address: str) -> DynArray[VendorReview]:
        addr = self._normalize_address(user_address)
        if addr not in self.user_reviews:
            return []
        result = []
        for review_id in self.user_reviews[addr]:
            if review_id in self.reviews:
                result.append(self.reviews[review_id])
        return result

    @gl.public.view
    def get_comparison(self, comparison_id: str) -> VendorComparison:
        if comparison_id not in self.comparisons:
            raise Exception("Vendor comparison not found")
        return self.comparisons[comparison_id]

    @gl.public.view
    def get_user_comparisons(self, user_address: str) -> DynArray[VendorComparison]:
        addr = self._normalize_address(user_address)
        if addr not in self.user_comparisons:
            return []
        result = []
        for comparison_id in self.user_comparisons[addr]:
            if comparison_id in self.comparisons:
                result.append(self.comparisons[comparison_id])
        return result

    @gl.public.view
    def get_benchmark(self, benchmark_id: str) -> FrameworkBenchmark:
        if benchmark_id not in self.benchmarks:
            raise Exception("Framework benchmark not found")
        return self.benchmarks[benchmark_id]

    @gl.public.view
    def get_user_benchmarks(self, user_address: str) -> DynArray[FrameworkBenchmark]:
        addr = self._normalize_address(user_address)
        if addr not in self.user_benchmarks:
            return []
        result = []
        for benchmark_id in self.user_benchmarks[addr]:
            if benchmark_id in self.benchmarks:
                result.append(self.benchmarks[benchmark_id])
        return result

    @gl.public.view
    def get_report(self, report_id: str) -> DueDiligenceReport:
        if report_id not in self.reports:
            raise Exception("Due diligence report not found")
        return self.reports[report_id]

    @gl.public.view
    def get_user_activity(self, user_address: str) -> DynArray[ActivityEntry]:
        addr = self._normalize_address(user_address)
        if addr not in self.user_activity:
            return []
        result = []
        for entry_id in self.user_activity[addr]:
            if entry_id in self.activity_log:
                result.append(self.activity_log[entry_id])
        return result
