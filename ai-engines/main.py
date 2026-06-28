from fastapi import FastAPI
from schemas import InterAgentPayload

app = FastAPI(title="Neuro-Symbolic AI Defense Engines")

# --- SYMBOLIC ENGINE (Deterministic Policy Rules) ---
# Hardcoded state-transition rules that can never be bypassed by AI reasoning
VALID_TRANSITIONS = {
    "agent_triage_edge": ["agent_fw_execution", "agent_logging"],
    "agent_fw_execution": ["agent_logging"]
}

def evaluate_symbolic_logic(source: str, target: str) -> bool:
    """Verifies if the data pathway is explicitly authorized."""
    if source in VALID_TRANSITIONS and target in VALID_TRANSITIONS[source]:
        return True
    return False


# --- NEURAL ENGINE (Heuristic/Semantic Analysis) ---
def evaluate_neural_heuristics(text: str) -> float:
    """
    Simulates semantic parsing looking for adversarial injection patterns.
    """
    adversarial_triggers = [
        "ignore previous instructions", 
        "override system", 
        "bypass security", 
        "act as root"
    ]
    
    text_lower = text.lower()
    matches = sum(1 for trigger in adversarial_triggers if trigger in text_lower)
    
    # Calculate a mock malicious probability vector based on matches
    if matches > 0:
        return min(0.4 + (matches * 0.25), 0.99)
    return 0.04


# --- ORCHESTRATION ENDPOINT ---

@app.post("/evaluate")
async def evaluate_payload(data: InterAgentPayload):
    # 1. Run Symbolic Check (Deterministic / Instant Fail Gate)
    is_policy_valid = evaluate_symbolic_logic(data.source_node, data.target_node)
    
    # 2. Run Neural Check (Contextual / Probabilistic)
    adversarial_prob = evaluate_neural_heuristics(data.payload_text)
    
    return {
        "symbolic_evaluation": {
            "policy_constraint_met": is_policy_valid,
            "state_transition_valid": is_policy_valid
        },
        "neuro_evaluation": {
            "adversarial_probability": adversarial_prob,
            "semantic_intent": "quarantine_ip" if "quarantine" in data.payload_text.lower() else "unknown"
        }
    }