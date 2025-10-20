package com.skillswap.dto;

import java.util.List;
import java.util.UUID;

public record MatchDTO(
        UUID userId,
        String name,
        String profilePictureUrl,
        List<String> matchingSkillsTheyOffer,
        List<String> matchingSkillsYouOffer,
        Integer matchScore,
        Double rating,
        Integer completedSessions
) {}
