package com.skillswap.repository;

import com.skillswap.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByRevieweeIdOrderByCreatedAtDesc(UUID revieweeId);
    Optional<Review> findBySessionIdAndReviewerId(UUID sessionId, UUID reviewerId);
}
