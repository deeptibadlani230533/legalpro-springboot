package com.deepti.legalintake.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * CASE ENTITY - replaces models/case.js
 *
 * Table name is "Cases" - exact match to your Sequelize migration:
 *   queryInterface.createTable("Cases", { ... })
 *
 * All column names match exactly what's in your PostgreSQL DB.
 * Since we set PhysicalNamingStrategyStandardImpl in application.properties,
 * Hibernate uses field names AS-IS (no snake_case conversion).
 */
@Entity
@Table(name = "Cases")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Case {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String caseTitle;

    @Column(columnDefinition = "TEXT")
    private String description;

    // "open", "assigned", "in_progress", "closed"
    @Column(nullable = false)
    @Builder.Default
    private String status = "open";

    // Client info fields
    private String clientName;
    private String clientEmail;
    private String clientPhone;

    @Column(columnDefinition = "TEXT")
    private String clientAddress;

    // Case detail fields
    private String category;

    @Builder.Default
    private String priority = "medium";

    private LocalDate incidentDate;
    private String opponentName;

    @Column(columnDefinition = "float8")
    private Double claimAmount;

    // Foreign keys
    @Column(nullable = false)
    private Long userId;           // the client who created this case

    private Long assignedLawyerId;  // the lawyer assigned to this case

    // ---- JPA Associations ----
    // @ManyToOne: many Cases can belong to one User (the client/owner)
    // @JoinColumn: the FK column in the Cases table is "userId"
    // fetch = LAZY means: don't load the User object unless you explicitly call getOwner()
    // This is critical for performance - avoids N+1 queries
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", insertable = false, updatable = false)
    // insertable/updatable = false because we manage userId directly as a Long field above
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User owner;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignedLawyerId", insertable = false, updatable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User assignedLawyer;

    // One Case has many Documents - cascade delete (onDelete: 'CASCADE')
    @JsonIgnore
    @OneToMany(mappedBy = "caseEntity", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Document> documents;

    // Timestamps
    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;
}