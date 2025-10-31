package com.skillswap.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiAskRequest(
        @NotBlank @Size(max = 2000) String question,
        @Size(max = 100) String skill
) {}
