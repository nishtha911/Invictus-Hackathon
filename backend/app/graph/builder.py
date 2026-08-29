"""
LangGraph graph construction.

This module builds the advisory conversation graph by:
1. Registering all nodes (from nodes.py)
2. Wiring conditional edges (using router.py)
3. Compiling the graph into a runnable
"""

from __future__ import annotations

import logging

from langgraph.graph import StateGraph, END
from langgraph.graph import StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.graph.state import AdvisoryState
from app.graph.nodes import (
    greeting_node,
    extract_name_node,
    extract_loan_type_node,
    extract_loan_type_details_node,
    extract_loan_amount_node,
    extract_income_employment_node,
    extract_existing_debts_node,
    extract_credit_score_node,
    extract_age_node,
    extract_tenure_node,
    extract_co_applicant_node,
    extract_preferred_emi_node,
    extract_interest_type_node,
    extract_urgency_node,
    completion_node,
)
from app.graph.router import (
    route_after_greeting,
    route_after_name,
    route_after_loan_type,
    route_after_loan_type_details,
    route_after_loan_amount,
    route_after_income_employment,
    route_after_existing_debts,
    route_after_credit_score,
    route_after_age,
    route_after_tenure,
    route_after_co_applicant,
    route_after_preferred_emi,
    route_after_interest_type,
    route_after_urgency,
)

logger = logging.getLogger(__name__)

def build_advisory_graph() -> CompiledGraph:
    """
    Build and compile the full advisory conversation graph.
    """
    graph = StateGraph(AdvisoryState)

    # ── Register all nodes ─────────────────────────────────────────────
    graph.add_node("greeting", greeting_node)
    graph.add_node("extract_name", extract_name_node)
    graph.add_node("extract_loan_type", extract_loan_type_node)
    graph.add_node("extract_loan_type_details", extract_loan_type_details_node)
    graph.add_node("extract_loan_amount", extract_loan_amount_node)
    graph.add_node("extract_income_employment", extract_income_employment_node)
    graph.add_node("extract_existing_debts", extract_existing_debts_node)
    graph.add_node("extract_credit_score", extract_credit_score_node)
    graph.add_node("extract_age", extract_age_node)
    graph.add_node("extract_tenure", extract_tenure_node)
    graph.add_node("extract_co_applicant", extract_co_applicant_node)
    graph.add_node("extract_preferred_emi", extract_preferred_emi_node)
    graph.add_node("extract_interest_type", extract_interest_type_node)
    graph.add_node("extract_urgency", extract_urgency_node)
    graph.add_node("completion", completion_node)

    # ── Set entry point ────────────────────────────────────────────────
    graph.set_entry_point("greeting")

    # ── Wire conditional edges ─────────────────────────────────────────
    graph.add_conditional_edges(
        "greeting",
        route_after_greeting,
        {"extract_name": "extract_name"},
    )

    graph.add_conditional_edges(
        "extract_name",
        route_after_name,
        {
            "extract_name": "extract_name",
            "extract_loan_type": "extract_loan_type",
        },
    )

    graph.add_conditional_edges(
        "extract_loan_type",
        route_after_loan_type,
        {
            "extract_loan_type": "extract_loan_type",
            "extract_loan_type_details": "extract_loan_type_details",
        },
    )

    graph.add_conditional_edges(
        "extract_loan_type_details",
        route_after_loan_type_details,
        {
            "extract_loan_type_details": "extract_loan_type_details",
            "extract_loan_amount": "extract_loan_amount",
            "extract_income_employment": "extract_income_employment",
        },
    )

    graph.add_conditional_edges(
        "extract_loan_amount",
        route_after_loan_amount,
        {
            "extract_loan_amount": "extract_loan_amount",
            "extract_income_employment": "extract_income_employment",
        },
    )

    graph.add_conditional_edges(
        "extract_income_employment",
        route_after_income_employment,
        {
            "extract_income_employment": "extract_income_employment",
            "extract_existing_debts": "extract_existing_debts",
        },
    )

    graph.add_conditional_edges(
        "extract_existing_debts",
        route_after_existing_debts,
        {
            "extract_existing_debts": "extract_existing_debts",
            "extract_credit_score": "extract_credit_score",
        },
    )

    graph.add_conditional_edges(
        "extract_credit_score",
        route_after_credit_score,
        {
            "extract_credit_score": "extract_credit_score",
            "extract_age": "extract_age",
        },
    )

    graph.add_conditional_edges(
        "extract_age",
        route_after_age,
        {
            "extract_age": "extract_age",
            "extract_tenure": "extract_tenure",
        },
    )

    graph.add_conditional_edges(
        "extract_tenure",
        route_after_tenure,
        {
            "extract_tenure": "extract_tenure",
            "extract_co_applicant": "extract_co_applicant",
        },
    )

    graph.add_conditional_edges(
        "extract_co_applicant",
        route_after_co_applicant,
        {
            "extract_co_applicant": "extract_co_applicant",
            "extract_preferred_emi": "extract_preferred_emi",
        },
    )

    graph.add_conditional_edges(
        "extract_preferred_emi",
        route_after_preferred_emi,
        {
            "extract_preferred_emi": "extract_preferred_emi",
            "extract_interest_type": "extract_interest_type",
        },
    )

    graph.add_conditional_edges(
        "extract_interest_type",
        route_after_interest_type,
        {
            "extract_interest_type": "extract_interest_type",
            "extract_urgency": "extract_urgency",
        },
    )

    graph.add_conditional_edges(
        "extract_urgency",
        route_after_urgency,
        {
            "extract_urgency": "extract_urgency",
            "completion": "completion",
        },
    )

    # ── Completion → END ───────────────────────────────────────────────
    graph.add_edge("completion", END)

    # ── Compile and return ─────────────────────────────────────────────
    return graph.compile()


_compiled_graph = None

def get_advisory_graph():
    """
    Return the compiled advisory graph (singleton).
    """
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_advisory_graph()
        logger.info("Advisory graph compiled and cached")
    return _compiled_graph
