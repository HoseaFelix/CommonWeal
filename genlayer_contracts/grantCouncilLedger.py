# { "Depends": "py-genlayer:test" }
from genlayer import *
from dataclasses import dataclass


@allow_storage
@dataclass
class RiskFlag:
    area: str
    severity: str
    rationale: str


@allow_storage
@dataclass
class GrantApplication:
    application_id: str
    applicant_name: str
    project_title: str
    funding_request: str
    application_materials: str
    author: str
    viability_score: u64
    recommendation: str
    thesis: str
    risk_flags: DynArray[RiskFlag]
    strengths: DynArray[str]
    diligence_questions: DynArray[str]
    milestone_conditions: DynArray[str]
    timestamp: u64


@allow_storage
@dataclass
class ApplicantComparison:
    comparison_id: str
    application_a_id: str
    application_b_id: str
    author: str
    separation_score: u64
    unique_advantages: DynArray[str]
    overlapping_risks: DynArray[str]
    allocation_recommendation: str
    rationale: str
    timestamp: u64


@allow_storage
@dataclass
class FundingBenchmark:
    benchmark_id: str
    application_id: str
    author: str
    rubric_type: str
    alignment_score: u64
    uncovered_gaps: DynArray[str]
    evidence_signals: DynArray[str]
    diligence_priority: str
    release_posture: str
    timestamp: u64


@allow_storage
@dataclass
class LedgerEntry:
    entry_id: str
    resource_id: str
    author: str
    action: str
    timestamp: u64
    details: str


@allow_storage
@dataclass
class FundingMemo:
    memo_id: str
    workspace_owner: str
    author: str
    total_applications: u64
    average_viability_score: u64
    decline_count: u64
    conditional_count: u64
    portfolio_signal: str
    key_actions: DynArray[str]
    generated_at: u64


