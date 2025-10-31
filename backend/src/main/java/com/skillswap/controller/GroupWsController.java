package com.skillswap.controller;

import com.skillswap.dto.GroupMessageDTO;
import com.skillswap.entity.User;
import com.skillswap.repository.UserRepository;
import com.skillswap.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@Controller
public class GroupWsController {

    @Autowired private GroupService groupService;
    @Autowired private UserRepository userRepository;
    @Autowired(required = false) private SimpMessagingTemplate messagingTemplate;

    public static class SendPayload { public String text; }

    @MessageMapping("/group/{groupId}/send")
    public void send(@DestinationVariable String groupId, @Payload SendPayload payload, Principal principal) {
        if (messagingTemplate == null) return;
        if (principal == null) return;
        User me = userRepository.findByEmail(principal.getName()).orElseThrow();
        GroupMessageDTO dto = groupService.postMessage(UUID.fromString(groupId), me.getId(), payload.text);
        messagingTemplate.convertAndSend("/topic/group/" + groupId, dto);
    }

    @MessageMapping("/group/{groupId}/typing")
    public void typing(@DestinationVariable String groupId, Principal principal) {
        if (messagingTemplate == null) return;
        String name = principal == null ? "Someone" : principal.getName();
        messagingTemplate.convertAndSend("/topic/group/" + groupId + "/typing", Map.of("user", name));
    }
}
