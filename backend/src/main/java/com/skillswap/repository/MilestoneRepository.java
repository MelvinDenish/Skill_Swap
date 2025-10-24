package com.skillswap.repository;

import com.skillswap.entity.Milestone;
import com.skillswap.entity.MilestoneStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MilestoneRepository extends JpaRepository<Milestone, UUID> {
    @Query("select m from Milestone m where m.user.id = :userId order by m.createdAt desc")
    List<Milestone> findByUserId(@Param("userId") UUID userId);

    @Query("select m from Milestone m where m.user.id = :userId and m.skillName = :skill order by m.createdAt desc")
    List<Milestone> findByUserIdAndSkill(@Param("userId") UUID userId, @Param("skill") String skill);

    long countByUserIdAndStatus(UUID userId, MilestoneStatus status);
}
