package com.skillswap.dto;

import com.skillswap.entity.ReminderType;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReminderLogDTO(
        UUID id,
        UUID sessionId,
        ReminderType type,
        Boolean sent,
        LocalDateTime sentAt,
        LocalDateTime createdAt,
        String error
) {}
