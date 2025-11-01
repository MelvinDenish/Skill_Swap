package com.skillswap.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "group_resources")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupResourceLink {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private StudyGroup group;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_item_id")
    private ResourceItem resource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shared_by")
    private User sharedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "added_at")
    private LocalDateTime addedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (addedAt == null) {
            addedAt = createdAt;
        }
    }
}
