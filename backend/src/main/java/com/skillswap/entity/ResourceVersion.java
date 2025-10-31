package com.skillswap.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "resource_versions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id")
    private ResourceItem resource;

    private Integer version;

    private String fileKey;

    private String url;

    private String contentType;

    private Long sizeBytes;

    private LocalDateTime uploadedAt;
}
