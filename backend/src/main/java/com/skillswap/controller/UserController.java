package com.skillswap.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.dto.UserProfileDTO;
import com.skillswap.dto.UpdateUserRequest;
import com.skillswap.entity.User;
import com.skillswap.entity.UserSkills;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserSkillsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSkillsRepository userSkillsRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping("/me")
    public ResponseEntity<UserProfileDTO> me(@AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        UserSkills skills = userSkillsRepository.findByUserId(user.getId()).orElseThrow();
        return ResponseEntity.ok(mapToDTO(user, skills));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileDTO> update(@AuthenticationPrincipal UserDetails principal,
                                                 @jakarta.validation.Valid @RequestBody UpdateUserRequest req) throws JsonProcessingException {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        UserSkills skills = userSkillsRepository.findByUserId(user.getId()).orElseThrow();

        if (req.name() != null) user.setName(req.name());
        if (req.bio() != null) user.setBio(req.bio());
        if (req.profilePictureUrl() != null) user.setProfilePictureUrl(req.profilePictureUrl());

        if (req.skillsOffered() != null)
            skills.setSkillsOffered(objectMapper.writeValueAsString(req.skillsOffered()));
        if (req.skillsWanted() != null)
            skills.setSkillsWanted(objectMapper.writeValueAsString(req.skillsWanted()));
        if (req.availability() != null)
            skills.setAvailability(req.availability());

        userRepository.save(user);
        userSkillsRepository.save(skills);
        return ResponseEntity.ok(mapToDTO(user, skills));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileDTO> get(@PathVariable UUID id) {
        User user = userRepository.findById(id).orElseThrow();
        UserSkills skills = userSkillsRepository.findByUserId(user.getId()).orElseThrow();
        return ResponseEntity.ok(mapToDTO(user, skills));
    }

    private UserProfileDTO mapToDTO(User user, UserSkills skills) {
        return new UserProfileDTO(
                user.getId(), user.getName(), user.getEmail(), user.getBio(),
                user.getProfilePictureUrl(),
                parseSkills(skills.getSkillsOffered()),
                parseSkills(skills.getSkillsWanted()),
                skills.getAvailability(), skills.getRating(),
                user.getPoints(), user.getLevel(), skills.getCompletedSessions()
        );
    }

    private List<String> parseSkills(String json) {
        if (json == null || json.isEmpty() || json.equals("[]")) return List.of();
        return Arrays.stream(json.replace("[", "").replace("]", "").replace("\"", "").split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
