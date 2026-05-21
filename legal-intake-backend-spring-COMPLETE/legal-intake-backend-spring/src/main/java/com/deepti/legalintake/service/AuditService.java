package com.deepti.legalintake.service;

import com.deepti.legalintake.entity.AuditLog;
import com.deepti.legalintake.repository.AuditlogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * AUDIT SERVICE - replaces services/audit.service.js
 *
 * Provides two things:
 * 1. log() = manual audit logging (called explicitly in services)
 *    replaces: logActivity({ userId, action, entityType, entityId, meta })
 * 2. getCaseActivity() = fetch audit history for a specific case
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditlogRepository auditLogRepository;

    /**
     * replaces: logActivity() in audit.service.js
     * Called manually in CaseService, DocumentService etc.
     * Also called automatically by AuditAspect (our AOP interceptor)
     */
    public void log(Long userId, String action, String entityType, Long entityId, Map<String, Object> meta) {
        try {
            auditLogRepository.save(AuditLog.builder()
                    .userId(userId)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .meta(meta)
                    .build());
        } catch (Exception e) {
            // Audit log failure should never crash the main operation
            log.error("Audit log failed: {}", e.getMessage());
        }
    }

    /**
     * replaces: getCaseActivity() in audit.service.js
     * Returns audit history for a specific case, with user info joined
     */
    public List<AuditLog> getCaseActivity(Long caseId) {
        return auditLogRepository.findByCaseActivity("CASE", caseId);
    }

    /**
     * Get recent activity across all entities (for dashboard)
     * replaces: AuditLog.findAll({ order:[["createdAt","DESC"]], limit:10, include:[User] })
     */
    public List<AuditLog> getRecentActivity(int limit) {
        return auditLogRepository.findTop10ByOrderByCreatedAtDesc(PageRequest.of(0, limit));
    }
}