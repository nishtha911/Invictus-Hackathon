from langchain_core.messages import AIMessage
from .state import AgentState

def chat_node(state: AgentState) -> dict:
    """
    Mock chat node. Eventually, this will call the Groq LLM
    with a system prompt to interact with the user.
    """
    # For now, just echo a simple response to test the graph
    messages = state.get("messages", [])
    response = AIMessage(content="Hello! I am your AI Bank Advisor. How can I help you today?")
    
    return {"messages": [response]}

def extraction_node(state: AgentState) -> dict:
    """
    Mock extraction node. Eventually, this will use an LLM
    to parse the conversation history and update the profile.
    """
    profile = state.get("extracted_profile", {})
    
    # Mocking extraction logic for demonstration
    if not profile:
        profile = {"intent": "unknown", "income": 0.0, "loan_amount": 0.0}
        
    return {"extracted_profile": profile}
