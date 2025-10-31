package com.skillswap.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public class SubmitQuizDTOs {
    public record SubmitItem(@NotNull UUID questionId, @NotBlank String answer, Integer timeSpent) {}
    public record SubmitQuizRequest(@NotBlank String skill, String difficulty, @NotNull List<SubmitItem> items) {}
    public record SubmitDetail(UUID questionId, boolean correct, String correctAnswer, String explanation) {}
    public record SubmitQuizResponse(int total, int correct, int score, List<SubmitDetail> details) {}
    public record AttemptDTO(UUID id, UUID questionId, String skill, String difficulty, String userAnswer, boolean isCorrect, Integer timeSpent, String createdAt) {}
    public record LeaderboardEntryDTO(UUID userId, String name, String avatar, int totalScore, int quizCount, double averageScore, Integer rank, Integer streak) {}
}
