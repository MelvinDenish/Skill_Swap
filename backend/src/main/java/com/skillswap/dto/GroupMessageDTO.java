package com.skillswap.dto;

import java.util.UUID;

public record GroupMessageDTO(
        UUID id,
        UUID groupId,
        UUID senderId,
        String senderName,
        String messageText,
        String createdAt
) {}
