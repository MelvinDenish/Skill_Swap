package com.skillswap.repository;

import com.skillswap.entity.ResourceItem;
import com.skillswap.entity.ResourceVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResourceVersionRepository extends JpaRepository<ResourceVersion, UUID> {
    List<ResourceVersion> findByResource_IdOrderByVersionDesc(UUID resourceId);
    Optional<ResourceVersion> findByResource_IdAndVersion(UUID resourceId, Integer version);
    long countByResource_Id(UUID resourceId);
}
