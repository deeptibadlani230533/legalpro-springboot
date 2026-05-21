package com.deepti.legalintake.controller;

import com.deepti.legalintake.dto.request.AssignLawyerRequest;
import com.deepti.legalintake.dto.request.CreateCaseRequest;
import com.deepti.legalintake.dto.request.UpdateStatusRequest;
import com.deepti.legalintake.entity.AuditLog;
import com.deepti.legalintake.entity.Case;
import com.deepti.legalintake.service.AuditService;
import com.deepti.legalintake.service.CaseService;
import com.deepti.legalintake.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * CASE CONTROLLER - replaces caseController.js + caseRoutes.js
 *
 * @PreAuthorize replaces: preHandler: [authenticate, allowRoles("admin")]
 *
 * hasRole('admin')           = allowRoles("admin")
 * hasAnyRole('admin','lawyer') = allowRoles("admin", "lawyer")
 * isAuthenticated()          = authenticate (any logged-in user)
 *
 * The SecurityUtils.getCurrentUserId() replaces req.user.id
 * The SecurityUtils.getCurrentUserRole() replaces req.user.role
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Cases", description = "Legal case management")
public class CaseController {

    private final CaseService caseService;
    private final AuditService auditService;
    private final SecurityUtils securityUtils;

    /** POST /api/cases - replaces app.post("/cases", allowRoles("client"), caseController.createCase) */
    @PostMapping("/cases")
    @PreAuthorize("hasRole('client')")
    @Operation(summary = "Submit a new case (client only)")
    public ResponseEntity<Map<String, Object>> createCase(@Valid @RequestBody CreateCaseRequest req) {
        Case c = caseService.createCase(req, securityUtils.getCurrentUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Case created successfully", "case", c));
    }

    /** GET /api/cases - role-based: admin sees all, lawyer sees assigned, client sees own */
    @GetMapping("/cases")
    @PreAuthorize("hasAnyRole('admin','lawyer','client')")
    public ResponseEntity<List<Case>> getAllCases() {
        return ResponseEntity.ok(
                caseService.getAllCases(securityUtils.getCurrentUserId(), securityUtils.getCurrentUserRole()));
    }

    /** GET /api/cases/:id */
    @GetMapping("/cases/{id}")
    @PreAuthorize("hasAnyRole('admin','lawyer','client')")
    public ResponseEntity<Case> getCaseById(@PathVariable Long id) {
        return ResponseEntity.ok(
                caseService.getCaseById(id, securityUtils.getCurrentUserId(), securityUtils.getCurrentUserRole()));
    }

    /** PATCH /api/cases/:id/status - admin only */
    @PatchMapping("/cases/{id}/status")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Case> updateCaseStatus(@PathVariable Long id,
                                                 @Valid @RequestBody UpdateStatusRequest req) {
        return ResponseEntity.ok(caseService.updateCaseStatus(id, req, securityUtils.getCurrentUserId()));
    }

    /** PUT /api/cases/:id - admin only */
    @PutMapping("/cases/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Case> updateCase(@PathVariable Long id,
                                           @RequestBody CreateCaseRequest req) {
        return ResponseEntity.ok(caseService.updateCase(id, req, securityUtils.getCurrentUserId()));
    }

    /** DELETE /api/cases/:id - admin only */
    @DeleteMapping("/cases/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Map<String, String>> deleteCase(@PathVariable Long id) {
        caseService.deleteCase(id, securityUtils.getCurrentUserId());
        return ResponseEntity.ok(Map.of("message", "Case deleted successfully"));
    }

    /** PATCH /api/cases/:id/assign - admin only */
    @PatchMapping("/cases/{id}/assign")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Map<String, Object>> assignLawyer(@PathVariable Long id,
                                                            @Valid @RequestBody AssignLawyerRequest req) {
        Case c = caseService.assignLawyer(id, req, securityUtils.getCurrentUserId());
        return ResponseEntity.ok(Map.of("message", "Lawyer assigned successfully", "case", c));
    }

    /** PATCH /api/cases/:id/accept - lawyer only */
    @PatchMapping("/cases/{id}/accept")
    @PreAuthorize("hasRole('lawyer')")
    public ResponseEntity<Map<String, Object>> acceptCase(@PathVariable Long id) {
        Case c = caseService.acceptCase(id, securityUtils.getCurrentUserId());
        return ResponseEntity.ok(Map.of("message", "Case accepted successfully", "case", c));
    }

    /** PATCH /api/cases/:id/close - lawyer only */
    @PatchMapping("/cases/{id}/close")
    @PreAuthorize("hasRole('lawyer')")
    public ResponseEntity<Map<String, Object>> closeCase(@PathVariable Long id) {
        Case c = caseService.closeCase(id, securityUtils.getCurrentUserId());
        return ResponseEntity.ok(Map.of("message", "Case closed successfully", "case", c));
    }

    /** GET /api/lawyer/cases - lawyer only */
    @GetMapping("/lawyer/cases")
    @PreAuthorize("hasRole('lawyer')")
    public ResponseEntity<Map<String, Object>> getLawyerCases() {
        return ResponseEntity.ok(caseService.getLawyerCases(securityUtils.getCurrentUserId()));
    }

    /** GET /api/cases/:id/activity - replaces getCaseActivity */
    @GetMapping("/cases/{id}/activity")
    @PreAuthorize("hasAnyRole('admin','lawyer','client')")
    public ResponseEntity<List<AuditLog>> getCaseActivity(@PathVariable Long id) {
        return ResponseEntity.ok(auditService.getCaseActivity(id));
    }

    /** GET /api/activity - dashboard recent activity */
    @GetMapping("/activity")
    @PreAuthorize("hasAnyRole('admin','lawyer','client')")
    public ResponseEntity<List<Map<String, Object>>> getAllActivity() {
        List<AuditLog> logs = auditService.getRecentActivity(10);
        List<Map<String, Object>> formatted = logs.stream()
                .map(log -> Map.<String, Object>of(
                        "message", (log.getUser() != null ? log.getUser().getName() : "System")
                                + " " + log.getAction(),
                        "createdAt", log.getCreatedAt()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(formatted);
    }
}