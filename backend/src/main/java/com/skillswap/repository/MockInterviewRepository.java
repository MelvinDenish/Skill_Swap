package com.skillswap.repository;

import com.skillswap.entity.MockInterview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface MockInterviewRepository extends JpaRepository<MockInterview, UUID> {
    List<MockInterview> findByUser1_IdOrUser2_IdOrderByScheduledTimeDesc(UUID user1Id, UUID user2Id);
    List<MockInterview> findByScheduledTimeBetween(LocalDateTime start, LocalDateTime end);
}
