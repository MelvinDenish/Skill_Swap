package com.skillswap.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "quiz_leaderboard")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizLeaderboard {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String skill;

    private Integer totalScore = 0;

    private Integer quizCount = 0;

    @Column(name = "average_score")
    private Double averageScore = 0.0;

    private Integer rank;

    private Integer streak = 0;
}
