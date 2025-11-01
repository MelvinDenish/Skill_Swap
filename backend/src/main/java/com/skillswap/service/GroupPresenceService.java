package com.skillswap.service;

import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GroupPresenceService {

    // groupId -> set of online userIds
    private final ConcurrentHashMap<UUID, Set<UUID>> groupOnline = new ConcurrentHashMap<>();

    // sessionId -> userId
    private final ConcurrentHashMap<String, UUID> sessionUser = new ConcurrentHashMap<>();

    // sessionId -> set of groupIds subscribed
    private final ConcurrentHashMap<String, Set<UUID>> sessionGroups = new ConcurrentHashMap<>();

    public void onSubscribe(String sessionId, UUID groupId, UUID userId) {
        sessionUser.putIfAbsent(sessionId, userId);
        sessionGroups.computeIfAbsent(sessionId, s -> Collections.newSetFromMap(new ConcurrentHashMap<>())).add(groupId);
        groupOnline.computeIfAbsent(groupId, g -> Collections.newSetFromMap(new ConcurrentHashMap<>())).add(userId);
    }

    public void onUnsubscribe(String sessionId, UUID groupId) {
        Set<UUID> groups = sessionGroups.getOrDefault(sessionId, Collections.emptySet());
        groups.remove(groupId);
        UUID userId = sessionUser.get(sessionId);
        if (userId != null) {
            Set<UUID> online = groupOnline.get(groupId);
            if (online != null) {
                online.remove(userId);
                if (online.isEmpty()) groupOnline.remove(groupId);
            }
        }
    }

    public Set<UUID> onDisconnect(String sessionId) {
        UUID userId = sessionUser.remove(sessionId);
        Set<UUID> groups = sessionGroups.remove(sessionId);
        if (userId == null || groups == null) return Collections.emptySet();
        for (UUID groupId : groups) {
            Set<UUID> online = groupOnline.get(groupId);
            if (online != null) {
                online.remove(userId);
                if (online.isEmpty()) groupOnline.remove(groupId);
            }
        }
        return groups;
    }

    public Set<UUID> getOnlineUserIds(UUID groupId) {
        return groupOnline.getOrDefault(groupId, Collections.emptySet());
    }
}


