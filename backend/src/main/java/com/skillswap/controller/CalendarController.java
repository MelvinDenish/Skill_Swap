package com.skillswap.controller;

import com.skillswap.dto.CalendarEventMappingDTO;
import com.skillswap.entity.CalendarEventMapping;
import com.skillswap.entity.SkillSession;
import com.skillswap.entity.User;
import com.skillswap.repository.CalendarEventMappingRepository;
import com.skillswap.repository.SkillSessionRepository;
import com.skillswap.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    @Autowired
    private CalendarEventMappingRepository mappingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillSessionRepository sessionRepository;

    @GetMapping("/mappings")
    public ResponseEntity<List<CalendarEventMappingDTO>> myMappings(@AuthenticationPrincipal UserDetails principal) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        List<CalendarEventMappingDTO> out = mappingRepository.findByUserId(me.getId()).stream().map(this::toDTO).toList();
        return ResponseEntity.ok(out);
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<CalendarEventMappingDTO>> bySession(@AuthenticationPrincipal UserDetails principal,
                                                                   @PathVariable UUID sessionId) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        SkillSession s = sessionRepository.findById(sessionId).orElseThrow();
        if (!isParticipant(me, s)) return ResponseEntity.status(403).build();
        List<CalendarEventMappingDTO> out = mappingRepository.findBySessionId(sessionId).stream().map(this::toDTO).toList();
        return ResponseEntity.ok(out);
    }

    private boolean isParticipant(User me, SkillSession s) {
        return s.getTeacher().getId().equals(me.getId()) || s.getLearner().getId().equals(me.getId());
    }

    private CalendarEventMappingDTO toDTO(CalendarEventMapping m) {
        return new CalendarEventMappingDTO(m.getId(), m.getSession().getId(), m.getProvider(), m.getProviderEventId(), m.getHtmlLink(), m.getIcalUid(), m.getLastSyncedAt());
    }
}
