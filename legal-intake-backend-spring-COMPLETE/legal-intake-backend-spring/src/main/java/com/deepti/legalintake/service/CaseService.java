package com.deepti.legalintake.service;

import com.deepti.legalintake.dto.request.AssignLawyerRequest;
import com.deepti.legalintake.dto.request.CreateCaseRequest;
import com.deepti.legalintake.dto.request.UpdateStatusRequest;
import com.deepti.legalintake.entity.Case;
import com.deepti.legalintake.exception.ApiException;
import com.deepti.legalintake.repository.CaseRepository;
import com.deepti.legalintake.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CaseService {

    private final CaseRepository       caseRepository;
    private final UserRepository       userRepository;
    private final AuditService         auditService;
    private final NotificationService  notificationService;
    private final WhatsAppService      whatsApp;

    /* ---- CREATE ---- */
    @Transactional
    public Case createCase(CreateCaseRequest req, Long userId) {
        Case newCase = caseRepository.save(Case.builder()
                .caseTitle(req.getCaseTitle())
                .description(req.getDescription())
                .clientName(req.getClientName())
                .clientEmail(req.getClientEmail())
                .clientPhone(req.getClientPhone())
                .clientAddress(req.getClientAddress())
                .category(req.getCategory())
                .opponentName(req.getOpponentName())
                .claimAmount(req.getClaimAmount())
                .incidentDate(req.getIncidentDate() != null ? LocalDate.parse(req.getIncidentDate()) : null)
                .status("open")
                .userId(userId)
                .build());

        auditService.log(userId, "CASE_CREATED", "CASE", newCase.getId(),
                Map.of("caseTitle", newCase.getCaseTitle(), "clientName", newCase.getClientName()));

        // SSE notification to admins
        notificationService.pushToRole("admin",
                Map.of("type", "NEW_CASE",
                        "message", "New case submitted: " + newCase.getCaseTitle(),
                        "caseId", newCase.getId()));

        // ✅ FIX: Save clientPhone to users table if not already set
        // This ensures WhatsApp works — phone entered during case creation
        // is synced back to the user record so all future notifications fire.
        try {
            String clientPhone = req.getClientPhone();
            if (clientPhone != null && !clientPhone.isBlank()) {
                userRepository.findById(userId).ifPresent(user -> {
                    if (user.getPhone() == null || user.getPhone().isBlank()) {
                        user.setPhone(clientPhone);
                        userRepository.save(user);
                        log.info("Synced phone {} to userId={}", clientPhone, userId);
                    }
                });
            }
        } catch (Exception e) {
            log.warn("Phone sync skipped: {}", e.getMessage());
        }

        // ✅ WhatsApp: tell the client their case was received
        try {
            userRepository.findById(userId).ifPresent(client ->
                    whatsApp.sendCaseReceived(
                            client.getPhone(),
                            client.getName(),
                            newCase.getCaseTitle(),
                            newCase.getId()
                    )
            );
        } catch (Exception e) {
            log.warn("WhatsApp skipped for createCase: {}", e.getMessage());
        }

        return newCase;
    }

    /* ---- GET ALL (role-based) ---- */
    public List<Case> getAllCases(Long userId, String role) {
        return switch (role) {
            case "admin"  -> caseRepository.findAll();
            case "lawyer" -> caseRepository.findByAssignedLawyerIdOrderByCreatedAtDesc(userId);
            case "client" -> caseRepository.findByUserIdOrderByCreatedAtDesc(userId);
            default       -> throw ApiException.forbidden("Unauthorized role");
        };
    }

    /* ---- GET BY ID ---- */
    public Case getCaseById(Long id, Long userId, String role) {
        Case c = caseRepository.findByIdWithLawyer(id)
                .orElseThrow(() -> ApiException.notFound("Case not found"));

        if ("client".equals(role) && !c.getUserId().equals(userId)) {
            throw ApiException.forbidden("Forbidden");
        }
        return c;
    }

    /* ---- UPDATE STATUS ---- */
    @Transactional
    public Case updateCaseStatus(Long id, UpdateStatusRequest req, Long userId) {
        Case c = caseRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Case not found"));

        String oldStatus = c.getStatus();
        c.setStatus(req.getStatus());
        caseRepository.save(c);

        auditService.log(userId, "CASE_STATUS_UPDATED", "CASE", id,
                Map.of("oldStatus", oldStatus, "newStatus", req.getStatus()));

        notificationService.pushToUser(c.getUserId(),
                Map.of("type", "CASE_STATUS_UPDATED",
                        "message", "Your case \"" + c.getCaseTitle() + "\" status changed to: " + req.getStatus(),
                        "caseId", id));

        if (c.getAssignedLawyerId() != null) {
            notificationService.pushToUser(c.getAssignedLawyerId(),
                    Map.of("type", "CASE_STATUS_UPDATED",
                            "message", "Case \"" + c.getCaseTitle() + "\" is now: " + req.getStatus(),
                            "caseId", id));
        }

        return c;
    }

    /* ---- UPDATE CASE ---- */
    @Transactional
    public Case updateCase(Long id, CreateCaseRequest req, Long userId) {
        Case c = caseRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Case not found"));

        if (req.getCaseTitle()   != null) c.setCaseTitle(req.getCaseTitle());
        if (req.getDescription() != null) c.setDescription(req.getDescription());
        if (req.getClientName()  != null) c.setClientName(req.getClientName());
        if (req.getClientEmail() != null) c.setClientEmail(req.getClientEmail());
        if (req.getClientPhone() != null) c.setClientPhone(req.getClientPhone());
        if (req.getCategory()    != null) c.setCategory(req.getCategory());
        if (req.getClaimAmount() != null) c.setClaimAmount(req.getClaimAmount());

        // ✅ FIX: Also sync updated phone back to user record
        try {
            if (req.getClientPhone() != null && !req.getClientPhone().isBlank()) {
                userRepository.findById(userId).ifPresent(user -> {
                    user.setPhone(req.getClientPhone());
                    userRepository.save(user);
                });
            }
        } catch (Exception e) {
            log.warn("Phone sync on update skipped: {}", e.getMessage());
        }

        caseRepository.save(c);
        auditService.log(userId, "CASE_UPDATED", "CASE", id, Map.of("updatedFields", req));

        return c;
    }

    /* ---- DELETE ---- */
    @Transactional
    public void deleteCase(Long id, Long userId) {
        Case c = caseRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Case not found"));

        auditService.log(userId, "CASE_DELETED", "CASE", id,
                Map.of("caseTitle", c.getCaseTitle()));

        caseRepository.delete(c);
    }

    /* ---- ASSIGN LAWYER ---- */
    @Transactional
    public Case assignLawyer(Long caseId, AssignLawyerRequest req, Long adminId) {
        Case c = caseRepository.findById(caseId)
                .orElseThrow(() -> ApiException.notFound("Case not found"));

        if ("closed".equals(c.getStatus()))
            throw ApiException.badRequest("Cannot assign a closed case");
        if (c.getAssignedLawyerId() != null)
            throw ApiException.badRequest("Case is already assigned to a lawyer");
        if (!"open".equals(c.getStatus()))
            throw ApiException.badRequest("Only open cases can be assigned");

        userRepository.findById(req.getLawyerId())
                .orElseThrow(() -> ApiException.notFound("Lawyer not found"));

        c.setAssignedLawyerId(req.getLawyerId());
        c.setStatus("assigned");
        caseRepository.save(c);

        auditService.log(adminId, "CASE_ASSIGNED", "CASE", caseId,
                Map.of("assignedTo", req.getLawyerId()));

        // SSE to lawyer
        notificationService.pushToUser(req.getLawyerId(),
                Map.of("type", "CASE_ASSIGNED",
                        "message", "You have been assigned case: " + c.getCaseTitle(),
                        "caseId", caseId));

        // ✅ WhatsApp: notify client their lawyer was assigned + notify the lawyer
        try {
            userRepository.findById(c.getUserId()).ifPresent(client ->
                    userRepository.findById(req.getLawyerId()).ifPresent(lawyer ->
                            whatsApp.sendLawyerAssigned(
                                    client.getPhone(), client.getName(),
                                    c.getCaseTitle(),
                                    lawyer.getName(), lawyer.getPhone()
                            )
                    )
            );
        } catch (Exception e) {
            log.warn("WhatsApp skipped for assignLawyer: {}", e.getMessage());
        }

        return c;
    }

    /* ---- ACCEPT CASE ---- */
    @Transactional
    public Case acceptCase(Long caseId, Long lawyerId) {
        Case c = caseRepository.findById(caseId)
                .orElseThrow(() -> ApiException.notFound("Case not found"));

        if (!c.getAssignedLawyerId().equals(lawyerId))
            throw ApiException.forbidden("You are not assigned to this case");
        if (!"assigned".equals(c.getStatus()))
            throw ApiException.badRequest("Case must be in assigned state to accept");

        c.setStatus("in_progress");
        caseRepository.save(c);

        auditService.log(lawyerId, "CASE_ACCEPTED", "CASE", caseId, Map.of());

        // ✅ WhatsApp: tell the client their lawyer accepted the case
        try {
            userRepository.findById(c.getUserId()).ifPresent(client ->
                    userRepository.findById(lawyerId).ifPresent(lawyer ->
                            whatsApp.sendCaseAccepted(
                                    client.getPhone(), client.getName(),
                                    c.getCaseTitle(), lawyer.getName()
                            )
                    )
            );
        } catch (Exception e) {
            log.warn("WhatsApp skipped for acceptCase: {}", e.getMessage());
        }

        return c;
    }

    /* ---- CLOSE CASE ---- */
    @Transactional
    public Case closeCase(Long caseId, Long lawyerId) {
        Case c = caseRepository.findById(caseId)
                .orElseThrow(() -> ApiException.notFound("Case not found"));

        if (!c.getAssignedLawyerId().equals(lawyerId))
            throw ApiException.forbidden("Not your case");
        if (!"in_progress".equals(c.getStatus()))
            throw ApiException.badRequest("Case must be in progress to close");

        c.setStatus("closed");
        caseRepository.save(c);

        auditService.log(lawyerId, "CASE_CLOSED", "CASE", caseId, Map.of());

        // ✅ WhatsApp: tell the client their case is closed
        try {
            userRepository.findById(c.getUserId()).ifPresent(client ->
                    whatsApp.sendCaseClosed(
                            client.getPhone(), client.getName(),
                            c.getCaseTitle(), null
                    )
            );
        } catch (Exception e) {
            log.warn("WhatsApp skipped for closeCase: {}", e.getMessage());
        }

        return c;
    }

    /* ---- LAWYER CASES ---- */
    public Map<String, Object> getLawyerCases(Long lawyerId) {
        List<Case> cases = caseRepository.findByAssignedLawyerIdOrderByCreatedAtDesc(lawyerId);
        return Map.of("count", cases.size(), "cases", cases);
    }
}