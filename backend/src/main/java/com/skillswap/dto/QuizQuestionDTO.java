package com.skillswap.dto;

import java.util.List;
import java.util.UUID;

public record QuizQuestionDTO(
        UUID id,
        String questionText,
        List<String> options
) {}
