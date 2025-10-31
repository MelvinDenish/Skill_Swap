package com.skillswap.repository;

import com.skillswap.entity.GroupSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GroupSessionRepository extends JpaRepository<GroupSession, UUID> {
    List<GroupSession> findByGroup_IdOrderByScheduledTimeDesc(UUID groupId);
}
