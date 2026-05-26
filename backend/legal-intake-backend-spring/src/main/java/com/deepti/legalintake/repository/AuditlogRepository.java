package com.deepti.legalintake.repository;

import com.deepti.legalintake.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditlogRepository extends JpaRepository<AuditLog, Long> {

    // replaces: AuditLog.findAll({ where: { entityType:"CASE", entityId: caseId }, include: [User] })
    @Query("SELECT a FROM AuditLog a LEFT JOIN FETCH a.user WHERE a.entityType = :entityType AND a.entityId = :entityId ORDER BY a.createdAt DESC")
    List<AuditLog> findByCaseActivity(String entityType, Long entityId);

    // replaces: AuditLog.findAll({ order:[["createdAt","DESC"]], limit:10, include:[User,Case] })
    @Query("SELECT a FROM AuditLog a LEFT JOIN FETCH a.user ORDER BY a.createdAt DESC")
    List<AuditLog> findTop10ByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);

    void deleteByUserId(Long userId);


}