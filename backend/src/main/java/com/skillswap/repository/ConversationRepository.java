package com.skillswap.repository;

import com.skillswap.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    Optional<Conversation> findByPairKey(String pairKey);
    List<Conversation> findByUser1_IdOrUser2_IdOrderByLastMessageTimeDesc(UUID u1, UUID u2);
}
