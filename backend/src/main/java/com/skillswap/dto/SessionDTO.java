package com.skillswap.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record SessionDTO(
        UUID id,
        UUID partnerId,
        String partnerName,
        String partnerProfilePicture,
        String skillTopic,
        LocalDateTime scheduledTime,
        Integer duration,
        String status,
        String meetingLink,
        Boolean isTeacher
) {}
