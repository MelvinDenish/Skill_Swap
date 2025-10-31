package com.skillswap.repository;

import com.skillswap.entity.StudyGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface StudyGroupRepository extends JpaRepository<StudyGroup, UUID> {
    Page<StudyGroup> findByRelatedSkillIgnoreCaseContaining(String skill, Pageable pageable);
}
