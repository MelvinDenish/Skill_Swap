package com.skillswap.repository;

import com.skillswap.entity.QuizLeaderboard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuizLeaderboardRepository extends JpaRepository<QuizLeaderboard, UUID> {
    Optional<QuizLeaderboard> findByUser_IdAndSkillIgnoreCase(UUID userId, String skill);
    List<QuizLeaderboard> findTop20BySkillIgnoreCaseOrderByRankAsc(String skill);
    List<QuizLeaderboard> findTop20BySkillIgnoreCaseOrderByTotalScoreDesc(String skill);
    List<QuizLeaderboard> findTop20ByOrderByTotalScoreDesc();
}
