package com.skillswap.controller;

import com.skillswap.dto.CreateSessionRequest;
import com.skillswap.dto.SessionDTO;
import com.skillswap.dto.UpdateSessionStatusRequest;
import com.skillswap.entity.*;
import com.skillswap.repository.SkillSessionRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserSkillsRepository;
import com.skillswap.service.NotificationService;
import com.skillswap.service.UserService;
import com.skillswap.service.CalendarSyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    @Autowired
    private SkillSessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSkillsRepository userSkillsRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private CalendarSyncService calendarSyncService;

    @GetMapping("/my-sessions")
    public ResponseEntity<List<SessionDTO>> mySessions(@AuthenticationPrincipal UserDetails principal) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        List<SkillSession> sessions = sessionRepository.findMySessions(me.getId());
        return ResponseEntity.ok(sessions.stream().map(s -> mapToDTO(s, me)).toList());
    }

    @GetMapping
    public ResponseEntity<List<SessionDTO>> list(@AuthenticationPrincipal UserDetails principal) {
        // Mirrors /my-sessions for compatibility
        return mySessions(principal);
    }

    @PostMapping
    public ResponseEntity<SessionDTO> create(@AuthenticationPrincipal UserDetails principal,
                                             @Valid @RequestBody CreateSessionRequest req) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        User partner = userRepository.findById(req.partnerId()).orElseThrow();

        SkillSession s = new SkillSession();
        boolean iAmTeacher = Boolean.TRUE.equals(req.isTeacher());
        s.setTeacher(iAmTeacher ? me : partner);
        s.setLearner(iAmTeacher ? partner : me);
        s.setSkillTopic(req.skillTopic());
        s.setScheduledTime(req.scheduledTime());
        s.setDuration(req.duration() == null ? 60 : req.duration());
        s.setStatus(SessionStatus.PENDING);
        SkillSession saved = sessionRepository.save(s);

        notificationService.create(partner, "New session request from " + me.getName(), NotificationType.SESSION_REQUEST);

        calendarSyncService.syncSession(saved);

        return ResponseEntity.ok(mapToDTO(saved, me));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<SessionDTO> updateStatus(@AuthenticationPrincipal UserDetails principal,
                                                   @PathVariable UUID id,
                                                   @Valid @RequestBody UpdateSessionStatusRequest req) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        SkillSession s = sessionRepository.findById(id).orElseThrow();

        SessionStatus newStatus = SessionStatus.valueOf(req.status());
        s.setStatus(newStatus);
        sessionRepository.save(s);

        if (newStatus == SessionStatus.CONFIRMED) {
            notificationService.create(s.getTeacher(), "Session confirmed with " + s.getLearner().getName(), NotificationType.SESSION_REMINDER);
            notificationService.create(s.getLearner(), "Session confirmed with " + s.getTeacher().getName(), NotificationType.SESSION_REMINDER);
        }

        if (newStatus == SessionStatus.COMPLETED) {
            User teacher = s.getTeacher();
            User learner = s.getLearner();
            UserSkills teacherSkills = userSkillsRepository.findByUserId(teacher.getId()).orElseThrow();
            UserSkills learnerSkills = userSkillsRepository.findByUserId(learner.getId()).orElseThrow();
            teacherSkills.setCompletedSessions((teacherSkills.getCompletedSessions() == null ? 0 : teacherSkills.getCompletedSessions()) + 1);
            learnerSkills.setCompletedSessions((learnerSkills.getCompletedSessions() == null ? 0 : learnerSkills.getCompletedSessions()) + 1);
            userSkillsRepository.save(teacherSkills);
            userSkillsRepository.save(learnerSkills);
            // Award points
            userService.addPoints(teacher.getId(), 20);
            userService.addPoints(learner.getId(), 10);
        }

        calendarSyncService.syncSession(s);
        return ResponseEntity.ok(mapToDTO(s, me));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserDetails principal, @PathVariable UUID id) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        SkillSession s = sessionRepository.findById(id).orElseThrow();
        if (!s.getTeacher().getId().equals(me.getId()) && !s.getLearner().getId().equals(me.getId())) {
            return ResponseEntity.status(403).build();
        }
        sessionRepository.deleteById(id);
        calendarSyncService.deleteSessionEvents(s);
        return ResponseEntity.noContent().build();
    }

    private SessionDTO mapToDTO(SkillSession s, User current) {
        boolean isTeacher = s.getTeacher().getId().equals(current.getId());
        User partner = isTeacher ? s.getLearner() : s.getTeacher();
        return new SessionDTO(
                s.getId(),
                partner.getId(),
                partner.getName(),
                partner.getProfilePictureUrl(),
                s.getSkillTopic(),
                s.getScheduledTime(),
                s.getDuration(),
                s.getStatus().name(),
                s.getMeetingLink(),
                isTeacher
        );
    }
}
