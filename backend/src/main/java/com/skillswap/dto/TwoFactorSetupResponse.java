package com.skillswap.dto;

public record TwoFactorSetupResponse(
        String secret,
        String otpauthUrl
) {}
