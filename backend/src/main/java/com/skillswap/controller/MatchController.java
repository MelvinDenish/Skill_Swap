package com.skillswap.controller;

import com.skillswap.dto.MatchDTO;
import com.skillswap.entity.User;
import com.skillswap.repository.UserRepository;
import com.skillswap.service.MatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/match")
public class MatchController {

    @Autowired
    private MatchingService matchingService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<MatchDTO>> myMatches(@AuthenticationPrincipal UserDetails principal) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(matchingService.findMatches(me.getId()));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<MatchDTO>> matchesFor(@PathVariable UUID userId) {
        return ResponseEntity.ok(matchingService.findMatches(userId));
    }
}
