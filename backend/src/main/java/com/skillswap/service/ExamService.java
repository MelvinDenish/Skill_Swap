package com.skillswap.service;

import com.skillswap.dto.QuizQuestionDTO;
import com.skillswap.dto.SubmitQuizDTOs.AttemptDTO;
import com.skillswap.dto.SubmitQuizDTOs.LeaderboardEntryDTO;
import com.skillswap.dto.SubmitQuizDTOs.SubmitDetail;
import com.skillswap.dto.SubmitQuizDTOs.SubmitItem;
import com.skillswap.dto.SubmitQuizDTOs.SubmitQuizRequest;
import com.skillswap.dto.SubmitQuizDTOs.SubmitQuizResponse;
import com.skillswap.entity.ExamAttempt;
import com.skillswap.entity.ExamQuestion;
import com.skillswap.entity.MockInterview;
import com.skillswap.entity.QuizLeaderboard;
import com.skillswap.entity.User;
import com.skillswap.repository.ExamAttemptRepository;
import com.skillswap.repository.ExamQuestionRepository;
import com.skillswap.repository.MockInterviewRepository;
import com.skillswap.repository.QuizLeaderboardRepository;
import com.skillswap.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExamService {

    @Autowired private ExamQuestionRepository questionRepo;
    @Autowired private ExamAttemptRepository attemptRepo;
    @Autowired private QuizLeaderboardRepository leaderboardRepo;
    @Autowired private MockInterviewRepository mockRepo;
    @Autowired private UserRepository userRepo;

    @Value("${exam.cache.ttl-seconds:0}")
    private long cacheTtl;

    public List<QuizQuestionDTO> getQuestions(String skill, String difficulty, int count) {
        if (count <= 0) count = 10;
        List<ExamQuestion> list;
        if (skill == null || skill.isBlank()) {
            list = questionRepo.randomGlobal(count);
        } else if (difficulty == null || difficulty.isBlank() || "any".equalsIgnoreCase(difficulty)) {
            list = questionRepo.randomBySkill(skill, count);
        } else {
            list = questionRepo.randomBySkillAndDifficulty(skill, difficulty, count);
            if (list.isEmpty()) {
                list = questionRepo.randomBySkill(skill, count);
            }
        }
        return list.stream().map(this::toQuestionDtoShuffled).collect(Collectors.toList());
    }

    private QuizQuestionDTO toQuestionDtoShuffled(ExamQuestion q) {
        List<String> options = new ArrayList<>();
        try {
            String json = q.getOptionsJson();
            if (json != null && !json.isBlank()) {
                String cleaned = json.trim();
                if (cleaned.startsWith("[")) {
                    cleaned = cleaned.substring(1, cleaned.length()-1);
                }
                for (String part : cleaned.split(",")) {
                    String s = part.trim();
                    if (s.startsWith("\"") && s.endsWith("\"")) s = s.substring(1, s.length()-1);
                    if (!s.isBlank()) options.add(s);
                }
            }
        } catch (Exception ignored) {}
        Collections.shuffle(options);
        return new QuizQuestionDTO(q.getId(), q.getQuestionText(), options);
    }

    public SubmitQuizResponse submitQuiz(UUID userId, SubmitQuizRequest req) {
        User user = userRepo.findById(userId).orElseThrow();
        List<SubmitItem> items = req.items();
        if (items == null || items.isEmpty()) return new SubmitQuizResponse(0,0,0,List.of());
        int correct = 0;
        List<SubmitDetail> details = new ArrayList<>();
        for (SubmitItem it : items) {
            ExamQuestion q = questionRepo.findById(it.questionId()).orElseThrow();
            boolean isCorrect = q.getCorrectAnswer() != null && q.getCorrectAnswer().trim().equalsIgnoreCase(it.answer().trim());
            if (isCorrect) correct++;
            ExamAttempt a = new ExamAttempt();
            a.setUser(user);
            a.setQuestion(q);
            a.setUserAnswer(it.answer());
            a.setIsCorrect(isCorrect);
            a.setTimeSpent(it.timeSpent() == null ? 0 : it.timeSpent());
            a.setCreatedAt(LocalDateTime.now());
            attemptRepo.save(a);
            details.add(new SubmitDetail(q.getId(), isCorrect, q.getCorrectAnswer(), q.getExplanation()));
        }
        int total = items.size();
        int score = (int)Math.round(100.0 * correct / Math.max(1, total));
        // Update leaderboard per skill
        String skill = Optional.ofNullable(req.skill()).orElse("General");
        QuizLeaderboard lb = leaderboardRepo.findByUser_IdAndSkillIgnoreCase(userId, skill).orElseGet(() -> {
            QuizLeaderboard x = new QuizLeaderboard();
            x.setUser(user);
            x.setSkill(skill);
            x.setTotalScore(0);
            x.setQuizCount(0);
            x.setAverageScore(0.0);
            x.setStreak(0);
            return x;
        });
        int prevCount = Optional.ofNullable(lb.getQuizCount()).orElse(0);
        int prevTotal = Optional.ofNullable(lb.getTotalScore()).orElse(0);
        lb.setQuizCount(prevCount + 1);
        lb.setTotalScore(prevTotal + score);
        lb.setAverageScore((prevTotal + score) / (double)(prevCount + 1));
        // simple streak: if user attempted today already, keep; else set to 1 or increment if had attempt yesterday
        LocalDate today = LocalDate.now();
        LocalDateTime startToday = today.atStartOfDay();
        LocalDateTime startYesterday = today.minusDays(1).atStartOfDay();
        boolean hasToday = !attemptRepo.findByUser_IdAndCreatedAtBetween(userId, startToday, startToday.plusDays(1)).isEmpty();
        if (hasToday) {
            // leave streak as is
        } else {
            boolean hasYesterday = !attemptRepo.findByUser_IdAndCreatedAtBetween(userId, startYesterday, startToday).isEmpty();
            int streak = Optional.ofNullable(lb.getStreak()).orElse(0);
            lb.setStreak(hasYesterday ? streak + 1 : 1);
        }
        leaderboardRepo.save(lb);
        return new SubmitQuizResponse(total, correct, score, details);
    }

    public List<LeaderboardEntryDTO> leaderboard(String skill) {
        List<QuizLeaderboard> list;
        if (skill != null && !skill.isBlank()) {
            list = leaderboardRepo.findTop20BySkillIgnoreCaseOrderByTotalScoreDesc(skill);
        } else {
            list = leaderboardRepo.findTop20ByOrderByTotalScoreDesc();
        }
        return list.stream().map(lb -> new LeaderboardEntryDTO(
                lb.getUser().getId(),
                lb.getUser().getName(),
                lb.getUser().getProfilePictureUrl(),
                Optional.ofNullable(lb.getTotalScore()).orElse(0),
                Optional.ofNullable(lb.getQuizCount()).orElse(0),
                Optional.ofNullable(lb.getAverageScore()).orElse(0.0),
                lb.getRank(),
                Optional.ofNullable(lb.getStreak()).orElse(0)
        )).collect(Collectors.toList());
    }

    public Page<AttemptDTO> attempts(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), Sort.by(Sort.Direction.DESC, "createdAt"));
        return attemptRepo.findByUser_IdOrderByCreatedAtDesc(userId, pageable).map(a -> new AttemptDTO(
                a.getId(), a.getQuestion().getId(), a.getQuestion().getSkill(), a.getQuestion().getDifficultyLevel(),
                a.getUserAnswer(), Boolean.TRUE.equals(a.getIsCorrect()), a.getTimeSpent(),
                a.getCreatedAt() == null ? null : DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(a.getCreatedAt())
        ));
    }

    public List<QuizQuestionDTO> dailyChallenge() {
        List<ExamQuestion> pool = questionRepo.randomGlobal(5);
        return pool.stream().map(this::toQuestionDtoShuffled).toList();
    }

    public MockInterview scheduleMock(UUID requesterId, UUID otherId, String skillTopic, String interviewType, LocalDateTime time) {
        User u1 = userRepo.findById(requesterId).orElseThrow();
        User u2 = userRepo.findById(otherId).orElseThrow();
        MockInterview mi = new MockInterview();
        mi.setUser1(u1);
        mi.setUser2(u2);
        mi.setSkillTopic(skillTopic);
        mi.setInterviewType(interviewType);
        mi.setScheduledTime(time);
        mi.setCreatedAt(LocalDateTime.now());
        return mockRepo.save(mi);
    }

    public void feedback(UUID interviewId, UUID byUserId, String feedback) {
        MockInterview mi = mockRepo.findById(interviewId).orElseThrow();
        // Only user1 (interviewer) can set feedback
        if (!mi.getUser1().getId().equals(byUserId)) throw new SecurityException("Only interviewer can submit feedback");
        mi.setFeedbackFromInterviewer(feedback);
        mockRepo.save(mi);
    }
}
