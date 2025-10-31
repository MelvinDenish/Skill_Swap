package com.skillswap.controller;

import com.skillswap.dto.AiAskRequest;
import com.skillswap.dto.AiChatMessageDTO;
import com.skillswap.entity.User;
import com.skillswap.error.RateLimitException;
import com.skillswap.repository.AiChatMessageRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.service.ai.AiAssistantService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@ConditionalOnProperty(prefix = "features.ai", name = "enabled", havingValue = "true", matchIfMissing = false)
@RequestMapping("/api/ai")
public class AiController {

    @Autowired
    private AiAssistantService aiService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AiChatMessageRepository repo;

    @PostMapping("/ask")
    public ResponseEntity<AiChatMessageDTO> ask(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody AiAskRequest req
    ) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        try {
            AiChatMessageDTO dto = aiService.ask(me, req.question(), req.skill());
            return ResponseEntity.ok(dto);
        } catch (IllegalStateException e) {
            throw new RateLimitException(e.getMessage());
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<AiChatMessageDTO>> history(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (size > 50) size = 50;
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<com.skillswap.entity.AiChatMessage> p = repo.findByUserId(me.getId(), pageable);
        List<AiChatMessageDTO> list = p.getContent().stream().map(aiService::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/history")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearHistory(@AuthenticationPrincipal UserDetails principal) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        // Soft clear: delete all user's messages
        var page = repo.findByUserId(me.getId(), PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt")));
        while (!page.isEmpty()) {
            repo.deleteAll(page.getContent());
            if (!page.hasNext()) break;
            page = repo.findByUserId(me.getId(), page.nextPageable());
        }
    }
}
