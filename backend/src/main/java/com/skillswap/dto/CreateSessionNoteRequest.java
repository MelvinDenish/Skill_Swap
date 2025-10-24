package com.skillswap.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSessionNoteRequest(
        @NotBlank String content
) {}
