package com.skillswap.repository;

import com.skillswap.entity.SkillSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface SkillSessionRepository extends JpaRepository<SkillSession, UUID> {
    @Query("select s from SkillSession s where s.teacher.id = :userId or s.learner.id = :userId order by s.scheduledTime desc")
    List<SkillSession> findMySessions(@Param("userId") UUID userId);
}
