package com.skillswap.dto;

import java.util.UUID;

public record GroupDTO(
        UUID id,
        String name,
        String description,
        String relatedSkill,
        String creatorName,
        int memberCount,
        int maxMembers,
        boolean isPrivate,
        String iconUrl,
        String createdAt
) {}
