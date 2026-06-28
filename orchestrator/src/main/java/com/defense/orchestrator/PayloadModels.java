package com.defense.orchestrator;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class PayloadModels {

    public record InterAgentPayload(
        @JsonProperty("source_node") String sourceNode,
        @JsonProperty("target_node") String targetNode,
        @JsonProperty("payload_text") String payloadText
    ) {
        @JsonCreator
        public InterAgentPayload(
            @JsonProperty("source_node") String sourceNode,
            @JsonProperty("target_node") String targetNode,
            @JsonProperty("payload_text") String payloadText
        ) {
            this.sourceNode = sourceNode;
            this.targetNode = targetNode;
            this.payloadText = payloadText;
        }
    }

    public record OrchestratorVerdict(
        @JsonProperty("orchestrator_txn_id") String txnId,
        @JsonProperty("source_node") String sourceNode,
        @JsonProperty("target_node") String targetNode,
        @JsonProperty("action") String action,
        @JsonProperty("reason") String reason
    ) {}
}