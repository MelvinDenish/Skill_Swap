package com.skillswap.dto;

import java.util.UUID;

public record GroupMemberDTO(
        UUID userId,
        String name,
        String role
) {}
