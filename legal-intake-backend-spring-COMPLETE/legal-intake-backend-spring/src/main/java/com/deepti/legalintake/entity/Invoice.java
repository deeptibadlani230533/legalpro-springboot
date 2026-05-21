package com.deepti.legalintake.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "Invoices")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {

    @Id
    private String id;

    @PrePersist
    public void generateId() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    @Column(nullable = false)
    private Long caseId;

    @Column(nullable = false)
    private Integer amount;

    @Builder.Default
    private Integer paid = 0;

    // "paid", "pending", "partial", "overdue"
    @Builder.Default
    private String status = "pending";

    private LocalDate issuedOn;
    private LocalDate dueOn;

    @Builder.Default
    private Double hours = 0.0;

    // ✅ FIX: Changed from LAZY to EAGER so caseEntity (with its User) is always
    //         serialized in API responses — frontend needs caseEntity.title and
    //         caseEntity.User.name without an explicit second fetch.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "caseId", insertable = false, updatable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Case caseEntity;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;
}