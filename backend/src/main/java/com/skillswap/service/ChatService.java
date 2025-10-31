package com.skillswap.service;

import com.skillswap.dto.ConversationDTO;
import com.skillswap.dto.MessageDTO;
import com.skillswap.entity.Conversation;
import com.skillswap.entity.Message;
import com.skillswap.entity.User;
import com.skillswap.repository.ConversationRepository;
import com.skillswap.repository.MessageRepository;
import com.skillswap.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ChatService {

    @Autowired private ConversationRepository conversationRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private UserRepository userRepository;
    @Autowired(required = false) private SimpMessagingTemplate messagingTemplate;

    private String pairKey(UUID a, UUID b) {
        String s1 = a.toString();
        String s2 = b.toString();
        return s1.compareTo(s2) < 0 ? s1 + "#" + s2 : s2 + "#" + s1;
    }

    public ConversationDTO startOrGet(UUID meId, UUID otherId) {
        User me = userRepository.findById(meId).orElseThrow();
        User other = userRepository.findById(otherId).orElseThrow();
        String key = pairKey(me.getId(), other.getId());
        Optional<Conversation> existing = conversationRepository.findByPairKey(key);
        Conversation conv = existing.orElseGet(() -> {
            Conversation c = new Conversation();
            c.setUser1(me);
            c.setUser2(other);
            c.setPairKey(key);
            return conversationRepository.save(c);
        });
        return toDto(conv, me);
    }

    public List<ConversationDTO> listForUser(UUID meId) {
        User me = userRepository.findById(meId).orElseThrow();
        List<Conversation> list = conversationRepository.findByUser1_IdOrUser2_IdOrderByLastMessageTimeDesc(me.getId(), me.getId());
        return list.stream().map(c -> toDto(c, me)).toList();
    }

    public Page<MessageDTO> messages(UUID convId, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), Sort.by(Sort.Direction.DESC, "createdAt"));
        return messageRepository.findByConversation_IdOrderByCreatedAtDesc(convId, pageable).map(this::toDto);
    }

    public MessageDTO send(UUID convId, UUID senderId, String text) {
        Conversation conv = conversationRepository.findById(convId).orElseThrow();
        if (text == null || text.isBlank()) throw new IllegalArgumentException("Message cannot be empty");
        User sender = userRepository.findById(senderId).orElseThrow();
        if (!conv.getUser1().getId().equals(senderId) && !conv.getUser2().getId().equals(senderId)) {
            throw new SecurityException("Not part of conversation");
        }
        Message m = new Message();
        m.setConversation(conv);
        m.setSender(sender);
        m.setMessageText(text.trim());
        m = messageRepository.save(m);
        conv.setLastMessageTime(java.time.LocalDateTime.now());
        conversationRepository.save(conv);

        UUID recipient = conv.getUser1().getId().equals(senderId) ? conv.getUser2().getId() : conv.getUser1().getId();
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/queue/user/" + recipient, toDto(m));
        }
        return toDto(m);
    }

    public void markRead(UUID convId, UUID meId) {
        Conversation conv = conversationRepository.findById(convId).orElseThrow();
        if (!conv.getUser1().getId().equals(meId) && !conv.getUser2().getId().equals(meId)) {
            throw new SecurityException("Not part of conversation");
        }
        // naive mark: fetch last 100 and mark unread from other as read
        Page<Message> page = messageRepository.findByConversation_IdOrderByCreatedAtDesc(convId, PageRequest.of(0, 100));
        page.getContent().forEach(m -> {
            if (!m.getSender().getId().equals(meId) && (m.getIsRead() == null || !m.getIsRead())) {
                m.setIsRead(true);
                m.setReadAt(java.time.LocalDateTime.now());
            }
        });
        messageRepository.saveAll(page.getContent());
    }

    public long unreadCount(UUID convId, UUID meId) {
        return messageRepository.countUnread(convId, meId);
    }

    private ConversationDTO toDto(Conversation c, User me) {
        User other = c.getUser1().getId().equals(me.getId()) ? c.getUser2() : c.getUser1();
        return new ConversationDTO(
                c.getId(),
                other.getId(),
                other.getName(),
                other.getProfilePictureUrl(),
                c.getLastMessageTime() == null ? null : DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(c.getLastMessageTime()),
                messageRepository.countUnread(c.getId(), me.getId())
        );
    }

    private MessageDTO toDto(Message m) {
        return new MessageDTO(
                m.getId(),
                m.getConversation().getId(),
                m.getSender().getId(),
                m.getMessageText(),
                Boolean.TRUE.equals(m.getIsRead()),
                m.getCreatedAt() == null ? null : DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(m.getCreatedAt()),
                m.getReadAt() == null ? null : DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(m.getReadAt())
        );
    }
}
