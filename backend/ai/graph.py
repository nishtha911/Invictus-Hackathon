from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes import chat_node, extraction_node

def build_graph():
    # 1. Initialize the graph with the state schema
    workflow = StateGraph(AgentState)
    
    # 2. Add nodes
    workflow.add_node("chat", chat_node)
    workflow.add_node("extract", extraction_node)
    
    # 3. Define edges
    # Start at the chat node
    workflow.set_entry_point("chat")
    
    # After chat, always run extraction (linear flow for now)
    workflow.add_edge("chat", "extract")
    
    # After extraction, end the graph cycle (returns state to caller)
    workflow.add_edge("extract", END)
    
    # 4. Compile the graph
    app = workflow.compile()
    return app

# Expose a compiled instance
graph_app = build_graph()
