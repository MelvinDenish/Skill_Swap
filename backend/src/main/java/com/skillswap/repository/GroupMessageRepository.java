package com.skillswap.repository;

import com.skillswap.entity.GroupMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface GroupMessageRepository extends JpaRepository<GroupMessage, UUID> {
    List<GroupMessage> findTop50ByGroup_IdOrderByCreatedAtDesc(UUID groupId);

    @Query("select m from GroupMessage m join fetch m.sender where m.group.id = :groupId order by m.createdAt desc")
    List<GroupMessage> findRecentByGroupIdWithSender(@Param("groupId") UUID groupId, Pageable pageable);
}
