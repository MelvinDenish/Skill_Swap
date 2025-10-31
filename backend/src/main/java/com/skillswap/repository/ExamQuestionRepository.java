package com.skillswap.repository;

import com.skillswap.entity.ExamQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, UUID> {
    List<ExamQuestion> findTop50BySkillIgnoreCaseAndDifficultyLevelIgnoreCase(String skill, String difficultyLevel);
    List<ExamQuestion> findTop50BySkillIgnoreCase(String skill);

    @Query(value = "SELECT * FROM exam_questions WHERE LOWER(skill)=LOWER(:skill) ORDER BY RANDOM() LIMIT :count", nativeQuery = true)
    List<ExamQuestion> randomBySkill(@Param("skill") String skill, @Param("count") int count);

    @Query(value = "SELECT * FROM exam_questions WHERE LOWER(skill)=LOWER(:skill) AND LOWER(difficulty_level)=LOWER(:difficulty) ORDER BY RANDOM() LIMIT :count", nativeQuery = true)
    List<ExamQuestion> randomBySkillAndDifficulty(@Param("skill") String skill, @Param("difficulty") String difficulty, @Param("count") int count);

    @Query(value = "SELECT * FROM exam_questions ORDER BY RANDOM() LIMIT :count", nativeQuery = true)
    List<ExamQuestion> randomGlobal(@Param("count") int count);
}
