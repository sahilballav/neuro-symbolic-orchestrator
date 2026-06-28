from pydantic import BaseModel

class InterAgentPayload(BaseModel):
    source_node: str
    target_node: str
    payload_text: str