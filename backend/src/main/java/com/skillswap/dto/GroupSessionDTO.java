package com.skillswap.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record GroupSessionDTO(
        UUID id,
        UUID groupId,
        LocalDateTime scheduledTime,
        Integer duration,
        String createdByName,
        String meetingLink,
        String videoRoom,
        String whiteboardRoom,
        String createdAt
) {}
