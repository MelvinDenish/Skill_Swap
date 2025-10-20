package com.skillswap.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_skills")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSkills {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(columnDefinition = "TEXT")
    private String skillsOffered; // JSON array as string: ["Java","Python"]

    @Column(columnDefinition = "TEXT")
    private String skillsWanted; // JSON array as string: ["React","AWS"]

    private String availability; // "Weekdays 6-8 PM"

    private Double rating = 0.0;

    private Integer completedSessions = 0;
}
