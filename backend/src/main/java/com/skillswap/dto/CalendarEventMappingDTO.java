package com.skillswap.dto;

import com.skillswap.entity.CalendarProvider;

import java.time.LocalDateTime;
import java.util.UUID;

public record CalendarEventMappingDTO(
        UUID id,
        UUID sessionId,
        CalendarProvider provider,
        String providerEventId,
        String htmlLink,
        String icalUid,
        LocalDateTime lastSyncedAt
) {}
