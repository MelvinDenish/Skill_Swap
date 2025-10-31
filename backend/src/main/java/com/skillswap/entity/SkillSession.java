package com.skillswap.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "skill_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class SkillSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "teacher_id")
    private User teacher;

    @ManyToOne
    @JoinColumn(name = "learner_id")
    private User learner;

    private String skillTopic;

    private LocalDateTime scheduledTime;

    private Integer duration = 60; // minutes

    @Enumerated(EnumType.STRING)
    private SessionStatus status = SessionStatus.PENDING;

    private String meetingLink;

    private String videoRoom;

    private String whiteboardRoom;

    @CreatedDate
    private LocalDateTime createdAt;
}
