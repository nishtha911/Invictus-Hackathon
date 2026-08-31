# /backend/test_chat.py
"""
Interactive CLI test client for the advisory chat engine.

Usage:
  1. Start the server:  python run.py
  2. In another terminal: python test_chat.py

This simulates a full conversation in the terminal,
showing bot messages, UI components, and extraction progress.
"""

import httpx
import json
import sys

BASE_URL = "http://localhost:8080"

def print_separator():
    print("\n" + "=" * 70)

def print_bot_message(msg: dict):
    """Pretty-print a bot message with UI component info."""
    print(f"\n🤖 Bot: {msg['content']}")

    ui = msg.get("ui_component")
    if ui:
        comp_type = ui.get("type", "")
        if comp_type == "mcq" and ui.get("options"):
            print("\n   Options:")
            for i, opt in enumerate(ui["options"], 1):
                print(f"   {i}. {opt['label']}  →  value: \"{opt['value']}\"")
        elif comp_type == "yes_no" and ui.get("options"):
            print("\n   Options:")
            for opt in ui["options"]:
                print(f"   • {opt['label']}  →  value: \"{opt['value']}\"")
        elif comp_type == "slider":
            print(
                f"\n   Slider: {ui.get('min_value')} — {ui.get('max_value')} "
                f"(step: {ui.get('step')}, unit: {ui.get('unit')})"
            )
        elif comp_type == "number_input":
            print(
                f"\n   Number input: {ui.get('placeholder', '')} "
                f"(unit: {ui.get('unit', '')})"
            )
        elif comp_type == "text_input":
            print(f"\n   Text input: {ui.get('placeholder', '')}")

    target = msg.get("field_target")
    if target:
        print(f"   [Target field: {target}]")

def print_session_state(session_state: dict):
    """Print session progress."""
    pct = session_state.get("completeness_pct", 0)
    phase = session_state.get("current_phase", "?")
    filled = session_state.get("fields_filled", [])

    bar_len = 30
    filled_len = int(bar_len * pct / 100)
    bar = "█" * filled_len + "░" * (bar_len - filled_len)

    print(f"\n   📊 Progress: [{bar}] {pct}%")
    print(f"   📍 Phase: {phase}")
    if filled:
        print(f"   ✅ Fields: {', '.join(filled)}")

def main():
    client = httpx.Client(timeout=60.0)

    print_separator()
    print("🏦 AI Loan Advisory — Interactive CLI Test")
    print("   Type your answers or use the MCQ values shown.")
    print("   Type 'quit' to exit, 'state' to see full session state.")
    print_separator()

    # ── Step 1: Start session ──────────────────────────────────────────
    try:
        resp = client.post(f"{BASE_URL}/api/chat/start?user_type=guest")
        resp.raise_for_status()
    except httpx.ConnectError:
        print("\n❌ Cannot connect to server. Make sure it's running:")
        print("   python run.py")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error starting session: {e}")
        sys.exit(1)

    data = resp.json()
    session_id = data["session_id"]
    print(f"\n🔑 Session ID: {session_id}")

    # Show greeting messages
    for msg in data.get("messages", []):
        print_bot_message(msg)
    print_session_state(data.get("session_state", {}))

    # ── Step 2: Conversation loop ──────────────────────────────────────
    while True:
        print_separator()
        user_input = input("\n👤 You: ").strip()

        if not user_input:
            continue

        if user_input.lower() == "quit":
            print("\n👋 Goodbye!")
            break

        if user_input.lower() == "state":
            # Fetch full session state
            resp = client.get(f"{BASE_URL}/api/chat/{session_id}")
            if resp.status_code == 200:
                print("\n📋 Full Session State:")
                print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
            else:
                print(f"❌ Error: {resp.text}")
            continue

        # Send message
        try:
            resp = client.post(
                f"{BASE_URL}/api/chat/message",
                json={
                    "session_id": session_id,
                    "message": user_input,
                },
            )
            resp.raise_for_status()
        except Exception as e:
            print(f"\n❌ Error: {e}")
            continue

        data = resp.json()

        # Show bot responses
        for msg in data.get("messages", []):
            print_bot_message(msg)

        # Show progress
        session_state = data.get("session_state", {})
        print_session_state(session_state)

        # Check if complete
        if session_state.get("is_complete"):
            print_separator()
            print("\n🎉 Profile extraction complete!")

            extracted = data.get("extracted_profile")
            if extracted:
                print("\n📄 Extracted Profile (Pod 1 → Pod 2 Contract):")
                print(json.dumps(extracted, indent=2, ensure_ascii=False))
            break

    client.close()

# ── Quick automated test ───────────────────────────────────────────────

def run_automated_test():
    """
    Run a quick automated test with predefined answers.
    Useful for CI or quick smoke testing.
    """
    client = httpx.Client(timeout=60.0)

    print("\n🤖 Running automated test (Home Loan scenario)...\n")

    answers = [
        "home_loan",                          # Loan type
        "Property 50 lakh, need 40 lakh",     # Home loan details
        # (loan amount derived from above)
        "salaried",                           # Employment type
        "120000",                             # Monthly income
        "yes",                                # Has existing loans
        "10000",                              # Existing EMI
        "good",                               # Credit score
        "35",                                 # Age
        "20",                                 # Tenure (years)
        "yes",                                # Co-applicant
        "immediate",                          # Urgency
    ]

    # Start
    resp = client.post(f"{BASE_URL}/api/chat/start?user_type=guest")
    data = resp.json()
    session_id = data["session_id"]
    print(f"Session: {session_id}")

    for msg in data.get("messages", []):
        print(f"  🤖 {msg['content'][:80]}...")

    # Send answers
    for i, answer in enumerate(answers):
        print(f"\n  👤 [{i+1}] Sending: '{answer}'")

        resp = client.post(
            f"{BASE_URL}/api/chat/message",
            json={"session_id": session_id, "message": answer},
        )
        data = resp.json()

        for msg in data.get("messages", []):
            content = msg["content"]
            if len(content) > 100:
                content = content[:100] + "..."
            print(f"  🤖 {content}")

        state = data.get("session_state", {})
        print(f"     Progress: {state.get('completeness_pct', 0)}% | Phase: {state.get('current_phase', '?')}")

        if state.get("is_complete"):
            print("\n✅ Test PASSED — Profile complete!")
            extracted = data.get("extracted_profile")
            if extracted:
                print(json.dumps(extracted, indent=2, ensure_ascii=False))
            break
    else:
        print("\n⚠️ Test completed all answers but profile may not be complete.")
        # Fetch final state
        resp = client.get(f"{BASE_URL}/api/chat/{session_id}")
        if resp.status_code == 200:
            print(json.dumps(resp.json(), indent=2, ensure_ascii=False))

    client.close()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--auto":
        run_automated_test()
    else:
        main()