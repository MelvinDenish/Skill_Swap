package com.skillswap.error;

public class RateLimitException extends RuntimeException {
    public RateLimitException(String message) { super(message); }
}
