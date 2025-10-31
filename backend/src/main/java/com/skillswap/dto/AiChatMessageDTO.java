package com.skillswap.dto;

import java.util.UUID;

public record AiChatMessageDTO(
        UUID id,
        String question,
        String answer,
        String skill,
        String createdAt
) {}
