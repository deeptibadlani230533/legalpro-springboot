package com.deepti.legalintake.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "Users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "passwordHash", nullable = false)
    private String passwordHash;

    // "admin", "lawyer", "client"
    @Column(nullable = false)
    private String role;

    /**
     * Account approval status:
     *   "pending"  — newly registered, awaiting admin approval
     *   "active"   — approved, can log in normally
     *   "rejected" — admin rejected, cannot log in
     *
     * Default is "pending" for all new signups including Google OAuth.
     * Existing seeded admin has status = "active" (set in DataSeeder).
     */
    @Column(nullable = false)
    @Builder.Default
    private String status = "pending";

    @Column
    private String phone;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Case> createdCases;

    @OneToMany(mappedBy = "assignedLawyer", fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Case> assignedCases;
}
