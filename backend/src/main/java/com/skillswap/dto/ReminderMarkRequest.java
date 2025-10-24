package com.skillswap.dto;

import com.skillswap.entity.ReminderType;
import jakarta.validation.constraints.NotNull;

public record ReminderMarkRequest(
        @NotNull ReminderType type,
        Boolean sent,
        String error
) {}
