package com.skillswap.repository;

import com.skillswap.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {
    Page<Message> findByConversation_IdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

    @Query("select count(m) from Message m where m.conversation.id = :conversationId and m.isRead = false and m.sender.id <> :userId")
    long countUnread(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId);
}
