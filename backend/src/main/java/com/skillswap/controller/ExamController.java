package com.skillswap.controller;

import com.skillswap.dto.QuizQuestionDTO;
import com.skillswap.dto.SubmitQuizDTOs.*;
import com.skillswap.entity.MockInterview;
import com.skillswap.entity.User;
import com.skillswap.repository.UserRepository;
import com.skillswap.service.ExamService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@ConditionalOnProperty(prefix = "features.exams", name = "enabled", havingValue = "true", matchIfMissing = false)
@RequestMapping("/api/exams")
public class ExamController {

    @Autowired private ExamService examService;
    @Autowired private UserRepository userRepository;

    @GetMapping("/questions")
    public ResponseEntity<List<QuizQuestionDTO>> questions(
            @RequestParam String skill,
            @RequestParam(required = false) String difficulty,
            @RequestParam(defaultValue = "10") int count
    ) {
        return ResponseEntity.ok(examService.getQuestions(skill, difficulty, count));
    }

    @PostMapping("/submit")
    public ResponseEntity<SubmitQuizResponse> submit(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody SubmitQuizRequest req
    ) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(examService.submitQuiz(me.getId(), req));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntryDTO>> leaderboard(@RequestParam(required = false) String skill) {
        return ResponseEntity.ok(examService.leaderboard(skill));
    }

    @GetMapping("/attempts")
    public ResponseEntity<Page<AttemptDTO>> attempts(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(examService.attempts(me.getId(), page, size));
    }

    @GetMapping("/daily-challenge")
    public ResponseEntity<List<QuizQuestionDTO>> daily() {
        return ResponseEntity.ok(examService.dailyChallenge());
    }

    public record ScheduleMockRequest(UUID otherUserId, String skillTopic, String interviewType, String scheduledTime) {}

    @PostMapping("/mock/schedule")
    public ResponseEntity<MockInterview> scheduleMock(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ScheduleMockRequest req
    ) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        LocalDateTime time = LocalDateTime.parse(req.scheduledTime());
        MockInterview mi = examService.scheduleMock(me.getId(), req.otherUserId(), req.skillTopic(), req.interviewType(), time);
        return ResponseEntity.ok(mi);
    }

    public record FeedbackRequest(String feedback) {}

    @PostMapping("/mock/{id}/feedback")
    public ResponseEntity<Void> feedback(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id,
            @Valid @RequestBody FeedbackRequest req
    ) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        examService.feedback(id, me.getId(), req.feedback());
        return ResponseEntity.noContent().build();
    }
}
