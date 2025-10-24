package com.skillswap.service;

import com.skillswap.entity.ReminderLog;
import com.skillswap.entity.ReminderType;
import com.skillswap.entity.SessionStatus;
import com.skillswap.entity.SkillSession;
import com.skillswap.repository.ReminderLogRepository;
import com.skillswap.repository.SkillSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class ReminderScheduler {

    @Autowired
    private SkillSessionRepository sessionRepository;

    @Autowired
    private ReminderLogRepository reminderLogRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    // Runs every 5 minutes
    @Scheduled(fixedDelay = 300_000)
    public void processReminders() {
        LocalDateTime now = LocalDateTime.now();
        sendWindowReminders(now.plusHours(24), ReminderType.BEFORE_24H);
        sendWindowReminders(now.plusHours(1), ReminderType.BEFORE_1H);
        sendFollowUps(now);
    }

    private void sendWindowReminders(LocalDateTime target, ReminderType type) {
        LocalDateTime windowStart = target;
        LocalDateTime windowEnd = target.plusMinutes(5);
        List<SkillSession> sessions = sessionRepository.findConfirmedBetween(windowStart, windowEnd);
        for (SkillSession s : sessions) {
            if (!alreadySent(s, type)) {
                String when = s.getScheduledTime().toString();
                String subject = "Reminder: Skill session on " + when;
                String teacherMsg = "You have a session with " + s.getLearner().getName() + " at " + when;
                String learnerMsg = "You have a session with " + s.getTeacher().getName() + " at " + when;
                emailService.send(s.getTeacher().getEmail(), subject, teacherMsg);
                emailService.send(s.getLearner().getEmail(), subject, learnerMsg);
                notificationService.create(s.getTeacher(), subject, com.skillswap.entity.NotificationType.SESSION_REMINDER);
                notificationService.create(s.getLearner(), subject, com.skillswap.entity.NotificationType.SESSION_REMINDER);
                markSent(s, type);
            }
        }
    }

    private void sendFollowUps(LocalDateTime now) {
        // Sessions completed where we haven't sent follow-up
        List<SkillSession> sessions = sessionRepository.findByStatusAndScheduledTimeBefore(SessionStatus.COMPLETED, now);
        for (SkillSession s : sessions) {
            if (!alreadySent(s, ReminderType.FOLLOW_UP)) {
                String subject = "How was your session?";
                String teacherMsg = "Please add notes and rate your learner for the session on " + s.getScheduledTime();
                String learnerMsg = "Please add notes and rate your teacher for the session on " + s.getScheduledTime();
                emailService.send(s.getTeacher().getEmail(), subject, teacherMsg);
                emailService.send(s.getLearner().getEmail(), subject, learnerMsg);
                notificationService.create(s.getTeacher(), subject, com.skillswap.entity.NotificationType.SESSION_REMINDER);
                notificationService.create(s.getLearner(), subject, com.skillswap.entity.NotificationType.SESSION_REMINDER);
                markSent(s, ReminderType.FOLLOW_UP);
            }
        }
    }

    private boolean alreadySent(SkillSession session, ReminderType type) {
        return !reminderLogRepository.findBySessionAndType(session.getId(), type).isEmpty();
    }

    private void markSent(SkillSession session, ReminderType type) {
        ReminderLog log = new ReminderLog();
        log.setSession(session);
        log.setType(type);
        log.setSent(true);
        log.setSentAt(LocalDateTime.now());
        reminderLogRepository.save(log);
    }
}
