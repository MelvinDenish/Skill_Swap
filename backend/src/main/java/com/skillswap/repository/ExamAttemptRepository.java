package com.skillswap.repository;

import com.skillswap.entity.ExamAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, UUID> {
    Page<ExamAttempt> findByUser_IdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    List<ExamAttempt> findByUser_IdAndCreatedAtBetween(UUID userId, LocalDateTime start, LocalDateTime end);
}
