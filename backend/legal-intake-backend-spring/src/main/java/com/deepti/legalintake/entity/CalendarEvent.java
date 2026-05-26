package com.deepti.legalintake.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * CALENDAR EVENT ENTITY - replaces models/calendarEvent.js
 * Table: "CalendarEvents" (Sequelize default pluralization of modelName "CalendarEvent")
 */
@Entity
@Table(name = "CalendarEvents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    // "hearing", "deadline", "meeting", "reminder"
    @Builder.Default
    private String type = "reminder";

    @Column(nullable = false)
    private LocalDate date;

    private String time;  // e.g. "14:30"

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private Long userId;

    private Long caseId;  // optional link to a case

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", insertable = false, updatable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private User creator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caseId", insertable = false, updatable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Case linkedCase;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;
}