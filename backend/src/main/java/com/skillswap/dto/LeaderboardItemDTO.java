package com.skillswap.dto;

import java.util.UUID;

public record LeaderboardItemDTO(
        UUID id,
        String name,
        String profilePictureUrl,
        Integer points,
        String level,
        Double rating,
        Integer completedSessions
) {}
