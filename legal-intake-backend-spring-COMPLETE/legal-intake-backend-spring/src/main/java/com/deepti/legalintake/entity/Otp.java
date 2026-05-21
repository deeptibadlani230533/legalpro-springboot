package com.deepti.legalintake.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * OTP ENTITY - replaces models/otp.js
 * Table: "otps" (lowercase, matches your migration tableName)
 *
 * Note: Your OTP model uses UUID primary key (DataTypes.UUID, DataTypes.UUIDV4)
 * We use String to store UUIDs in JPA with @GeneratedValue using UUID strategy.
 */
@Entity
@Table(name = "otps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Otp {

    @Id
    // UUID primary key - same as DataTypes.UUIDV4 in Sequelize
    // We store as String (VARCHAR) to match the existing DB column type
    private String id;

    @PrePersist
    public void generateId() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Builder.Default
    private Boolean verified = false;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;
}