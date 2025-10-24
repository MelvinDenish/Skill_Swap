package com.skillswap.dto;

import com.skillswap.entity.ResourceType;
import java.util.UUID;

public record ResourceItemDTO(
        UUID id,
        String skillName,
        ResourceType type,
        String title,
        String description,
        String url,
        String contentType,
        Long sizeBytes,
        String createdAt
) {}
