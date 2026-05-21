package com.deepti.legalintake.service;

import com.deepti.legalintake.entity.User;
import com.deepti.legalintake.exception.ApiException;
import com.deepti.legalintake.repository.AuditlogRepository;
import com.deepti.legalintake.repository.CaseRepository;
import com.deepti.legalintake.repository.InvoiceRepository;
import com.deepti.legalintake.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository     userRepository;
    private final CaseRepository     caseRepository;
    private final InvoiceRepository  invoiceRepository;
    private final AuditlogRepository auditlogRepository;
    private final JavaMailSender     mailSender;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getLawyers() {
        return userRepository.findByRoleOrderByCreatedAtDesc("lawyer");
    }

    // ─── APPROVE USER ─────────────────────────────────────────────────────────

    @Transactional
    public Map<String, String> approveUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        if (!"pending".equals(user.getStatus())) {
            throw ApiException.badRequest("User is not in pending status");
        }

        user.setStatus("active");
        userRepository.save(user);
        log.info("Approved userId={} ({})", id, user.getEmail());
        sendApprovalEmail(user.getEmail(), user.getName());

        return Map.of("message", "User approved successfully");
    }

    // ─── REJECT USER ──────────────────────────────────────────────────────────

    @Transactional
    public Map<String, String> rejectUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        user.setStatus("rejected");
        userRepository.save(user);
        log.info("Rejected userId={} ({})", id, user.getEmail());
        sendRejectionEmail(user.getEmail(), user.getName());

        return Map.of("message", "User rejected");
    }

    // ─── DELETE USER ──────────────────────────────────────────────────────────

    @Transactional
    public Map<String, String> deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        try {
            caseRepository.findByUserIdOrderByCreatedAtDesc(id).forEach(c -> {
                invoiceRepository.deleteByCaseId(c.getId());
                log.info("Deleted invoices for caseId={}", c.getId());
            });
        } catch (Exception e) {
            log.warn("Could not delete invoices for userId={}: {}", id, e.getMessage());
        }

        try {
            caseRepository.deleteByUserId(id);
            log.info("Deleted cases for userId={}", id);
        } catch (Exception e) {
            log.warn("Could not delete cases for userId={}: {}", id, e.getMessage());
        }

        try {
            caseRepository.findByAssignedLawyerIdOrderByCreatedAtDesc(id).forEach(c -> {
                c.setAssignedLawyerId(null);
                c.setStatus("open");
                caseRepository.save(c);
            });
            log.info("Unassigned lawyer cases for userId={}", id);
        } catch (Exception e) {
            log.warn("Could not unassign lawyer cases for userId={}: {}", id, e.getMessage());
        }

        auditlogRepository.deleteByUserId(id);
        userRepository.delete(user);
        log.info("Deleted userId={} ({})", id, user.getEmail());

        return Map.of("message", "User deleted successfully");
    }

    // ─── EMAIL HELPERS ────────────────────────────────────────────────────────

    private void sendApprovalEmail(String toEmail, String name) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(toEmail);
            msg.setSubject("Your LegalPro Access Has Been Approved");
            msg.setText(
                    "Dear " + name + ",\n\n" +
                            "Your access request to LegalPro has been approved.\n" +
                            "You can now log in at: http://localhost:5173/login\n\n" +
                            "Welcome to the firm.\n\n— LegalPro Management Systems"
            );
            mailSender.send(msg);
        } catch (Exception e) {
            log.warn("Could not send approval email to {}: {}", toEmail, e.getMessage());
        }
    }

    private void sendRejectionEmail(String toEmail, String name) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(toEmail);
            msg.setSubject("LegalPro — Access Request Update");
            msg.setText(
                    "Dear " + name + ",\n\n" +
                            "We regret to inform you that your access request could not be approved at this time.\n" +
                            "Please contact the firm directly for further assistance.\n\n" +
                            "— LegalPro Management Systems"
            );
            mailSender.send(msg);
        } catch (Exception e) {
            log.warn("Could not send rejection email to {}: {}", toEmail, e.getMessage());
        }
    }
}
