package com.defense.orchestrator;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class OrchestratorService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    // Added a default fallback URL here so it never crashes!
    @Value("${ai-engines.url:http://127.0.0.1:8000/evaluate}")
    private String aiEngineUrl;

    public OrchestratorService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.webClient = WebClient.create(); // Simplified native creation
        this.objectMapper = new ObjectMapper();
    }

    @KafkaListener(topics = "agent-requests", groupId = "orchestrator-group")
    public void consumeAgentRequest(String rawJsonMessage) {
        System.out.println("\n[🛡️ ORCHESTRATOR] Intercepted inter-agent payload...");

        try {
            // 1. Parse the incoming Kafka message
            PayloadModels.InterAgentPayload requestPayload = 
                objectMapper.readValue(rawJsonMessage, PayloadModels.InterAgentPayload.class);

            // 2. Send Asynchronous HTTP Request to Python Neuro-Symbolic Engine
            webClient.post()
                .uri(aiEngineUrl)
                .bodyValue(requestPayload)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .subscribe(response -> evaluateVerdict(requestPayload, response));

        } catch (Exception e) {
            System.err.println("[❌ ERROR] Failed to process payload: " + e.getMessage());
        }
    }

    private void evaluateVerdict(PayloadModels.InterAgentPayload request, JsonNode aiResponse) {
        // Extract exact values from the Python JSON response
        boolean isPolicyValid = aiResponse.get("symbolic_evaluation").get("state_transition_valid").asBoolean();
        double threatScore = aiResponse.get("neuro_evaluation").get("adversarial_probability").asDouble();

        String action;
        String reason;

        // 3. The Zero-Trust Validation Gate (Neuro-Symbolic Logic)
        if (!isPolicyValid) {
            action = "DROP_PAYLOAD";
            reason = "Symbolic Engine Block: Unauthorized state transition.";
            System.out.println("[🛑 BLOCKED] " + reason);
        } else if (threatScore > 0.5) {
            action = "DROP_PAYLOAD";
            reason = "Neural Engine Block: High probability of adversarial prompt injection (" + threatScore + ").";
            System.out.println("[🛑 BLOCKED] " + reason);
        } else {
            action = "PERMIT_AND_SIGN";
            reason = "Cleared Neuro-Symbolic Gate. JWT Signature Applied.";
            System.out.println("[✅ APPROVED] " + reason);
        }

        // 4. Publish the final verified state back to the Kafka event stream
        publishVerdict(request, action, reason);
    }

    private void publishVerdict(PayloadModels.InterAgentPayload request, String action, String reason) {
        try {
            PayloadModels.OrchestratorVerdict verdict = new PayloadModels.OrchestratorVerdict(
                "NS_FW_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                request.sourceNode(),
                request.targetNode(),
                action,
                reason
            );

            String verdictJson = objectMapper.writeValueAsString(verdict);
            
            // 1. Send to Kafka Event Stream
            kafkaTemplate.send("orchestrator-verdict", verdictJson);
            
            // 2. Stream directly to the React Dashboard
            for (org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter : DashboardController.emitters) {
                try {
                    emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event().name("verdict").data(verdictJson));
                } catch (Exception e) {
                    emitter.complete();
                    DashboardController.emitters.remove(emitter);
                }
            }
            
        } catch (Exception e) {
            System.err.println("[❌ ERROR] Failed to publish verdict.");
        }
    }
}