package com.skillswap.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record UserProfileDTO(
        UUID id,
        String name,
        String email,
        String bio,
        String profilePictureUrl,
        List<String> skillsOffered,
        List<String> skillsWanted,
        String availability,
        Double rating,
        Integer points,
        String level,
        Integer completedSessions
) {}
