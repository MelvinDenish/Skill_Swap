package com.skillswap.repository;

import com.skillswap.entity.GroupResourceLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;
import java.util.List;

public interface GroupResourceLinkRepository extends JpaRepository<GroupResourceLink, UUID> {
    @Query("select l from GroupResourceLink l join fetch l.resource where l.group.id = :groupId order by l.addedAt desc")
    List<GroupResourceLink> findByGroupIdWithResource(@Param("groupId") UUID groupId);
}
