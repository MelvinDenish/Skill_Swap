package com.skillswap.dto;

import com.skillswap.entity.MilestoneStatus;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record UpdateMilestoneRequest(
        @NotBlank String title,
        @Size(max = 2000) String description,
        LocalDate dueDate,
        MilestoneStatus status,
        @Min(0) @Max(100) Integer progress
) {}
