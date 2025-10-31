package com.skillswap.service.ai;

import com.skillswap.dto.AiChatMessageDTO;
import com.skillswap.entity.AiChatMessage;
import com.skillswap.entity.User;
import com.skillswap.repository.AiChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Service
public class AiAssistantService {

    @Autowired
    private AiChatMessageRepository repo;

    @Value("${ai.provider:gemini}")
    private String provider;

    @Value("${ai.model:gemini-1.5-flash}")
    private String model;

    @Value("${ai.gemini.api-key:}")
    private String geminiKey;

    @Value("${ai.hf.api-key:}")
    private String hfKey;

    @Value("${ai.timeout-ms:15000}")
    private long timeoutMs;

    @Value("${ai.rate-limit.per-minute:5}")
    private int perMinuteLimit;

    private final Map<UUID, Deque<Instant>> window = new ConcurrentHashMap<>();

    private final WebClient web = WebClient.builder().build();

    public AiChatMessageDTO ask(User user, String question, String skill) {
        enforceRateLimit(user.getId());
        String trimmed = Optional.ofNullable(question).orElse("").trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("Question cannot be empty");
        }
        String prompt = buildPrompt(trimmed, skill);
        String answer = generate(prompt).orElseGet(() -> fallback(skill, trimmed));

        AiChatMessage saved = new AiChatMessage();
        saved.setUser(user);
        saved.setQuestion(trimmed);
        saved.setAnswer(answer);
        saved.setSkillContext(skill);
        saved = repo.save(saved);
        return toDto(saved);
    }

    private void enforceRateLimit(UUID userId) {
        Instant now = Instant.now();
        Deque<Instant> dq = window.computeIfAbsent(userId, k -> new ConcurrentLinkedDeque<>());
        synchronized (dq) {
            Instant cutoff = now.minusSeconds(60);
            while (!dq.isEmpty() && dq.peekFirst().isBefore(cutoff)) dq.pollFirst();
            if (dq.size() >= perMinuteLimit) {
                throw new IllegalStateException("Rate limit exceeded. Please try again in a minute.");
            }
            dq.addLast(now);
        }
    }

    private String buildPrompt(String q, String skill) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a friendly tutoring assistant. Provide concise, step-by-step guidance. ");
        sb.append("If code is needed, include short snippets. Avoid hallucinating; if unsure, say so.\n\n");
        if (skill != null && !skill.isBlank()) {
            sb.append("Skill context: ").append(skill.trim()).append("\n");
        }
        sb.append("Question: ").append(q).append("\n");
        sb.append("Answer:");
        return sb.toString();
    }

    private Optional<String> generate(String prompt) {
        try {
            if ("hf".equalsIgnoreCase(provider) && hfKey != null && !hfKey.isBlank()) {
                return callHuggingFace(prompt);
            }
            if (geminiKey != null && !geminiKey.isBlank()) {
                return callGemini(prompt);
            }
        } catch (Exception ignored) {}
        return Optional.empty();
    }

    private Optional<String> callGemini(String prompt) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + geminiKey;
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                ))
        );
        Map<?, ?> resp = web.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(body))
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofMillis(timeoutMs))
                .onErrorResume(e -> Mono.empty())
                .blockOptional()
                .orElse(null);
        if (resp == null) return Optional.empty();
        try {
            List<?> candidates = (List<?>) resp.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map<?, ?> cand0 = (Map<?, ?>) candidates.get(0);
                Map<?, ?> content = (Map<?, ?>) cand0.get("content");
                List<?> parts = content == null ? null : (List<?>) content.get("parts");
                if (parts != null && !parts.isEmpty()) {
                    Map<?, ?> p0 = (Map<?, ?>) parts.get(0);
                    Object text = p0.get("text");
                    if (text != null) return Optional.of(text.toString());
                }
            }
        } catch (Exception ignored) {}
        return Optional.empty();
    }

    private Optional<String> callHuggingFace(String prompt) {
        String modelRepo = "meta-llama/Llama-3.2-3B-Instruct";
        String url = "https://api-inference.huggingface.co/models/" + modelRepo;
        Map<String, Object> body = Map.of(
                "inputs", prompt,
                "parameters", Map.of(
                        "max_new_tokens", 300,
                        "temperature", 0.2
                )
        );
        List<?> resp = web.post()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + hfKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(body))
                .retrieve()
                .bodyToMono(List.class)
                .timeout(Duration.ofMillis(timeoutMs))
                .onErrorResume(e -> Mono.empty())
                .blockOptional()
                .orElse(null);
        if (resp == null || resp.isEmpty()) return Optional.empty();
        try {
            Object first = resp.get(0);
            if (first instanceof Map<?, ?> map) {
                Object text = map.get("generated_text");
                if (text != null) return Optional.of(text.toString());
            }
        } catch (Exception ignored) {}
        return Optional.empty();
    }

    private String fallback(String skill, String question) {
        String s = (skill == null || skill.isBlank()) ? "general" : skill.toLowerCase(Locale.ROOT);
        String tips = switch (s) {
            case "java" -> "1) Clarify the problem. 2) Reproduce with a minimal example. 3) Check logs/stacktrace. 4) Use JUnit to isolate. 5) Consider time/space complexity.\n";
            case "react" -> "1) Re-check component state/props. 2) Use React DevTools. 3) Verify dependency arrays. 4) Isolate with a small sandbox. 5) Mind async setState.\n";
            case "python" -> "1) Use print/logging to trace values. 2) Create a minimal repro. 3) Check virtualenv/package versions. 4) Add type hints to clarify.\n";
            case "aws" -> "1) Verify IAM permissions. 2) Check service quotas. 3) Inspect CloudWatch logs. 4) Confirm region/config. 5) Use least-privilege principles.\n";
            default -> "1) Break the problem down. 2) Verify assumptions. 3) Check inputs/outputs. 4) Start from a minimal working example. 5) Iterate and test.\n";
        };
        return tips + "\nQuestion recap: " + question;
    }

    public AiChatMessageDTO toDto(AiChatMessage m) {
        return new AiChatMessageDTO(
                m.getId(),
                m.getQuestion(),
                m.getAnswer(),
                m.getSkillContext(),
                m.getCreatedAt() == null ? null : DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(m.getCreatedAt())
        );
    }
}
