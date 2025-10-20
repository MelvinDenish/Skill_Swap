package com.skillswap.dto;

import java.util.List;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Size(min = 2, max = 100) String name,
        @Size(max = 500) String bio,
        @Size(max = 500) String profilePictureUrl,
        @Size(max = 50) List<String> skillsOffered,
        @Size(max = 50) List<String> skillsWanted,
        @Size(max = 100) String availability
) {}
