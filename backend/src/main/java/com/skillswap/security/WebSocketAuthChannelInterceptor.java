package com.skillswap.security;

import com.skillswap.repository.GroupMemberRepository;
import com.skillswap.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired(required = false)
    private GroupMemberRepository groupMemberRepository;

    @Autowired(required = false)
    private UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && (StompCommand.CONNECT.equals(accessor.getCommand()) || StompCommand.SUBSCRIBE.equals(accessor.getCommand()))) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            String token = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
            if (token == null) {
                token = accessor.getFirstNativeHeader("token");
            }
            if (token != null && jwtUtil.validateToken(token)) {
                String email = jwtUtil.extractEmail(token);
                UserDetails ud = userDetailsService.loadUserByUsername(email);
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(ud.getUsername(), null, ud.getAuthorities());
                accessor.setUser(auth);
            }
            if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                String dest = accessor.getDestination();
                if (dest != null && dest.startsWith("/topic/group/") && groupMemberRepository != null) {
                    try {
                        String rest = dest.substring("/topic/group/".length());
                        String idOnly = rest.contains("/") ? rest.substring(0, rest.indexOf('/')) : rest;
                        UUID gid = UUID.fromString(idOnly);
                        String name = accessor.getUser() == null ? null : accessor.getUser().getName();
                        if (name != null) {
                            boolean allowed = groupMemberRepository.existsByGroupIdAndUserEmail(gid, name);
                            if (!allowed) return null;
                        } else {
                            return null;
                        }
                    } catch (Exception e) {
                        return null;
                    }
                }
                if (dest != null && dest.startsWith("/queue/user/")) {
                    try {
                        String idStr = dest.substring("/queue/user/".length());
                        java.util.UUID uid = java.util.UUID.fromString(idStr);
                        String principalEmail = accessor.getUser() == null ? null : accessor.getUser().getName();
                        if (principalEmail == null || userRepository == null) return null;
                        var me = userRepository.findByEmail(principalEmail).orElse(null);
                        if (me == null || !me.getId().equals(uid)) return null;
                    } catch (Exception e) {
                        return null;
                    }
                }
            }
        }
        return message;
    }
}