class GrantCouncilLedger(gl.Contract):
    applications: TreeMap[str, GrantApplication]
    comparisons: TreeMap[str, ApplicantComparison]
    benchmarks: TreeMap[str, FundingBenchmark]
    ledger_entries: TreeMap[str, LedgerEntry]
    memos: TreeMap[str, FundingMemo]

    user_applications: TreeMap[str, DynArray[str]]
    user_comparisons: TreeMap[str, DynArray[str]]
    user_benchmarks: TreeMap[str, DynArray[str]]
    user_ledger_entries: TreeMap[str, DynArray[str]]

    application_count: u64
    comparison_count: u64
    benchmark_count: u64
    ledger_count: u64
    memo_count: u64

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

    def _normalize_recommendation(self, value: str) -> str:
        lowered = str(value).strip().lower()
        if lowered == "fund":
            return "Fund"
        if lowered == "conditional":
            return "Conditional"
        return "Decline"

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

    def _normalize_release_posture(self, value: str) -> str:
        lowered = str(value).strip().lower()
        if lowered == "ready":
            return "Ready"
        if lowered == "conditional":
            return "Conditional"
        return "Hold"

    @gl.public.write
    def review_application(self, applicant_name: str, project_title: str, funding_request: str, application_materials: str):
        if len(applicant_name.strip()) == 0:
            raise Exception("Applicant name cannot be empty")
        if len(project_title.strip()) == 0:
            raise Exception("Project title cannot be empty")
        if len(application_materials.strip()) == 0:
            raise Exception("Application materials cannot be empty")

        normalized_applicant_name = applicant_name.strip()
        normalized_project_title = project_title.strip()
        normalized_funding_request = funding_request.strip() if len(funding_request.strip()) > 0 else "Funding amount not specified"
        normalized_materials = application_materials.strip()

        prompt = f"""
You are a grant allocation analyst reviewing a funding application.

Review the application package and return ONLY valid JSON:
{{
  "viability_score": 0,
  "recommendation": "Fund",
  "thesis": "concise investment thesis",
  "risk_flags": [
    {{"area": "execution", "severity": "High", "rationale": "why the risk matters"}}
  ],
  "strengths": ["strength 1", "strength 2"],
  "diligence_questions": ["question 1", "question 2"],
  "milestone_conditions": ["condition 1", "condition 2"]
}}

Recommendation must be one of: Fund, Conditional, Decline.

Applicant name: {normalized_applicant_name}
Project title: {normalized_project_title}
Funding request: {normalized_funding_request}
Application materials:
{normalized_materials}
"""

        def leader_fn():
            data = gl.nondet.exec_prompt(prompt, response_format="json")
            flags = []
            if isinstance(data.get("risk_flags", []), list):
                for item in data.get("risk_flags", []):
                    if isinstance(item, dict):
                        flags.append(
                            {
                                "area": str(item.get("area", "")).strip(),
                                "severity": self._normalize_severity(str(item.get("severity", "Medium"))),
                                "rationale": str(item.get("rationale", "")).strip(),
                            }
                        )

            return {
                "viability_score": self._normalize_score(data.get("viability_score", 0)),
                "recommendation": self._normalize_recommendation(str(data.get("recommendation", "Decline"))),
                "thesis": str(data.get("thesis", "")).strip(),
                "risk_flags": flags,
                "strengths": self._normalize_string_list(data.get("strengths", [])),
                "diligence_questions": self._normalize_string_list(data.get("diligence_questions", [])),
                "milestone_conditions": self._normalize_string_list(data.get("milestone_conditions", [])),
            }

        def validator_fn(res: gl.vm.Result) -> bool:
            if not isinstance(res, gl.vm.Return):
                return False
            data = res.calldata
            if not isinstance(data, dict):
                return False
            required = ["viability_score", "recommendation", "thesis", "risk_flags", "strengths", "diligence_questions", "milestone_conditions"]
            if not all(key in data for key in required):
                return False
            try:
                score = int(float(data["viability_score"]))
                if score < 0 or score > 100:
                    return False
            except:
                return False
            if str(data["recommendation"]).lower() not in ["fund", "conditional", "decline"]:
                return False
            if not isinstance(data["risk_flags"], list):
                return False
            return True

        application_result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        self.application_count = u64(int(self.application_count) + 1)
        application_id = f"application_{self.application_count}"
        sender = self._normalize_address(str(gl.message.sender_address))

        stored_flags: list[RiskFlag] = []
        for item in application_result.get("risk_flags", []):
            stored_flags.append(
                RiskFlag(
                    area=str(item.get("area", "")).strip(),
                    severity=str(item.get("severity", "Medium")).strip(),
                    rationale=str(item.get("rationale", "")).strip(),
                )
            )

        result = GrantApplication(
            application_id=application_id,
            applicant_name=normalized_applicant_name,
            project_title=normalized_project_title,
            funding_request=normalized_funding_request,
            application_materials=normalized_materials,
            author=sender,
            viability_score=u64(int(application_result.get("viability_score", 0))),
            recommendation=str(application_result.get("recommendation", "Decline")).strip(),
            thesis=str(application_result.get("thesis", "")).strip(),
            risk_flags=stored_flags,
            strengths=[str(item) for item in application_result.get("strengths", [])],
            diligence_questions=[str(item) for item in application_result.get("diligence_questions", [])],
            milestone_conditions=[str(item) for item in application_result.get("milestone_conditions", [])],
            timestamp=self.application_count,
        )

        self.applications[application_id] = result

        if sender in self.user_applications:
            existing = self.user_applications[sender]
            existing.append(application_id)
            self.user_applications[sender] = existing
        else:
            self.user_applications[sender] = [application_id]

        self._create_ledger_entry(application_id, sender, "APPLICATION_REVIEWED", f"Reviewed application: {normalized_project_title}")

    @gl.public.write
    def compare_applications(self, application_a_id: str, application_b_id: str):
        if application_a_id not in self.applications or application_b_id not in self.applications:
            raise Exception("One or both applications were not found")

        application_a = self.applications[application_a_id]
        application_b = self.applications[application_b_id]

        prompt = f"""
You are a funding committee chair comparing two grant applicants.

Applicant A: {application_a.applicant_name}
Project A: {application_a.project_title}
Recommendation A: {application_a.recommendation}
Thesis A: {application_a.thesis}
Milestones A: {', '.join(application_a.milestone_conditions)}

Applicant B: {application_b.applicant_name}
Project B: {application_b.project_title}
Recommendation B: {application_b.recommendation}
Thesis B: {application_b.thesis}
Milestones B: {', '.join(application_b.milestone_conditions)}

Return ONLY valid JSON:
{{
  "separation_score": 0,
  "unique_advantages": ["advantage 1"],
  "overlapping_risks": ["risk 1"],
  "allocation_recommendation": "which application is more allocation-ready",
  "rationale": "why the recommendation makes sense"
}}
"""

        def leader_fn():
            data = gl.nondet.exec_prompt(prompt, response_format="json")
            return {
                "separation_score": self._normalize_score(data.get("separation_score", 0)),
                "unique_advantages": self._normalize_string_list(data.get("unique_advantages", [])),
                "overlapping_risks": self._normalize_string_list(data.get("overlapping_risks", [])),
                "allocation_recommendation": str(data.get("allocation_recommendation", "")).strip(),
                "rationale": str(data.get("rationale", "")).strip(),
            }

        def validator_fn(res: gl.vm.Result) -> bool:
            if not isinstance(res, gl.vm.Return):
                return False
            data = res.calldata
            if not isinstance(data, dict):
                return False
            required = ["separation_score", "unique_advantages", "overlapping_risks", "allocation_recommendation", "rationale"]
            if not all(key in data for key in required):
                return False
            try:
                score = int(float(data["separation_score"]))
                if score < 0 or score > 100:
                    return False
            except:
                return False
            return True

        comparison_result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        self.comparison_count = u64(int(self.comparison_count) + 1)
        comparison_id = f"comparison_{self.comparison_count}"
        sender = self._normalize_address(str(gl.message.sender_address))

        result = ApplicantComparison(
            comparison_id=comparison_id,
            application_a_id=application_a_id,
            application_b_id=application_b_id,
            author=sender,
            separation_score=u64(int(comparison_result.get("separation_score", 0))),
            unique_advantages=[str(item) for item in comparison_result.get("unique_advantages", [])],
            overlapping_risks=[str(item) for item in comparison_result.get("overlapping_risks", [])],
            allocation_recommendation=str(comparison_result.get("allocation_recommendation", "")).strip(),
            rationale=str(comparison_result.get("rationale", "")).strip(),
            timestamp=self.comparison_count,
        )

        self.comparisons[comparison_id] = result

        if sender in self.user_comparisons:
            existing = self.user_comparisons[sender]
            existing.append(comparison_id)
            self.user_comparisons[sender] = existing
        else:
            self.user_comparisons[sender] = [comparison_id]

        self._create_ledger_entry(comparison_id, sender, "APPLICATIONS_COMPARED", f"Compared {application_a.project_title} against {application_b.project_title}")

    @gl.public.write
    def benchmark_application(self, application_id: str, rubric_type: str):
        if application_id not in self.applications:
            raise Exception("Application not found")

        application = self.applications[application_id]
        rubric_context = {
            "IMPACT": "Public impact expectations: measurable outcomes, beneficiary clarity, durable value creation",
            "FEASIBILITY": "Feasibility expectations: execution plan, delivery realism, team capacity, operational timing",
            "TRANSPARENCY": "Transparency expectations: budget traceability, governance clarity, milestone reporting, accountability",
            "EQUITY": "Equity expectations: access, inclusion, community representation, fair distribution of benefits",
        }
        context = rubric_context.get(rubric_type, rubric_type)

        prompt = f"""
You are a grant committee rubric assessor.

Applicant: {application.applicant_name}
Project: {application.project_title}
Recommendation: {application.recommendation}
Thesis: {application.thesis}
Diligence questions: {', '.join(application.diligence_questions)}

Rubric context: {context}

Return ONLY valid JSON:
{{
  "alignment_score": 0,
  "uncovered_gaps": ["gap 1"],
  "evidence_signals": ["signal 1"],
  "diligence_priority": "High",
  "release_posture": "Conditional"
}}
"""

        def leader_fn():
            data = gl.nondet.exec_prompt(prompt, response_format="json")
            return {
                "alignment_score": self._normalize_score(data.get("alignment_score", 0)),
                "uncovered_gaps": self._normalize_string_list(data.get("uncovered_gaps", [])),
                "evidence_signals": self._normalize_string_list(data.get("evidence_signals", [])),
                "diligence_priority": self._normalize_priority(str(data.get("diligence_priority", "Medium"))),
                "release_posture": self._normalize_release_posture(str(data.get("release_posture", "Conditional"))),
            }

        def validator_fn(res: gl.vm.Result) -> bool:
            if not isinstance(res, gl.vm.Return):
                return False
            data = res.calldata
            if not isinstance(data, dict):
                return False
            required = ["alignment_score", "uncovered_gaps", "evidence_signals", "diligence_priority", "release_posture"]
            if not all(key in data for key in required):
                return False
            try:
                score = int(float(data["alignment_score"]))
                if score < 0 or score > 100:
                    return False
            except:
                return False
            return True

        benchmark_result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        self.benchmark_count = u64(int(self.benchmark_count) + 1)
        benchmark_id = f"benchmark_{self.benchmark_count}"
        sender = self._normalize_address(str(gl.message.sender_address))

        result = FundingBenchmark(
            benchmark_id=benchmark_id,
            application_id=application_id,
            author=sender,
            rubric_type=rubric_type,
            alignment_score=u64(int(benchmark_result.get("alignment_score", 0))),
            uncovered_gaps=[str(item) for item in benchmark_result.get("uncovered_gaps", [])],
            evidence_signals=[str(item) for item in benchmark_result.get("evidence_signals", [])],
            diligence_priority=str(benchmark_result.get("diligence_priority", "Medium")).strip(),
            release_posture=str(benchmark_result.get("release_posture", "Conditional")).strip(),
            timestamp=self.benchmark_count,
        )

        self.benchmarks[benchmark_id] = result

        if sender in self.user_benchmarks:
            existing = self.user_benchmarks[sender]
            existing.append(benchmark_id)
            self.user_benchmarks[sender] = existing
        else:
            self.user_benchmarks[sender] = [benchmark_id]

        self._create_ledger_entry(benchmark_id, sender, "RUBRIC_BENCHMARKED", f"Benchmarked {application.project_title} against {rubric_type}")

    @gl.public.write
    def generate_funding_memo(self):
        sender = self._normalize_address(str(gl.message.sender_address))
        if sender not in self.user_applications or len(self.user_applications[sender]) == 0:
            raise Exception("No applications found for this wallet")

        total_viability = 0
        decline_count = 0
        conditional_count = 0
        actions = []
        collected_applications = []

        for application_id in self.user_applications[sender]:
            if application_id in self.applications:
                application = self.applications[application_id]
                collected_applications.append(application)
                total_viability = total_viability + int(application.viability_score)
                if str(application.recommendation).lower() == "decline":
                    decline_count = decline_count + 1
                if str(application.recommendation).lower() == "conditional":
                    conditional_count = conditional_count + 1
                actions.extend(application.diligence_questions[:2])

        average_viability = total_viability / len(collected_applications) if len(collected_applications) > 0 else 0

        if decline_count > 0:
            signal = "Selective"
        elif conditional_count > 1:
            signal = "Guarded"
        else:
            signal = "Deployment Ready"

        self.memo_count = u64(int(self.memo_count) + 1)
        memo_id = f"memo_{self.memo_count}"

        result = FundingMemo(
            memo_id=memo_id,
            workspace_owner=sender,
            author=sender,
            total_applications=u64(len(collected_applications)),
            average_viability_score=u64(int(average_viability)),
            decline_count=u64(decline_count),
            conditional_count=u64(conditional_count),
            portfolio_signal=signal,
            key_actions=[str(item) for item in actions[:6]],
            generated_at=self.memo_count,
        )

        self.memos[memo_id] = result
        self._create_ledger_entry(memo_id, sender, "FUNDING_MEMO_CREATED", "Generated funding memo")

    def _create_ledger_entry(self, resource_id: str, author: str, action: str, details: str):
        self.ledger_count = u64(int(self.ledger_count) + 1)
        entry_id = f"ledger_{self.ledger_count}"

        entry = LedgerEntry(
            entry_id=entry_id,
            resource_id=resource_id,
            author=author,
            action=action,
            timestamp=self.ledger_count,
            details=details,
        )

        self.ledger_entries[entry_id] = entry

        if author in self.user_ledger_entries:
            existing = self.user_ledger_entries[author]
            existing.append(entry_id)
            self.user_ledger_entries[author] = existing
        else:
            self.user_ledger_entries[author] = [entry_id]

    @gl.public.view
    def get_application(self, application_id: str) -> GrantApplication:
        if application_id not in self.applications:
            raise Exception("Application not found")
        return self.applications[application_id]

    @gl.public.view
    def get_user_applications(self, user_address: str) -> DynArray[GrantApplication]:
        addr = self._normalize_address(user_address)
        if addr not in self.user_applications:
            return []
        result = []
        for application_id in self.user_applications[addr]:
            if application_id in self.applications:
                result.append(self.applications[application_id])
        return result

    @gl.public.view
    def get_comparison(self, comparison_id: str) -> ApplicantComparison:
        if comparison_id not in self.comparisons:
            raise Exception("Comparison not found")
        return self.comparisons[comparison_id]

    @gl.public.view
    def get_user_comparisons(self, user_address: str) -> DynArray[ApplicantComparison]:
        addr = self._normalize_address(user_address)
        if addr not in self.user_comparisons:
            return []
        result = []
        for comparison_id in self.user_comparisons[addr]:
            if comparison_id in self.comparisons:
                result.append(self.comparisons[comparison_id])
        return result

    @gl.public.view
    def get_benchmark(self, benchmark_id: str) -> FundingBenchmark:
        if benchmark_id not in self.benchmarks:
            raise Exception("Benchmark not found")
        return self.benchmarks[benchmark_id]

    @gl.public.view
    def get_user_benchmarks(self, user_address: str) -> DynArray[FundingBenchmark]:
        addr = self._normalize_address(user_address)
        if addr not in self.user_benchmarks:
            return []
        result = []
        for benchmark_id in self.user_benchmarks[addr]:
            if benchmark_id in self.benchmarks:
                result.append(self.benchmarks[benchmark_id])
        return result

    @gl.public.view
    def get_memo(self, memo_id: str) -> FundingMemo:
        if memo_id not in self.memos:
            raise Exception("Memo not found")
        return self.memos[memo_id]

    @gl.public.view
    def get_user_ledger_entries(self, user_address: str) -> DynArray[LedgerEntry]:
        addr = self._normalize_address(user_address)
        if addr not in self.user_ledger_entries:
            return []
        result = []
        for entry_id in self.user_ledger_entries[addr]:
            if entry_id in self.ledger_entries:
                result.append(self.ledger_entries[entry_id])
        return result
