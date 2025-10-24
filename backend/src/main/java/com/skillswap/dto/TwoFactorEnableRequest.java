package com.skillswap.dto;

import jakarta.validation.constraints.NotBlank;

public record TwoFactorEnableRequest(
        @NotBlank String secret,
        @NotBlank String code
) {}
