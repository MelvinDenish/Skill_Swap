package com.skillswap.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record CreateMilestoneRequest(
        @NotBlank String skillName,
        @NotBlank String title,
        @Size(max = 2000) String description,
        LocalDate dueDate,
        @Min(0) @Max(100) Integer progress
) {}
