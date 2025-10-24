package com.skillswap.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record SessionNoteDTO(
        UUID id,
        UUID sessionId,
        UUID authorId,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
