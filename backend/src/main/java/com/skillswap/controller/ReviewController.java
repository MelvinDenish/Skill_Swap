package com.skillswap.controller;

import com.skillswap.dto.ReviewDTO;
import com.skillswap.dto.ReviewViewDTO;
import com.skillswap.entity.Review;
import com.skillswap.entity.SkillSession;
import com.skillswap.entity.SessionStatus;
import com.skillswap.entity.User;
import com.skillswap.entity.UserSkills;
import com.skillswap.repository.ReviewRepository;
import com.skillswap.repository.SkillSessionRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserSkillsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private SkillSessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSkillsRepository userSkillsRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewViewDTO>> getUserReviews(@PathVariable UUID userId) {
        List<Review> list = reviewRepository.findByRevieweeIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(list.stream().map(this::mapToView).toList());
    }

    @PostMapping
    public ResponseEntity<?> submit(@AuthenticationPrincipal UserDetails principal,
                                    @RequestBody ReviewDTO dto) {
        User reviewer = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        SkillSession session = sessionRepository.findById(dto.sessionId()).orElseThrow();

        if (session.getStatus() != SessionStatus.COMPLETED) {
            return ResponseEntity.badRequest().body("Session must be COMPLETED to review");
        }

        if (reviewRepository.findBySessionIdAndReviewerId(dto.sessionId(), reviewer.getId()).isPresent()) {
            return ResponseEntity.badRequest().body("You already reviewed this session");
        }

        if (dto.rating() == null || dto.rating() < 1 || dto.rating() > 5) {
            return ResponseEntity.badRequest().body("Rating must be between 1 and 5");
        }

        User reviewee = reviewer.getId().equals(session.getTeacher().getId()) ? session.getLearner() : session.getTeacher();

        Review r = new Review();
        r.setSession(session);
        r.setReviewer(reviewer);
        r.setReviewee(reviewee);
        r.setRating(dto.rating());
        r.setComment(dto.comment());
        reviewRepository.save(r);

        // Recompute reviewee rating
        List<Review> reviews = reviewRepository.findByRevieweeIdOrderByCreatedAtDesc(reviewee.getId());
        DoubleSummaryStatistics stats = reviews.stream().mapToDouble(Review::getRating).summaryStatistics();
        double avg = reviews.isEmpty() ? 0.0 : Math.round((stats.getAverage()) * 10.0) / 10.0;
        UserSkills rs = userSkillsRepository.findByUserId(reviewee.getId()).orElseThrow();
        rs.setRating(avg);
        userSkillsRepository.save(rs);

        return ResponseEntity.ok(mapToView(r));
    }

    private ReviewViewDTO mapToView(Review r) {
        return new ReviewViewDTO(
                r.getId(),
                r.getReviewer().getId(),
                r.getReviewer().getName(),
                r.getReviewer().getProfilePictureUrl(),
                r.getReviewee().getId(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt()
        );
    }
}
