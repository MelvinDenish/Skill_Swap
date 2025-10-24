package com.skillswap.repository;

import com.skillswap.entity.ResourceItem;
import com.skillswap.entity.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ResourceItemRepository extends JpaRepository<ResourceItem, UUID> {
    @Query("select r from ResourceItem r where r.session.id = :sessionId order by r.createdAt desc")
    List<ResourceItem> findBySessionId(@Param("sessionId") UUID sessionId);

    @Query("select r from ResourceItem r where r.skillName = :skill order by r.createdAt desc")
    List<ResourceItem> findBySkill(@Param("skill") String skill);

    @Query("select r from ResourceItem r where r.owner.id = :ownerId order by r.createdAt desc")
    List<ResourceItem> findByOwnerId(@Param("ownerId") UUID ownerId);

    @Query("select r from ResourceItem r order by r.createdAt desc")
    List<ResourceItem> findAllOrderByCreatedAtDesc();
}
