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


class PolicyRiskAnalyzer(gl.Contract):
    analyses: TreeMap[str, PolicyAnalysis]
    user_analyses: TreeMap[str, DynArray[str]]
    analysis_count: u64

    def __init__(self):
        pass  # GenLayer auto-initializes storage

    def _normalize_address(self, address: str) -> str:
        addr = address.lower()
        if not addr.startswith("0x"):
            addr = "0x" + addr
        return addr

    @gl.public.write
    def analyze_policy(self, policy_text: str):
        if not policy_text or len(policy_text.strip()) == 0:
            raise Exception("Policy text cannot be empty")

        prompt = f"""
You are a policy risk analyst.

Return ONLY valid JSON in this exact format:
{{
  "risk_score": 0,
  "risk_level": "Low",
  "summary": "...",
  "risky_clauses": [
    {{"clause": "...", "risk": "Medium", "reason": "..."}}
  ],
  "plain_english": [],
  "compliance_flags": [],
  "recommendations": []
}}

Analyze this policy:

"{policy_text}"
"""

        def leader_fn():
            response = gl.nondet.exec_prompt(prompt)
            cleaned = response.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned)

        def validator_fn(res: gl.vm.Result) -> bool:  # type: ignore
            if not isinstance(res, gl.vm.Return):
                return False

            data = res.calldata
            if not isinstance(data, dict):
                return False

            # Required fields
            if "risk_score" not in data or "risk_level" not in data:
                return False

            # Risk score validation
            try:
                score = int(float(data["risk_score"]))
                if score < 0 or score > 100:
                    return False
            except:
                return False

            # Risk level validation
            if str(data["risk_level"]).lower() not in ["low", "medium", "high", "critical"]:
                return False

            # Risky clauses validation
            if "risky_clauses" in data:
                if not isinstance(data["risky_clauses"], list):
                    return False
                for item in data["risky_clauses"]:
                    if not isinstance(item, dict):
                        return False
                    if not all(k in item for k in ["clause", "risk", "reason"]):
                        return False

            return True

        analysis = gl.vm.run_nondet(leader_fn, validator_fn)

        # --- Extract & sanitize values ---

        risk_score_value = u64(int(float(analysis.get("risk_score", 0))))
        risk_level_value = str(analysis.get("risk_level", "Low")).strip()
        summary_value = str(analysis.get("summary", "")).strip()

        # Convert risky clauses into proper dataclass objects
        risky_clauses_value: list[RiskyClause] = []
        for item in analysis.get("risky_clauses", []):
            risky_clauses_value.append(
                RiskyClause(
                    clause=str(item.get("clause", "")).strip(),
                    risk=str(item.get("risk", "Medium")).strip(),
                    reason=str(item.get("reason", "")).strip(),
                )
            )

        plain_english_value = [str(x) for x in analysis.get("plain_english", [])]
        compliance_flags_value = [str(x) for x in analysis.get("compliance_flags", [])]
        recommendations_value = [str(x) for x in analysis.get("recommendations", [])]

        # --- Storage ---

        self.analysis_count = u64(int(self.analysis_count) + 1)
        analysis_id = f"analysis_{self.analysis_count}"

        sender = self._normalize_address(str(gl.message.sender_address))

        result = PolicyAnalysis(
            analysis_id=analysis_id,
            policy_text=policy_text.strip(),
            author=sender,
            risk_score=risk_score_value,
            risk_level=risk_level_value,
            summary=summary_value,
            risky_clauses=risky_clauses_value,
            plain_english=plain_english_value,
            compliance_flags=compliance_flags_value,
            recommendations=recommendations_value,
            timestamp=self.analysis_count,
        )

        self.analyses[analysis_id] = result

        if sender in self.user_analyses:
            arr = self.user_analyses[sender]
            arr.append(analysis_id)
            self.user_analyses[sender] = arr
        else:
            self.user_analyses[sender] = [analysis_id]

    @gl.public.view
    def get_analysis(self, analysis_id: str) -> PolicyAnalysis:
        if analysis_id not in self.analyses:
            raise Exception("Analysis not found")
        return self.analyses[analysis_id]

    @gl.public.view
    def get_user_analyses(self, user_address: str) -> DynArray[PolicyAnalysis]:
        addr = self._normalize_address(user_address)
        if addr not in self.user_analyses:
            return []  # type: ignore

        result = []
        for analysis_id in self.user_analyses[addr]:
            if analysis_id in self.analyses:
                result.append(self.analyses[analysis_id])
        return result  # type: ignore

    @gl.public.view
    def get_analysis_count(self) -> int:
        return int(self.analysis_count)

    @gl.public.view
    def get_latest_analysis_id(self) -> str:
        if self.analysis_count == u64(0):
            return ""
        return f"analysis_{self.analysis_count}"