package com.skillswap.controller;

import com.skillswap.dto.*;
import com.skillswap.entity.User;
import com.skillswap.entity.UserSkills;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserSkillsRepository;
import com.skillswap.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSkillsRepository userSkillsRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setProfilePictureUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=" + request.name());
        userRepository.save(user);

        UserSkills skills = new UserSkills();
        skills.setUser(user);
        skills.setSkillsOffered("[]");
        skills.setSkillsWanted("[]");
        userSkillsRepository.save(skills);

        String token = jwtUtil.generateToken(user.getEmail());
        ResponseCookie cookie = ResponseCookie.from("SS_TOKEN", token)
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(7))
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new LoginResponse(token, mapToDTO(user, skills)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        UserSkills skills = userSkillsRepository.findByUserId(user.getId()).orElseThrow();
        String token = jwtUtil.generateToken(user.getEmail());
        ResponseCookie cookie = ResponseCookie.from("SS_TOKEN", token)
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(7))
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new LoginResponse(token, mapToDTO(user, skills)));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("SS_TOKEN", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verify(HttpServletRequest request) {
        String token = null;
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7);
        } else if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie c : request.getCookies()) {
                if ("SS_TOKEN".equals(c.getName())) {
                    token = c.getValue();
                    break;
                }
            }
        }

        if (token != null && jwtUtil.validateToken(token)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(401).body("Invalid or expired token");
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

