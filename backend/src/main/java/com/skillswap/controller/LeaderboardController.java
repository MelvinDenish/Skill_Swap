package com.skillswap.controller;

import com.skillswap.dto.LeaderboardItemDTO;
import com.skillswap.entity.User;
import com.skillswap.entity.UserSkills;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserSkillsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSkillsRepository userSkillsRepository;

    @GetMapping
    public ResponseEntity<List<LeaderboardItemDTO>> top() {
        List<User> users = userRepository.findTop20ByOrderByPointsDesc();
        return ResponseEntity.ok(users.stream().map(u -> {
            UserSkills us = userSkillsRepository.findByUserId(u.getId()).orElse(null);
            double rating = us != null && us.getRating() != null ? us.getRating() : 0.0;
            int completed = us != null && us.getCompletedSessions() != null ? us.getCompletedSessions() : 0;
            return new LeaderboardItemDTO(
                    u.getId(), u.getName(), u.getProfilePictureUrl(),
                    u.getPoints(), u.getLevel(), rating, completed
            );
        }).toList());
    }
}
