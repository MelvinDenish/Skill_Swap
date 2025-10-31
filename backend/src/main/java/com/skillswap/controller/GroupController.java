package com.skillswap.controller;

import com.skillswap.dto.CreateGroupRequest;
import com.skillswap.dto.GroupDTO;
import com.skillswap.dto.GroupMessageDTO;
import com.skillswap.dto.GroupSessionDTO;
import com.skillswap.entity.User;
import com.skillswap.repository.UserRepository;
import com.skillswap.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import com.skillswap.dto.GroupMemberDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    @Autowired private GroupService groupService;
    @Autowired private UserRepository userRepository;
    @Autowired(required = false) private SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public ResponseEntity<GroupDTO> create(@AuthenticationPrincipal UserDetails principal,
                                           @Valid @RequestBody CreateGroupRequest req) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        GroupDTO dto = groupService.create(me.getId(), req.name(), req.description(), req.relatedSkill(),
                req.maxMembers() == null ? 10 : req.maxMembers(),
                req.isPrivate() != null && req.isPrivate());
        return ResponseEntity.ok(dto);
    }

    @GetMapping
    public ResponseEntity<Page<GroupDTO>> list(@RequestParam(required = false) String skill,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "20") int size) {
        Page<GroupDTO> p = groupService.list(skill, page, size);
        return ResponseEntity.ok(p);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupDTO> get(@PathVariable UUID id) {
        return ResponseEntity.ok(groupService.get(id));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Void> join(@AuthenticationPrincipal UserDetails principal, @PathVariable UUID id) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        groupService.join(id, me.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leave(@AuthenticationPrincipal UserDetails principal, @PathVariable UUID id) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        groupService.leave(id, me.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserDetails principal, @PathVariable UUID id) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        groupService.delete(id, me.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<GroupMessageDTO>> recent(@PathVariable UUID id) {
        return ResponseEntity.ok(groupService.recentMessages(id));
    }

    public record SendMessageRequest(String text) {}

    @PostMapping("/{id}/messages")
    public ResponseEntity<GroupMessageDTO> send(@AuthenticationPrincipal UserDetails principal,
                                                @PathVariable UUID id,
                                                @RequestBody SendMessageRequest req) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        GroupMessageDTO dto = groupService.postMessage(id, me.getId(), req.text());
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/group/" + id, dto);
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<java.util.List<GroupMemberDTO>> members(@PathVariable UUID id) {
        return ResponseEntity.ok(groupService.listMembers(id));
    }

    @GetMapping("/{id}/resources")
    public ResponseEntity<java.util.List<com.skillswap.dto.ResourceItemDTO>> resources(@PathVariable UUID id) {
        return ResponseEntity.ok(groupService.listResources(id));
    }

    public record ShareResourceRequest(UUID resourceId) {}

    @PostMapping("/{id}/resources/share")
    public ResponseEntity<Void> share(@AuthenticationPrincipal UserDetails principal,
                                      @PathVariable UUID id,
                                      @RequestBody ShareResourceRequest req) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        groupService.shareResource(id, req.resourceId(), me.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/sessions")
    public ResponseEntity<java.util.List<GroupSessionDTO>> sessions(@PathVariable UUID id) {
        return ResponseEntity.ok(groupService.listSessions(id));
    }

    public record ScheduleRequest(String scheduledTime, Integer duration) {}

    @PostMapping("/{id}/sessions")
    public ResponseEntity<GroupSessionDTO> schedule(@AuthenticationPrincipal UserDetails principal,
                                                    @PathVariable UUID id,
                                                    @RequestBody ScheduleRequest req) {
        User me = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        LocalDateTime time = LocalDateTime.parse(req.scheduledTime());
        GroupSessionDTO dto = groupService.scheduleSession(id, time, req.duration(), me.getId());
        return ResponseEntity.ok(dto);
    }
}
