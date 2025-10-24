package com.skillswap.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record CreateResourceLinkRequest(
        @NotBlank String title,
        @NotBlank String url,
        String description,
        UUID sessionId,
        String skillName
) {}
