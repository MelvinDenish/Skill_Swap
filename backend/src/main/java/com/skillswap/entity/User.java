package com.skillswap.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String name;

    @Column(unique = true)
    private String email;

    private String password; // BCrypt hashed

    @Column(length = 500)
    private String bio;

    private String profilePictureUrl;

    private Integer points = 0;

    private String level = "Beginner"; // Auto-calculated from points

    private Boolean twoFactorEnabled = false;

    private String totpSecret;

    private String timezone = "UTC";

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private UserSkills userSkills;

    @OneToMany(mappedBy = "reviewee", fetch = FetchType.LAZY)
    private List<Review> reviewsReceived;
}
