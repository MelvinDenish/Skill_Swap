package com.skillswap.controller;

import com.skillswap.dto.ConversationDTO;
import com.skillswap.dto.MessageDTO;
import com.skillswap.entity.User;
import com.skillswap.repository.UserRepository;
import com.skillswap.service.ChatService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired private ChatService chatService;
    @Autowired private UserRepository userRepository;

    @PostMapping("/start/{otherId}")
    public ResponseEntity<ConversationDTO> start(@AuthenticationPrincipal UserDetails principal, @PathVariable UUID otherId) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(chatService.startOrGet(me.getId(), otherId));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDTO>> conversations(@AuthenticationPrincipal UserDetails principal) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(chatService.listForUser(me.getId()));
    }

    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<Page<MessageDTO>> messages(@PathVariable UUID conversationId,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(chatService.messages(conversationId, page, size));
    }

    public record SendRequest(@NotBlank String text) {}

    @PostMapping("/{conversationId}/send")
    public ResponseEntity<MessageDTO> send(@AuthenticationPrincipal UserDetails principal,
                                           @PathVariable UUID conversationId,
                                           @RequestBody SendRequest req) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(chatService.send(conversationId, me.getId(), req.text()));
    }

    @PutMapping("/{conversationId}/read")
    public ResponseEntity<Void> markRead(@AuthenticationPrincipal UserDetails principal, @PathVariable UUID conversationId) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        chatService.markRead(conversationId, me.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{conversationId}/unread")
    public ResponseEntity<Long> unread(@AuthenticationPrincipal UserDetails principal, @PathVariable UUID conversationId) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(chatService.unreadCount(conversationId, me.getId()));
    }
}
