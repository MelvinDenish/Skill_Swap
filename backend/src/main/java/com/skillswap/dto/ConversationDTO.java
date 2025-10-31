package com.skillswap.dto;

import java.util.UUID;

public record ConversationDTO(
        UUID id,
        UUID otherUserId,
        String otherUserName,
        String otherUserAvatar,
        String lastMessageTime,
        long unreadCount
) {}
