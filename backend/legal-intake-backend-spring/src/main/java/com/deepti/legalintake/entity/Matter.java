package com.deepti.legalintake.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * MATTER ENTITY - replaces models/matter.js
 * Table: "matters" (matches your Sequelize tableName: "matters")
 * Uses UUID primary key (same as DataTypes.UUIDV4 in Sequelize)
 */
@Entity
@Table(name = "matters")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Matter {

    @Id
    private String id;

    @PrePersist
    public void generateId() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    // "open", "in_progress", "closed"
    @Column(nullable = false)
    @Builder.Default
    private String status = "open";

    // Matches Sequelize field: "closed_at" (field: "closed_at" in your model)
    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(nullable = false)
    private String clientName;

    private String assignedLawyerId;

    // One Matter has many Tasks - cascade delete
    @OneToMany(mappedBy = "matter", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Task> tasks;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;
}