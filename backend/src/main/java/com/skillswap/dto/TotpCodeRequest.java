package com.skillswap.dto;

import jakarta.validation.constraints.NotBlank;

public record TotpCodeRequest(
        @NotBlank String code
) {}
