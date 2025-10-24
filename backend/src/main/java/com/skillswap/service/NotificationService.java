package com.skillswap.service;

import com.skillswap.entity.Notification;
import com.skillswap.entity.NotificationType;
import com.skillswap.entity.User;
import com.skillswap.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    public Notification create(User user, String message, NotificationType type) {
        Notification n = new Notification();
        n.setUser(user);
        n.setMessage(message);
        n.setType(type);
        n.setIsRead(false);
        Notification saved = notificationRepository.save(n);
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/notifications/" + user.getId(), saved);
        }
        return saved;
    }

    public List<Notification> getForUser(java.util.UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void markRead(java.util.UUID id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    public void delete(java.util.UUID id) {
        notificationRepository.deleteById(id);
    }
}
