package com.skillswap.dto;

import java.util.UUID;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewDTO(
        @NotNull UUID sessionId,
        @NotNull @Min(1) @Max(5) Integer rating,
        @Size(max = 1000) String comment
) {}
