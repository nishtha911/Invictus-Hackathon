"""
Pod 1 — Adaptive question flow (v3), built from
Dynamic_Loan_Questioning_Architecture.docx (Sections 4-9, 11, 14)
-------------------------------------------------------------------
Same generic-node pattern as v2, but the QUESTION_BANK now implements
the doc's actual design:

  - 6 loan families (personal, vehicle, home, education, business,
    debt_consolidation) — Section 14 MVP scope.
  - Each question has an `applies_to(state)` filter instead of a
    single hardcoded `next()` — this matches Section 8's "candidate
    filters" approach: at every turn, the engine looks at ALL
    questions, keeps the ones that are relevant + unanswered, and
    asks the highest-priority one. This is what makes branches like
    "skip every business question for a vehicle-loan customer"
    happen automatically instead of via one big if/elif chain.
  - `priority` is a simplified stand-in for Section 8's
    QuestionScore formula. Full weighted scoring (decision impact x
    uncertainty reduction x ...) is explicitly a post-MVP item per
    Section 14 ("Rule-based first; add learned ranking after
    sufficient telemetry") — so a fixed priority order is the
    correct amount of engineering for this stage, not a shortcut.
  - completeness_pct is now DYNAMIC (Section 7.1): it's answered
    fields divided by (answered + still-relevant-remaining), so a
    personal loan customer can hit 100% after 6 questions while a
    home-loan customer needs 9-10.

Run it:
    python3 chat_flow_adaptive.py
"""

from typing import TypedDict, Optional, Callable
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver


# 1. STATE — field names match Section 7's data model (loan_family,
#    requested_amount, monthly_income, etc.) so Pod 2 can consume this
#    directly without translation.
class ProfileState(TypedDict):
    loan_family: Optional[str]
    loan_subpurpose: Optional[str]
    requested_amount: Optional[float]
    asset_value: Optional[float]
    own_contribution: Optional[float]
    income_type: Optional[str]
    monthly_income: Optional[float]
    existing_debt: Optional[str]          # "YES" / "NO"
    monthly_existing_debt: Optional[float]
    business_vintage: Optional[str]       # "NEW" / "EXISTING"
    business_cash_flow: Optional[float]
    primary_preference: Optional[str]
    preferred_tenure_band: Optional[str]
    urgency: Optional[str]
    current_question: Optional[str]
    completeness_pct: int


# 2. EXTRACTION FUNCTIONS — placeholders (keyword/number parsing).
#    TODO before demo: swap the classification ones (intent, income
#    type, preference) for a Groq call; leave the numeric ones as
#    regex, there's no ambiguity in "how much do you need?" worth an
#    LLM call.
def extract_intent(reply: str) -> str:
    reply = reply.lower()
    if "home" in reply:
        return "home"
    if "vehicle" in reply or "car" in reply:
        return "vehicle"
    if "educat" in reply or "study" in reply:
        return "education"
    if "business" in reply:
        return "business"
    if "consolidat" in reply or "debt" in reply:
        return "debt_consolidation"
    return "personal"


def extract_number(reply: str) -> float:
    digits = "".join(c for c in reply if c.isdigit())
    return float(digits) if digits else 0.0


def extract_yes_no(reply: str) -> str:
    return "YES" if reply.strip().lower().startswith("y") else "NO"


def extract_new_or_existing(reply: str) -> str:
    return "EXISTING" if "exist" in reply.lower() else "NEW"


def extract_text(reply: str) -> str:
    return reply.strip().lower()


