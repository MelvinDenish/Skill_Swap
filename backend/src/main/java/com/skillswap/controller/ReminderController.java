package com.skillswap.controller;

import com.skillswap.dto.ReminderLogDTO;
import com.skillswap.dto.ReminderMarkRequest;
import com.skillswap.entity.ReminderLog;
import com.skillswap.entity.SkillSession;
import com.skillswap.entity.User;
import com.skillswap.repository.ReminderLogRepository;
import com.skillswap.repository.SkillSessionRepository;
import com.skillswap.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    @Autowired
    private ReminderLogRepository reminderLogRepository;

    @Autowired
    private SkillSessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<ReminderLogDTO>> bySession(@AuthenticationPrincipal UserDetails principal,
                                                          @PathVariable UUID sessionId) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        SkillSession s = sessionRepository.findById(sessionId).orElseThrow();
        if (!isParticipant(me, s)) return ResponseEntity.status(403).build();
        List<ReminderLogDTO> out = reminderLogRepository.findBySessionId(sessionId).stream().map(this::toDTO).toList();
        return ResponseEntity.ok(out);
    }

    @PostMapping("/session/{sessionId}/mark")
    public ResponseEntity<ReminderLogDTO> mark(@AuthenticationPrincipal UserDetails principal,
                                               @PathVariable UUID sessionId,
                                               @Valid @RequestBody ReminderMarkRequest req) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        SkillSession s = sessionRepository.findById(sessionId).orElseThrow();
        if (!isParticipant(me, s)) return ResponseEntity.status(403).build();
        ReminderLog log = new ReminderLog();
        log.setSession(s);
        log.setType(req.type());
        log.setSent(req.sent() != null ? req.sent() : Boolean.TRUE);
        if (Boolean.TRUE.equals(log.getSent())) {
            log.setSentAt(LocalDateTime.now());
        }
        log.setError(req.error());
        ReminderLog saved = reminderLogRepository.save(log);
        return ResponseEntity.ok(toDTO(saved));
    }

    private boolean isParticipant(User me, SkillSession s) {
        return s.getTeacher().getId().equals(me.getId()) || s.getLearner().getId().equals(me.getId());
    }

    private ReminderLogDTO toDTO(ReminderLog log) {
        return new ReminderLogDTO(log.getId(), log.getSession().getId(), log.getType(), log.getSent(), log.getSentAt(), log.getCreatedAt(), log.getError());
    }
}
