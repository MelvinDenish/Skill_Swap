package com.skillswap.service;

import com.skillswap.dto.GroupDTO;
import com.skillswap.dto.GroupMessageDTO;
import com.skillswap.dto.GroupMemberDTO;
import com.skillswap.entity.*;
import com.skillswap.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import com.skillswap.dto.GroupSessionDTO;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GroupService {

    @Autowired private StudyGroupRepository groupRepo;
    @Autowired private GroupMemberRepository memberRepo;
    @Autowired private GroupMessageRepository messageRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private GroupSessionRepository groupSessionRepo;
    @Autowired private GroupResourceLinkRepository groupResourceRepo;
    @Autowired private ResourceItemRepository resourceItemRepo;

    public GroupDTO create(UUID creatorId, String name, String description, String relatedSkill, int maxMembers, boolean isPrivate) {
        User creator = userRepo.findById(creatorId).orElseThrow();
        StudyGroup g = new StudyGroup();
        g.setName(name);
        g.setDescription(description);
        g.setRelatedSkill(relatedSkill);
        g.setCreator(creator);
        g.setMaxMembers(maxMembers);
        g.setIsPrivate(isPrivate);
        g.setMemberCount(1);
        g = groupRepo.save(g);

        GroupMember gm = new GroupMember();
        gm.setGroup(g);
        gm.setUser(creator);
        gm.setRole(GroupRole.ADMIN);
        memberRepo.save(gm);
        return toDto(g);
    }

    @Transactional(readOnly = true)
    public Page<GroupDTO> list(String skill, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), Sort.by(Sort.Direction.DESC, "memberCount"));
        Page<StudyGroup> p = (skill == null || skill.isBlank()) ? groupRepo.findAll(pageable) : groupRepo.findByRelatedSkillIgnoreCaseContaining(skill, pageable);
        return p.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public GroupDTO get(UUID id) {
        return toDto(groupRepo.findById(id).orElseThrow());
    }

    public void join(UUID groupId, UUID userId) {
        StudyGroup g = groupRepo.findById(groupId).orElseThrow();
        if (memberRepo.existsByGroup_IdAndUser_Id(groupId, userId)) return;
        if (g.getMemberCount() >= g.getMaxMembers()) throw new IllegalStateException("Group is full");
        User u = userRepo.findById(userId).orElseThrow();
        GroupMember gm = new GroupMember();
        gm.setGroup(g);
        gm.setUser(u);
        gm.setRole(GroupRole.MEMBER);
        memberRepo.save(gm);
        g.setMemberCount(g.getMemberCount() + 1);
        groupRepo.save(g);
    }

    public void leave(UUID groupId, UUID userId) {
        StudyGroup g = groupRepo.findById(groupId).orElseThrow();
        List<GroupMember> members = memberRepo.findAll().stream().filter(m -> m.getGroup().getId().equals(groupId) && m.getUser().getId().equals(userId)).toList();
        if (members.isEmpty()) return;
        memberRepo.deleteAll(members);
        g.setMemberCount(Math.max(0, g.getMemberCount() - members.size()));
        groupRepo.save(g);
    }

    public void delete(UUID groupId, UUID requesterId) {
        StudyGroup g = groupRepo.findById(groupId).orElseThrow();
        boolean isAdmin = memberRepo.findAll().stream().anyMatch(m -> m.getGroup().getId().equals(groupId) && m.getUser().getId().equals(requesterId) && m.getRole() == GroupRole.ADMIN);
        if (!isAdmin) throw new SecurityException("Only admins can delete the group");
        groupRepo.deleteById(groupId);
    }

    @Transactional(readOnly = true)
    public List<GroupMessageDTO> recentMessages(UUID groupId) {
        Pageable top50 = PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt"));
        var list = messageRepo.findRecentByGroupIdWithSender(groupId, top50);
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    public GroupMessageDTO postMessage(UUID groupId, UUID senderId, String text) {
        StudyGroup g = groupRepo.findById(groupId).orElseThrow();
        if (!memberRepo.existsByGroup_IdAndUser_Id(groupId, senderId)) throw new SecurityException("Not a member");
        User u = userRepo.findById(senderId).orElseThrow();
        GroupMessage m = new GroupMessage();
        m.setGroup(g);
        m.setSender(u);
        m.setMessageText(text);
        try { m.setContent(text); } catch (NoSuchMethodError ignored) {}
        m = messageRepo.save(m);
        return toDto(m);
    }

    public GroupDTO toDto(StudyGroup g) {
        return new GroupDTO(
                g.getId(), g.getName(), g.getDescription(), g.getRelatedSkill(),
                g.getCreator() != null ? g.getCreator().getName() : null,
                g.getMemberCount() == null ? 0 : g.getMemberCount(),
                g.getMaxMembers() == null ? 10 : g.getMaxMembers(),
                Boolean.TRUE.equals(g.getIsPrivate()),
                g.getIconUrl(),
                g.getCreatedAt() == null ? null : DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(g.getCreatedAt())
        );
    }

    public GroupMessageDTO toDto(GroupMessage m) {
        String text = m.getMessageText();
        try { if ((text == null || text.isBlank()) && m.getContent() != null) text = m.getContent(); } catch (NoSuchMethodError ignored) {}
        return new GroupMessageDTO(
                m.getId(),
                m.getGroup().getId(),
                m.getSender().getId(),
                m.getSender().getName(),
                text,
                m.getCreatedAt() == null ? null : DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(m.getCreatedAt())
        );
    }

    @Transactional(readOnly = true)
    public java.util.List<GroupMemberDTO> listMembers(UUID groupId) {
        return memberRepo.findByGroupIdWithUserOrderByJoinedAtAsc(groupId).stream()
                .map(m -> new GroupMemberDTO(m.getUser().getId(), m.getUser().getName(), m.getRole().name()))
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public java.util.List<com.skillswap.dto.ResourceItemDTO> listResources(UUID groupId) {
        return groupResourceRepo.findByGroupIdWithResource(groupId).stream()
                .map(l -> toDto(l.getResource()))
                .collect(java.util.stream.Collectors.toList());
    }

    public void shareResource(UUID groupId, UUID resourceId, UUID requesterId) {
        if (!memberRepo.existsByGroup_IdAndUser_Id(groupId, requesterId)) throw new SecurityException("Not a member");
        StudyGroup g = groupRepo.findById(groupId).orElseThrow();
        ResourceItem r = resourceItemRepo.findById(resourceId).orElseThrow();
        GroupResourceLink link = new GroupResourceLink();
        link.setGroup(g);
        link.setResource(r);
        link.setAddedAt(java.time.LocalDateTime.now());
        groupResourceRepo.save(link);
    }

    @Transactional(readOnly = true)
    public java.util.List<GroupSessionDTO> listSessions(UUID groupId) {
        return groupSessionRepo.findByGroup_IdOrderByScheduledTimeDesc(groupId).stream().map(this::toDto).toList();
    }

    public GroupSessionDTO scheduleSession(UUID groupId, java.time.LocalDateTime time, Integer duration, UUID creatorId) {
        if (!memberRepo.existsByGroup_IdAndUser_Id(groupId, creatorId)) throw new SecurityException("Not a member");
        StudyGroup g = groupRepo.findById(groupId).orElseThrow();
        User creator = userRepo.findById(creatorId).orElseThrow();
        GroupSession s = new GroupSession();
        s.setGroup(g);
        s.setScheduledTime(time);
        s.setDuration(duration == null ? 60 : duration);
        s.setCreatedBy(creator);
        s.setVideoRoom(java.util.UUID.randomUUID().toString());
        s.setWhiteboardRoom(java.util.UUID.randomUUID().toString());
        s = groupSessionRepo.save(s);
        return toDto(s);
    }

    private com.skillswap.dto.ResourceItemDTO toDto(ResourceItem r) {
        return new com.skillswap.dto.ResourceItemDTO(
                r.getId(),
                r.getSkillName(),
                r.getType(),
                r.getTitle(),
                r.getDescription(),
                r.getUrl(),
                r.getContentType(),
                r.getSizeBytes(),
                r.getCreatedAt() == null ? null : java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(r.getCreatedAt())
        );
    }

    private GroupSessionDTO toDto(GroupSession s) {
        return new GroupSessionDTO(
                s.getId(),
                s.getGroup().getId(),
                s.getScheduledTime(),
                s.getDuration(),
                s.getCreatedBy() == null ? null : s.getCreatedBy().getName(),
                s.getMeetingLink(),
                s.getVideoRoom(),
                s.getWhiteboardRoom(),
                s.getCreatedAt() == null ? null : DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(s.getCreatedAt())
        );
    }
}
