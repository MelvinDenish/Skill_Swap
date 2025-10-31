package com.skillswap.repository;

import com.skillswap.entity.AiChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AiChatMessageRepository extends JpaRepository<AiChatMessage, UUID> {
    Page<AiChatMessage> findByUserId(UUID userId, Pageable pageable);
}
