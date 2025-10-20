package com.skillswap.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReviewViewDTO(
        UUID id,
        UUID reviewerId,
        String reviewerName,
        String reviewerProfilePictureUrl,
        UUID revieweeId,
        Integer rating,
        String comment,
        LocalDateTime createdAt
) {}
