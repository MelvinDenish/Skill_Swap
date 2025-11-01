package com.skillswap.config;

import com.skillswap.entity.User;
import com.skillswap.repository.UserRepository;
import com.skillswap.service.GroupPresenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

import java.security.Principal;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
public class GroupPresenceEvents {

    @Autowired private GroupPresenceService presenceService;
    @Autowired private UserRepository userRepository;
    @Autowired(required = false) private SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleSubscribe(SessionSubscribeEvent event) {
        if (messagingTemplate == null) return;
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        String destination = sha.getDestination();
        String sessionId = sha.getSessionId();
        if (destination == null || sessionId == null) return;
        if (!destination.startsWith("/topic/group/")) return;
        // Expect /topic/group/{groupId} or /topic/group/{groupId}/...
        String[] parts = destination.split("/");
        if (parts.length < 4) return;
        String groupIdStr = parts[3];
        try {
            UUID groupId = UUID.fromString(groupIdStr);
            Principal principal = sha.getUser();
            if (principal == null) return;
            User me = userRepository.findByEmail(principal.getName()).orElse(null);
            if (me == null) return;
            presenceService.onSubscribe(sessionId, groupId, me.getId());
            broadcastPresence(groupId);
        } catch (IllegalArgumentException ignored) {}
    }

    @EventListener
    public void handleUnsubscribe(SessionUnsubscribeEvent event) {
        if (messagingTemplate == null) return;
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        String destination = sha.getDestination();
        String sessionId = sha.getSessionId();
        if (destination == null || sessionId == null) return;
        if (!destination.startsWith("/topic/group/")) return;
        String[] parts = destination.split("/");
        if (parts.length < 4) return;
        String groupIdStr = parts[3];
        try {
            UUID groupId = UUID.fromString(groupIdStr);
            presenceService.onUnsubscribe(sessionId, groupId);
            broadcastPresence(groupId);
        } catch (IllegalArgumentException ignored) {}
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        if (messagingTemplate == null) return;
        String sessionId = event.getSessionId();
        if (sessionId == null) return;
        Set<UUID> groups = presenceService.onDisconnect(sessionId);
        for (UUID gid : groups) {
            broadcastPresence(gid);
        }
    }

    private void broadcastPresence(UUID groupId) {
        if (messagingTemplate == null) return;
        Set<UUID> online = presenceService.getOnlineUserIds(groupId);
        messagingTemplate.convertAndSend("/topic/group/" + groupId + "/presence", Map.of("onlineUserIds", online));
    }
}


