package com.skillswap.dto;

import java.util.UUID;

public record MessageDTO(
        UUID id,
        UUID conversationId,
        UUID senderId,
        String messageText,
        boolean isRead,
        String createdAt,
        String readAt
) {}
