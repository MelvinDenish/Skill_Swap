package com.skillswap.controller;

import com.skillswap.dto.*;
import com.skillswap.entity.Milestone;
import com.skillswap.entity.User;
import com.skillswap.repository.MilestoneRepository;
import com.skillswap.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/milestones")
public class MilestoneController {

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<MilestoneDTO>> list(@AuthenticationPrincipal UserDetails principal) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        List<MilestoneDTO> out = milestoneRepository.findByUserId(me.getId()).stream().map(this::toDTO).toList();
        return ResponseEntity.ok(out);
    }

    @GetMapping("/skill/{skill}")
    public ResponseEntity<List<MilestoneDTO>> listBySkill(@AuthenticationPrincipal UserDetails principal,
                                                          @PathVariable String skill) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        List<MilestoneDTO> out = milestoneRepository.findByUserIdAndSkill(me.getId(), skill).stream().map(this::toDTO).toList();
        return ResponseEntity.ok(out);
    }

    @PostMapping
    public ResponseEntity<MilestoneDTO> create(@AuthenticationPrincipal UserDetails principal,
                                               @Valid @RequestBody CreateMilestoneRequest req) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Milestone m = new Milestone();
        m.setUser(me);
        m.setSkillName(req.skillName());
        m.setTitle(req.title());
        m.setDescription(req.description());
        m.setDueDate(req.dueDate());
        m.setProgress(req.progress() == null ? 0 : req.progress());
        Milestone saved = milestoneRepository.save(m);
        return ResponseEntity.ok(toDTO(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MilestoneDTO> update(@AuthenticationPrincipal UserDetails principal,
                                               @PathVariable UUID id,
                                               @Valid @RequestBody UpdateMilestoneRequest req) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Milestone m = milestoneRepository.findById(id).orElseThrow();
        if (!m.getUser().getId().equals(me.getId())) return ResponseEntity.status(403).build();
        m.setTitle(req.title());
        m.setDescription(req.description());
        m.setDueDate(req.dueDate());
        if (req.status() != null) m.setStatus(req.status());
        if (req.progress() != null) m.setProgress(req.progress());
        Milestone saved = milestoneRepository.save(m);
        return ResponseEntity.ok(toDTO(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserDetails principal,
                                       @PathVariable UUID id) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Milestone m = milestoneRepository.findById(id).orElseThrow();
        if (!m.getUser().getId().equals(me.getId())) return ResponseEntity.status(403).build();
        milestoneRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private MilestoneDTO toDTO(Milestone m) {
        return new MilestoneDTO(m.getId(), m.getSkillName(), m.getTitle(), m.getDescription(), m.getDueDate(), m.getStatus(), m.getProgress(), m.getCreatedAt(), m.getUpdatedAt());
    }
}
