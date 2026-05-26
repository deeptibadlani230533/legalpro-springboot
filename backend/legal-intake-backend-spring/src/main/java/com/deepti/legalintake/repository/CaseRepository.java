package com.deepti.legalintake.repository;

import com.deepti.legalintake.entity.Case;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CaseRepository extends JpaRepository<Case, Long> {

    // replaces: Case.findAll({ where: { assignedLawyerId: lawyerId }, order: [["createdAt","DESC"]] })
    List<Case> findByAssignedLawyerIdOrderByCreatedAtDesc(Long lawyerId);

    // replaces: Case.findAll({ where: { userId: clientId }, order: [["createdAt","DESC"]] })
    List<Case> findByUserIdOrderByCreatedAtDesc(Long userId);

    // replaces: Case.count({ where: { status: "open" } })
    long countByStatus(String status);

    // Fetch case with its assignedLawyer loaded (avoids N+1 query)
    // This is a JPQL query - like SQL but uses Java class names instead of table names
    // replaces: Case.findByPk(id, { include: [{ model: User, as: "assignedLawyer" }] })
    @Query("SELECT c FROM Case c LEFT JOIN FETCH c.assignedLawyer WHERE c.id = :id")
    Optional<Case> findByIdWithLawyer(Long id);

    void deleteByUserId(Long userId);
}