package com.skillswap.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.validation.constraints.*;

public record CreateSessionRequest(
        @NotNull UUID partnerId,
        @NotBlank @Size(max = 200) String skillTopic,
        @NotNull LocalDateTime scheduledTime,
        @NotNull @Min(15) @Max(240) Integer duration,
        @NotNull Boolean isTeacher
) {}
