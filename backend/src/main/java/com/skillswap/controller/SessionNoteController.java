package com.skillswap.controller;

import com.skillswap.dto.*;
import com.skillswap.entity.SessionNote;
import com.skillswap.entity.SkillSession;
import com.skillswap.entity.User;
import com.skillswap.repository.SessionNoteRepository;
import com.skillswap.repository.SkillSessionRepository;
import com.skillswap.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class SessionNoteController {

    @Autowired
    private SessionNoteRepository noteRepository;

    @Autowired
    private SkillSessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/sessions/{sessionId}/notes")
    public ResponseEntity<List<SessionNoteDTO>> list(@AuthenticationPrincipal UserDetails principal,
                                                     @PathVariable UUID sessionId) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        SkillSession s = sessionRepository.findById(sessionId).orElseThrow();
        if (!isParticipant(me, s)) return ResponseEntity.status(403).build();
        List<SessionNoteDTO> out = noteRepository.findBySessionId(sessionId)
                .stream().map(this::toDTO).toList();
        return ResponseEntity.ok(out);
    }

    @PostMapping("/sessions/{sessionId}/notes")
    public ResponseEntity<SessionNoteDTO> create(@AuthenticationPrincipal UserDetails principal,
                                                 @PathVariable UUID sessionId,
                                                 @Valid @RequestBody CreateSessionNoteRequest req) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        SkillSession s = sessionRepository.findById(sessionId).orElseThrow();
        if (!isParticipant(me, s)) return ResponseEntity.status(403).build();
        SessionNote n = new SessionNote();
        n.setAuthor(me);
        n.setSession(s);
        n.setContent(req.content());
        SessionNote saved = noteRepository.save(n);
        return ResponseEntity.ok(toDTO(saved));
    }

    @PutMapping("/notes/{id}")
    public ResponseEntity<SessionNoteDTO> update(@AuthenticationPrincipal UserDetails principal,
                                                 @PathVariable UUID id,
                                                 @Valid @RequestBody UpdateSessionNoteRequest req) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        SessionNote n = noteRepository.findById(id).orElseThrow();
        if (!n.getAuthor().getId().equals(me.getId())) return ResponseEntity.status(403).build();
        n.setContent(req.content());
        SessionNote saved = noteRepository.save(n);
        return ResponseEntity.ok(toDTO(saved));
    }

    @DeleteMapping("/notes/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserDetails principal, @PathVariable UUID id) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        SessionNote n = noteRepository.findById(id).orElseThrow();
        if (!n.getAuthor().getId().equals(me.getId())) return ResponseEntity.status(403).build();
        noteRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private boolean isParticipant(User me, SkillSession s) {
        return s.getTeacher().getId().equals(me.getId()) || s.getLearner().getId().equals(me.getId());
    }

    private SessionNoteDTO toDTO(SessionNote n) {
        return new SessionNoteDTO(n.getId(), n.getSession().getId(), n.getAuthor().getId(), n.getContent(), n.getCreatedAt(), n.getUpdatedAt());
    }
}
