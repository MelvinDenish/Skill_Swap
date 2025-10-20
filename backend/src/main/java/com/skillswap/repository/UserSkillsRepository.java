package com.skillswap.repository;

import com.skillswap.entity.UserSkills;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserSkillsRepository extends JpaRepository<UserSkills, UUID> {
    @Query("select us from UserSkills us where us.user.id = :userId")
    Optional<UserSkills> findByUserId(@Param("userId") UUID userId);
}
