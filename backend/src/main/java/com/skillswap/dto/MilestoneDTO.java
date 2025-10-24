package com.skillswap.dto;

import com.skillswap.entity.MilestoneStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record MilestoneDTO(
        UUID id,
        String skillName,
        String title,
        String description,
        LocalDate dueDate,
        MilestoneStatus status,
        Integer progress,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