# 3. QUESTION BANK — Section 6's "reusable component with
#    applicability and branch rules," implemented as filters.
#    Lower `priority` = asked sooner among currently-applicable
#    questions (mirrors Section 8.2's routing table ordering).
QUESTION_BANK: list[dict] = [
    {
        "id": "INT-01",
        "field": "loan_family",
        "prompt": "What are you borrowing for? (home/vehicle/education/business/debt consolidation/personal) > ",
        "extract": extract_intent,
        "applies_to": lambda s: True,               # always relevant until known
        "priority": 0,
    },
    # --- Branch subpurpose / asset questions (Section 5) ---
    {
        "id": "AST-01",
        "field": "asset_value",
        "prompt": "What is the approximate property/vehicle value (INR)? > ",
        "extract": extract_number,
        "applies_to": lambda s: s["loan_family"] in ("home", "vehicle"),
        "priority": 1,
    },
    {
        "id": "LTV-01",
        "field": "own_contribution",
        "prompt": "How much are you comfortable contributing yourself (down payment, INR)? > ",
        "extract": extract_number,
        "applies_to": lambda s: s["loan_family"] in ("home", "vehicle") and s["asset_value"] is not None,
        "priority": 2,
    },
    {
        "id": "AMT-01",
        "field": "requested_amount",
        "prompt": "Approximately how much funding do you need (INR)? > ",
        "extract": extract_number,
        # general-purpose loans skip AST-01/LTV-01 entirely (Section 6: "Skip when: Not asset-backed")
        "applies_to": lambda s: s["loan_family"] in ("personal", "education", "business", "debt_consolidation"),
        "priority": 1,
    },
    {
        "id": "BUS-VINTAGE",
        "field": "business_vintage",
        "prompt": "Is this for a new business or an existing one? > ",
        "extract": extract_new_or_existing,
        "applies_to": lambda s: s["loan_family"] == "business",
        "priority": 2,
    },
    {
        "id": "BUS-02",
        "field": "business_cash_flow",
        "prompt": "What is the approximate monthly business cash flow (INR)? > ",
        "extract": extract_number,
        "applies_to": lambda s: s["loan_family"] == "business" and s["business_vintage"] == "EXISTING",
        "priority": 3,
    },
    # --- Core affordability questions (Section 4, Q3-Q5) ---
    {
        "id": "INC-01",
        "field": "income_type",
        "prompt": "What is your primary source of income? (salaried/self-employed/business owner/freelancer/retired) > ",
        "extract": extract_text,
        "applies_to": lambda s: True,
        "priority": 4,
    },
    {
        "id": "INC-02",
        "field": "monthly_income",
        "prompt": "Approximately how much reliable income do you receive each month (INR)? > ",
        "extract": extract_number,
        "applies_to": lambda s: s["income_type"] is not None,
        "priority": 5,
    },
    {
        "id": "DEBT-01",
        "field": "existing_debt",
        "prompt": "Do you currently have any loans, EMIs, or significant credit-card repayments? (yes/no) > ",
        "extract": extract_yes_no,
        "applies_to": lambda s: s["monthly_income"] is not None,
        "priority": 6,
    },
    {
        "id": "DEBT-02",
        "field": "monthly_existing_debt",
        "prompt": "Approximately what is your total monthly debt payment (INR)? > ",
        "extract": extract_number,
        # Section 6: DEBT-02 "Ask when: DEBT-01 = Yes" — this is the
        # yes/no-driven branch you asked about.
        "applies_to": lambda s: s["existing_debt"] == "YES",
        "priority": 7,
    },
    # --- Preference / urgency / tenure (Section 4, Q7-Q9) ---
    {
        "id": "PREF-01",
        "field": "primary_preference",
        "prompt": "What matters most to you? (lowest EMI/lowest total interest/fastest approval/flexible repayment) > ",
        "extract": extract_text,
        "applies_to": lambda s: True,
        "priority": 8,
    },
    {
        "id": "TEN-01",
        "field": "preferred_tenure_band",
        "prompt": "How long would you ideally like to take to repay? (<2yr/2-5yr/5-10yr/10-20yr) > ",
        "extract": extract_text,
        # doesn't apply to short-horizon products; keep simple for MVP
        "applies_to": lambda s: s["loan_family"] != "personal" and s["primary_preference"] is not None,
        "priority": 9,
    },
    {
        "id": "URG-01",
        "field": "urgency",
        "prompt": "How quickly do you need the funds? (today/within a week/within a month/1-3 months/just exploring) > ",
        "extract": extract_text,
        "applies_to": lambda s: s["primary_preference"] is not None,
        "priority": 10,
    },
]

COMPLETENESS_GATE = 80  # matches the Section 3.1 Extracted Profile contract's threshold


# 4. THE GENERIC NODE — Section 11's pseudocode, translated directly:
#    filter candidates -> pick highest-priority -> ask -> update ->
#    recompute completeness.
def get_candidates(state: ProfileState) -> list[dict]:
    return [
        q for q in QUESTION_BANK
        if state.get(q["field"]) is None and q["applies_to"](state)
    ]


def node_ask_adaptive(state: ProfileState) -> ProfileState:
    candidates = get_candidates(state)
    next_q = min(candidates, key=lambda q: q["priority"])

    reply = input(f"Bot [{next_q['id']}]: {next_q['prompt']}")
    state[next_q["field"]] = next_q["extract"](reply)

    answered = sum(1 for q in QUESTION_BANK if state.get(q["field"]) is not None)
    remaining = len(get_candidates(state))
    total_relevant = answered + remaining
    state["completeness_pct"] = 100 if total_relevant == 0 else int(100 * answered / total_relevant)

    return state


# 5. ROUTER — stopping condition (Section 9): stop when no relevant
#    question remains OR the completeness gate is met, whichever
#    first. This is the "minimum-question strategy," not "ask until
#    the whole bank is exhausted."
def router(state: ProfileState) -> str:
    if state["completeness_pct"] >= COMPLETENESS_GATE or not get_candidates(state):
        return END
    return "ask_adaptive"


graph = StateGraph(ProfileState)
graph.add_node("ask_adaptive", node_ask_adaptive)
graph.set_entry_point("ask_adaptive")
graph.add_conditional_edges("ask_adaptive", router)

app = graph.compile(checkpointer=MemorySaver())


if __name__ == "__main__":
    config = {"configurable": {"thread_id": "demo-session-1"}}
    initial_state: ProfileState = {
        "loan_family": None, "loan_subpurpose": None, "requested_amount": None,
        "asset_value": None, "own_contribution": None, "income_type": None,
        "monthly_income": None, "existing_debt": None, "monthly_existing_debt": None,
        "business_vintage": None, "business_cash_flow": None,
        "primary_preference": None, "preferred_tenure_band": None, "urgency": None,
        "current_question": None, "completeness_pct": 0,
    }
    result = app.invoke(initial_state, config=config)

    print("\n--- Final extracted profile ---")
    print(result)