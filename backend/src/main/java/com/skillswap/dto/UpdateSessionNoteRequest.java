package com.skillswap.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateSessionNoteRequest(
        @NotBlank String content
) {}
