package com.skillswap.service;

import com.skillswap.dto.MatchDTO;
import com.skillswap.entity.User;
import com.skillswap.entity.UserSkills;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserSkillsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MatchingService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSkillsRepository userSkillsRepository;

    public List<MatchDTO> findMatches(UUID currentUserId) {
        User currentUser = userRepository.findById(currentUserId).orElseThrow();
        UserSkills currentSkills = userSkillsRepository.findByUserId(currentUserId).orElseThrow();

        List<String> myOffered = parseSkills(currentSkills.getSkillsOffered());
        List<String> myWanted = parseSkills(currentSkills.getSkillsWanted());

        List<User> allUsers = userRepository.findAll();
        List<MatchDTO> matches = new ArrayList<>();

        for (User otherUser : allUsers) {
            if (otherUser.getId().equals(currentUserId)) continue;

            UserSkills otherSkills = userSkillsRepository.findByUserId(otherUser.getId()).orElse(null);
            if (otherSkills == null) continue;

            List<String> theirOffered = parseSkills(otherSkills.getSkillsOffered());
            List<String> theirWanted = parseSkills(otherSkills.getSkillsWanted());

            // Find matching skills
            List<String> theyCanTeachMe = theirOffered.stream()
                    .filter(s -> myWanted.stream().anyMatch(w -> w.equalsIgnoreCase(s)))
                    .map(String::trim)
                    .distinct()
                    .toList();

            List<String> iCanTeachThem = myOffered.stream()
                    .filter(s -> theirWanted.stream().anyMatch(w -> w.equalsIgnoreCase(s)))
                    .map(String::trim)
                    .distinct()
                    .toList();

            if (theyCanTeachMe.isEmpty() && iCanTeachThem.isEmpty()) continue;

            // Calculate match score
            int score = 60; // Base score
            score += (theyCanTeachMe.size() + iCanTeachThem.size()) * 10;
            if (Optional.ofNullable(otherSkills.getRating()).orElse(0.0) >= 4.0) score += 20;
            if (Optional.ofNullable(otherSkills.getCompletedSessions()).orElse(0) >= 5) score += 10;
            score = Math.min(score, 100);

            matches.add(new MatchDTO(
                    otherUser.getId(),
                    otherUser.getName(),
                    otherUser.getProfilePictureUrl(),
                    theyCanTeachMe,
                    iCanTeachThem,
                    score,
                    Optional.ofNullable(otherSkills.getRating()).orElse(0.0),
                    Optional.ofNullable(otherSkills.getCompletedSessions()).orElse(0)
            ));
        }

        return matches.stream()
                .sorted((a, b) -> b.matchScore().compareTo(a.matchScore()))
                .limit(10)
                .toList();
    }

    private List<String> parseSkills(String skillsJson) {
        if (skillsJson == null || skillsJson.isEmpty()) return List.of();
        String cleaned = skillsJson.replace("[", "").replace("]", "").replace("\"", "");
        if (cleaned.isBlank()) return List.of();
        return Arrays.stream(cleaned.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
