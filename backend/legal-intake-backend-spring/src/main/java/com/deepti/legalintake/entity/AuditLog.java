package com.deepti.legalintake.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * AUDIT LOG ENTITY - replaces models/auditLog.js
 * Table: "audit_logs" (matches your Sequelize tableName: "audit_logs")
 *
 * The `meta` field stores JSON in Sequelize (DataTypes.JSON).
 * In JPA we use @JdbcTypeCode(SqlTypes.JSON) to map a Map<String,Object>
 * to a PostgreSQL JSON column.
 */
@Entity
@Table(name = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action;        // "CASE_CREATED", "CASE_ASSIGNED" etc.

    @Column(nullable = false)
    private String entityType;    // "CASE", "DOCUMENT" etc.

    @Column(nullable = false)
    private Long entityId;

    // JSON column - maps to PostgreSQL JSON type
    // Map<String, Object> because the meta object is dynamic (different fields per action)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private Map<String, Object> meta;

    // FK to the User who performed the action
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", insertable = false, updatable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;
}